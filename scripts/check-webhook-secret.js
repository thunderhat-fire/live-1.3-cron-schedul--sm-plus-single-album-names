require('dotenv').config();

console.log('🔍 Checking webhook configuration...');
console.log('');

// Check if webhook secret is set
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (webhookSecret) {
  console.log('✅ STRIPE_WEBHOOK_SECRET is set');
  console.log('📏 Secret length:', webhookSecret.length);
  console.log('🔑 Secret preview:', webhookSecret.substring(0, 10) + '...');
} else {
  console.log('❌ STRIPE_WEBHOOK_SECRET is NOT set');
}

console.log('');

// Check if Stripe secret key is set
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (stripeSecret) {
  console.log('✅ STRIPE_SECRET_KEY is set');
  console.log('📏 Key length:', stripeSecret.length);
  console.log('🔑 Key preview:', stripeSecret.substring(0, 10) + '...');
} else {
  console.log('❌ STRIPE_SECRET_KEY is NOT set');
}

console.log('');
console.log('💡 If webhook secret is missing, you need to:');
console.log('1. Go to Stripe Dashboard → Developers → Webhooks');
console.log('2. Click on your webhook endpoint');
console.log('3. Click "Reveal" next to "Signing secret"');
console.log('4. Copy the secret and add it to your .env file as STRIPE_WEBHOOK_SECRET');
