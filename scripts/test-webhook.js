const crypto = require('crypto');

// Test webhook payload
const payload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      payment_intent: 'pi_test_123',
      metadata: {
        type: 'pay_as_you_go',
        userId: 'cmfjiclul0011iblr9vwwujnh',
        userEmail: 'ross@soundonshape.com',
        credits: '1'
      },
      amount_total: 3000,
      customer_email: 'ross@soundonshape.com'
    }
  }
});

// Create signature
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_replace_with_real_secret';
const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(timestamp + '.' + payload)
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('🧪 Testing webhook endpoint...');
console.log('📝 Payload:', payload);
console.log('🔐 Signature:', stripeSignature);

// Test the webhook
fetch('http://localhost:3000/api/webhooks/stripe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': stripeSignature
  },
  body: payload
})
.then(response => response.text())
.then(data => {
  console.log('✅ Webhook response:', data);
})
.catch(error => {
  console.error('❌ Webhook error:', error);
});