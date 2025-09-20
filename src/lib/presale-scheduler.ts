import cron from 'node-cron';
import { handleFailedPresales, checkAndProcessPresaleThresholds } from '@/lib/payment-service';

let schedulerInitialized = false;

/**
 * Initialize the presale processing scheduler
 * Runs every hour to check for:
 * 1. Failed presales (expired without meeting target)
 * 2. Successful presales (threshold reached)
 */
export function initializePresaleScheduler() {
  if (schedulerInitialized) {
    console.log('⏰ Presale scheduler already initialized');
    return;
  }

  console.log('🚀 Initializing presale scheduler...');

  // Run every hour at minute 0 (e.g., 12:00, 1:00, 2:00, etc.)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running scheduled presale processing...');
    
    try {
      // Process failed presales first
      console.log('🔍 Checking for failed presales...');
      const failedResult = await handleFailedPresales();
      
      if (failedResult.success && failedResult.processedFailures && failedResult.processedFailures.length > 0) {
        console.log(`✅ Processed ${failedResult.processedFailures.length} failed presales`);
      } else {
        console.log('✅ No failed presales to process');
      }

      // Process successful presales
      console.log('🔍 Checking for successful presales...');
      const successResult = await checkAndProcessPresaleThresholds();
      
      if (successResult.success && successResult.processedThresholds && successResult.processedThresholds.length > 0) {
        console.log(`✅ Processed ${successResult.processedThresholds.length} successful presales`);
      } else {
        console.log('✅ No successful presales to process');
      }

    } catch (error) {
      console.error('❌ Error in scheduled presale processing:', error);
    }
  });

  // Also run every 15 minutes during peak hours (9 AM - 11 PM UTC) for faster processing
  cron.schedule('*/15 9-23 * * *', async () => {
    console.log('⚡ Running fast presale check (peak hours)...');
    
    try {
      // Only check for successful presales during peak hours (more frequent)
      const successResult = await checkAndProcessPresaleThresholds();
      
      if (successResult.success && successResult.processedThresholds && successResult.processedThresholds.length > 0) {
        console.log(`⚡ Fast processed ${successResult.processedThresholds.length} successful presales`);
      }
    } catch (error) {
      console.error('❌ Error in fast presale processing:', error);
    }
  });

  schedulerInitialized = true;
  console.log('✅ Presale scheduler initialized successfully');
  console.log('📅 Schedule: Every hour + every 15min during peak hours (9 AM - 11 PM UTC)');
}

/**
 * Stop the presale scheduler (useful for testing)
 */
export function stopPresaleScheduler() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  schedulerInitialized = false;
  console.log('🛑 Presale scheduler stopped');
}

/**
 * Manual trigger for presale processing (for testing)
 */
export async function triggerPresaleProcessing() {
  console.log('🔧 Manual presale processing triggered...');
  
  try {
    const [failedResult, successResult] = await Promise.all([
      handleFailedPresales(),
      checkAndProcessPresaleThresholds()
    ]);

    return {
      success: true,
      failed: failedResult,
      successful: successResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error in manual presale processing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}
