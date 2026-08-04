// Shared checksum helpers, ported 1:1 from the official Bayarcash PHP SDK
// (webimpian/bayarcash-php-sdk — src/Actions/ChecksumGenerator.php and
// CallbackVerifications.php) so the HMAC algorithm matches exactly.
import crypto from 'node:crypto'

function hmacSha256(payloadString, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex')
}

function sortedPipeString(payload) {
  const sortedKeys = Object.keys(payload).sort()
  return sortedKeys.map((k) => payload[k]).join('|')
}

// Used when CREATING a payment intent (outgoing request to Bayarcash)
export function createPaymentIntentChecksum(secretKey, data) {
  let paymentChannel = data.payment_channel ?? []
  if (!Array.isArray(paymentChannel)) paymentChannel = [paymentChannel]
  const payload = {
    payment_channel: paymentChannel.join(','),
    order_number: data.order_number,
    amount: data.amount,
    payer_name: data.payer_name,
    payer_email: data.payer_email,
  }
  return hmacSha256(sortedPipeString(payload), secretKey)
}

// Used when VERIFYING the transaction callback (incoming webhook from Bayarcash)
export function verifyTransactionCallbackChecksum(callbackData, secretKey) {
  const callbackChecksum = callbackData.checksum
  const payload = {
    record_type: callbackData.record_type,
    transaction_id: callbackData.transaction_id,
    exchange_reference_number: callbackData.exchange_reference_number,
    exchange_transaction_id: callbackData.exchange_transaction_id,
    order_number: callbackData.order_number,
    currency: callbackData.currency,
    amount: callbackData.amount,
    payer_name: callbackData.payer_name,
    payer_email: callbackData.payer_email,
    payer_bank_name: callbackData.payer_bank_name,
    status: callbackData.status,
    status_description: callbackData.status_description,
    datetime: callbackData.datetime,
  }
  return hmacSha256(sortedPipeString(payload), secretKey) === callbackChecksum
}
