// Creates a Bayarcash payment intent and returns the checkout URL for the
// browser to redirect to. Called from the frontend when the user clicks
// "Beli Kursus Ini" or "Langgan Sekarang".
//
// Env vars required (set in Netlify dashboard, never in frontend code):
//   BAYARCASH_API_TOKEN, BAYARCASH_API_SECRET_KEY, BAYARCASH_PORTAL_KEY,
//   BAYARCASH_ENV (sandbox|production), SITE_URL,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// NOTE ON ACCURACY: the payment-intents endpoint, request field names, and
// checksum algorithm below are taken directly from Bayarcash's official PHP
// SDK source (webimpian/bayarcash-php-sdk on GitHub) as of the time this was
// written. Before going live, run one real transaction in SANDBOX mode and
// compare the response shape against what this function expects (`url` /
// `payment_url` field) — payment gateway API responses do change, so verify
// once against https://api.webimpian.support/bayarcash before trusting this
// with real money.

import { createClient } from '@supabase/supabase-js'
import { createPaymentIntentChecksum } from './_bayarcashChecksum.js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function getBaseUrl() {
  return process.env.BAYARCASH_ENV === 'production'
    ? 'https://api.console.bayar.cash/v3'
    : 'https://api.console.bayarcash-sandbox.com/v3'
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { purchaseType, referenceId, userId, userEmail } = JSON.parse(event.body)

    if (!['course', 'subscription'].includes(purchaseType) || !referenceId || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing/invalid fields' }) }
    }

    // 1. Look up the price + name for this course or subscription plan
    let amount, itemName
    if (purchaseType === 'course') {
      const { data: course, error } = await supabaseAdmin
        .from('courses')
        .select('id, title, price_myr')
        .eq('id', referenceId)
        .single()
      if (error || !course) return { statusCode: 404, body: JSON.stringify({ error: 'Course not found' }) }
      amount = Number(course.price_myr)
      itemName = course.title
    } else {
      const { data: plan, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('id, name, price_myr')
        .eq('id', referenceId)
        .single()
      if (error || !plan) return { statusCode: 404, body: JSON.stringify({ error: 'Plan not found' }) }
      amount = Number(plan.price_myr)
      itemName = plan.name
    }

    if (!amount || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Item is free, no payment needed' }) }
    }

    // 2. Fetch user profile for payer name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .single()

    // 3. Create our own order number + pending transaction row FIRST
    //    (so the webhook always has something to match against)
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    await supabaseAdmin.from('payment_transactions').insert({
      user_id: userId,
      order_number: orderNumber,
      purchase_type: purchaseType,
      reference_id: referenceId,
      amount_myr: amount,
      status: 'pending',
    })

    // 4. Build payment intent payload + checksum per Bayarcash v3 spec
    const paymentData = {
      portal_key: process.env.BAYARCASH_PORTAL_KEY,
      order_number: orderNumber,
      amount: amount.toFixed(2),
      payer_name: profile?.full_name || userEmail,
      payer_email: userEmail,
      payer_telephone_number: profile?.phone || '',
      callback_url: `${process.env.SITE_URL}/.netlify/functions/bayarcash-webhook`,
      return_url: `${process.env.SITE_URL}/dashboard`,
      // payment_channel intentionally omitted here so Bayarcash's hosted
      // checkout shows all channels enabled on your portal (FPX, DuitNow,
      // cards, e-wallet). Restrict to specific channel IDs later if desired
      // (see Bayarcash::FPX, ::DUITNOW_QR, ::CREDIT_CARD constants).
    }
    paymentData.checksum = createPaymentIntentChecksum(
      process.env.BAYARCASH_API_SECRET_KEY,
      paymentData
    )

    // 5. Call Bayarcash API
    const res = await fetch(`${getBaseUrl()}/payment-intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BAYARCASH_API_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('Bayarcash create payment intent failed:', json)
      return { statusCode: 502, body: JSON.stringify({ error: 'Bayarcash API error', details: json }) }
    }

    // Bayarcash's response field name for the checkout URL may be `url` or
    // nested under `data.url` — handle both until confirmed in sandbox.
    const checkoutUrl = json.url || json.data?.url || json.payment_url

    if (!checkoutUrl) {
      console.error('No checkout URL in Bayarcash response:', json)
      return { statusCode: 502, body: JSON.stringify({ error: 'No checkout URL returned', details: json }) }
    }

    // Store the payment_intent id if returned, for later lookup
    if (json.id || json.data?.id) {
      await supabaseAdmin
        .from('payment_transactions')
        .update({ bayarcash_payment_intent_id: json.id || json.data?.id })
        .eq('order_number', orderNumber)
    }

    return { statusCode: 200, body: JSON.stringify({ url: checkoutUrl, orderNumber }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}
