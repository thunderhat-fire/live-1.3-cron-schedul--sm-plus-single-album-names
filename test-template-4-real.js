const { sendOrderConfirmationEmail } = require('./src/lib/brevo.ts');

async function testTemplate4() {
  console.log('🧪 Testing Template 4 (Order Confirmation) with real data...');
  
  try {
    const testOrderData = {
      customerEmail: 'ross@xtransit.uk', // Your real email
      customerName: 'Ross Test',
      orderId: `test-order-${Date.now()}`, // Unique order ID
      productName: 'Test Vinyl Album',
      amount: 26, // £26.00 in pounds
      orderQuantity: 1,
      format: 'vinyl',
      projectUrl: 'https://vinylfunders.com/nft-detail/test'
    };
    
    console.log('📤 Sending order confirmation email with data:', testOrderData);
    
    const result = await sendOrderConfirmationEmail(testOrderData);
    
    if (result) {
      console.log('✅ Template 4 email sent successfully!');
      console.log('📧 Email details:', {
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });
      console.log('📨 Check your email: ross@xtransit.uk');
    } else {
      console.log('❌ Template 4 email failed to send');
    }
    
  } catch (error) {
    console.error('❌ Error testing Template 4:', error);
  }
}

testTemplate4();
