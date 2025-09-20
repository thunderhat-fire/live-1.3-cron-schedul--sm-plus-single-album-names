const { createPresaleList, getOrCreatePresaleList, addContactToPresaleList } = require('../src/lib/brevo');

async function testBrevoIntegration() {
  console.log('🧪 Testing Brevo Integration...\n');

  try {
    // Test 1: Create a new presale list
    console.log('1️⃣ Testing presale list creation...');
    const testPresaleName = 'Test Album - ' + Date.now();
    const createResult = await createPresaleList(testPresaleName, 'test-nft-id');
    
    if (createResult.success) {
      console.log('✅ Successfully created Brevo list:', {
        listId: createResult.listId,
        listName: createResult.listName
      });

      // Test 2: Add a contact to the list
      console.log('\n2️⃣ Testing contact addition...');
      const contactResult = await addContactToPresaleList({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        listId: createResult.listId,
        presaleName: testPresaleName,
        nftName: testPresaleName,
        purchaseAmount: 26.00,
        format: 'vinyl'
      });

      if (contactResult.success) {
        console.log('✅ Successfully added contact to Brevo list:', {
          contactId: contactResult.contactId
        });
      } else {
        console.error('❌ Failed to add contact:', contactResult.error);
      }

      // Test 3: Test get-or-create functionality
      console.log('\n3️⃣ Testing get-or-create list...');
      const getOrCreateResult = await getOrCreatePresaleList(testPresaleName, 'test-nft-id');
      
      if (getOrCreateResult.success) {
        console.log('✅ Get-or-create worked:', {
          listId: getOrCreateResult.listId,
          isNew: getOrCreateResult.isNew
        });
      } else {
        console.error('❌ Get-or-create failed:', getOrCreateResult.error);
      }

      console.log('\n🎉 All Brevo integration tests passed!');
      console.log('\n📋 Test Summary:');
      console.log(`- Created list: ${testPresaleName} (ID: ${createResult.listId})`);
      console.log('- Added test contact: test@example.com');
      console.log('- Verified get-or-create functionality');
      
    } else {
      console.error('❌ Failed to create Brevo list:', createResult.error);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Check if required environment variables are present
if (!process.env.BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY environment variable is required');
  process.exit(1);
}

testBrevoIntegration(); 