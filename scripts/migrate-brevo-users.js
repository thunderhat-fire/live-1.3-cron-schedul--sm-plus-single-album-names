const { migrateUsersToTierLists } = require('../src/lib/brevo');

async function runMigration() {
  console.log('🚀 Starting Brevo user tier list migration...\n');
  
  try {
    const result = await migrateUsersToTierLists();
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   Total users: ${result.totalUsers}`);
      console.log(`   Successfully migrated: ${result.successCount}`);
      console.log(`   Errors: ${result.errorCount}`);
    } else {
      console.error('\n❌ Migration failed:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Script error:', error);
  }
}

// Check if required environment variables are present
if (!process.env.BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

runMigration(); 