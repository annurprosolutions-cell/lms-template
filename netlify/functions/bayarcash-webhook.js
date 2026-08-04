// Receives payment result callbacks from Bayarcash and grants access
// (course purchase or subscription activation) once a transaction is
// confirmed successful.
//
// IMPORTANT — CONFIRM BEFORE GOING LIVE:
// 1. Bayarcash may call this URL as a form-encoded POST (not JSON) — check
//    the raw payload shape in sandbox and adjust parsing below if needed.
// 2. Status code meaning: the SDK docs show status '3' used as the example
//    for "successful transactions" — this function treats status === '3'
//    as success. CONFIRM the full status code list in your Bayarcash
//    console/dashboard before relying on this in production.
// 3. Bayarcash also sends a separate "pre-transaction" callback
//    (verifyPreTransactionCallbackData in their SDK) before the final one —
//    this function only processes the final transaction callback and
//    ignores others (checked via presence of `transaction_id` + `status`).

import { createClient } from '@supabase/supabase-js'
import { verifyTransactionCallbackChecksum } from './_bayarcashChecksum.js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUCCESS_STATUS_CODE = '3'

function parseBody(event) {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || ''
  if (contentType.includes('application/json')) {
    return JSON.parse(event.body)
  }
  // form-urlencoded fallback
  const params = new URLSearchParams(event.body)
  return Object.fromEntries(params.entries())
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let callbackData
  try {
    callbackData = parseBody(event)
  } catch (err) {
    console.error('Failed to parse webhook body', err)
    return { statusCode: 400, body: 'Bad request' }
  }

  // Ignore pre-transaction callbacks (no transaction_id/status yet)
  if (!callbackData.transaction_id || !callbackData.status) {
    return { statusCode: 200, body: 'Ignored (not a final transaction callback)' }
  }

  const isValid = verifyTransactionCallbackChecksum(
    callbackData,
    process.env.BAYARCASH_API_SECRET_KEY
  )

  if (!isValid) {
    console.error('Bayarcash webhook checksum mismatch', callbackData)
    return { statusCode: 400, body: 'Invalid checksum' }
  }

  const orderNumber = callbackData.order_number
  const isSuccess = String(callbackData.status) === SUCCESS_STATUS_CODE

  const { data: tx } = await supabaseAdmin
    .from('payment_transactions')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (!tx) {
    console.error('No matching transaction for order_number', orderNumber)
    return { statusCode: 404, body: 'Transaction not found' }
  }

  // Idempotency: if we already marked this success, don't grant access twice
  if (tx.status === 'success') {
    return { statusCode: 200, body: 'Already processed' }
  }

  await supabaseAdmin
    .from('payment_transactions')
    .update({
      status: isSuccess ? 'success' : 'failed',
      bayarcash_status: String(callbackData.status),
      raw_callback: callbackData,
      updated_at: new Date().toISOString(),
    })
    .eq('order_number', orderNumber)

  if (!isSuccess) {
    return { statusCode: 200, body: 'Recorded as failed' }
  }

  // Grant access
  if (tx.purchase_type === 'course') {
    await supabaseAdmin.from('course_purchases').upsert(
      {
        user_id: tx.user_id,
        course_id: tx.reference_id,
        status: 'paid',
        price_paid_myr: tx.amount_myr,
      },
      { onConflict: 'user_id,course_id' }
    )
  } else if (tx.purchase_type === 'subscription') {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', tx.reference_id)
      .single()

    const startedAt = new Date()
    const expiresAt = plan?.duration_days
      ? new Date(startedAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)
      : null

    await supabaseAdmin.from('user_subscriptions').insert({
      user_id: tx.user_id,
      plan_id: tx.reference_id,
      status: 'active',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })
  }

  return { statusCode: 200, body: 'OK' }
}
