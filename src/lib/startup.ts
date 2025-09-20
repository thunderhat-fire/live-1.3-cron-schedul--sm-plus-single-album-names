import { initializePresaleScheduler } from '@/lib/presale-scheduler';

let startupComplete = false;

/**
 * Initialize services when the app starts up
 * This is called from the layout component on first load
 */
export function initializeAppServices() {
  if (startupComplete) {
    return;
  }

  console.log('🚀 Initializing app services...');

  try {
    // Initialize presale scheduler
    initializePresaleScheduler();
    console.log('✅ Presale scheduler initialized on startup');
    
    startupComplete = true;
    console.log('✅ App services initialization complete');
  } catch (error) {
    console.error('❌ Error initializing app services:', error);
  }
}

/**
 * Check if startup is complete
 */
export function isStartupComplete() {
  return startupComplete;
}
