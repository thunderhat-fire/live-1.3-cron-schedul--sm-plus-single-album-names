const fs = require('fs').promises;
const path = require('path');

async function cleanupTempDirectory() {
  const tempDir = path.join(process.cwd(), 'temp');
  
  try {
    console.log('🧹 Cleaning up temp directory...');
    
    // Check if temp directory exists
    try {
      await fs.access(tempDir);
    } catch (error) {
      console.log('ℹ️  Temp directory does not exist');
      return;
    }
    
    // Read all files in temp directory
    const files = await fs.readdir(tempDir);
    
    if (files.length === 0) {
      console.log('✅ Temp directory is already clean');
      return;
    }
    
    console.log(`📦 Found ${files.length} files to clean up...`);
    
    let totalDeleted = 0;
    let totalSize = 0;
    
    // Delete each file
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      try {
        // Get file stats before deleting
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        // Delete the file
        await fs.unlink(filePath);
        totalDeleted++;
        
        console.log(`🗑️  Deleted: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error.message);
      }
    }
    
    console.log(`🎉 Cleanup complete!`);
    console.log(`✅ Deleted ${totalDeleted} files`);
    console.log(`💾 Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB of storage`);
    
  } catch (error) {
    console.error('❌ Error during temp cleanup:', error);
  }
}

async function cleanupOldFiles(maxAgeHours = 24) {
  const tempDir = path.join(process.cwd(), 'temp');
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  
  try {
    console.log(`🧹 Cleaning up temp files older than ${maxAgeHours} hours...`);
    
    const files = await fs.readdir(tempDir);
    
    if (files.length === 0) {
      console.log('ℹ️  No files in temp directory');
      return;
    }
    
    let deletedCount = 0;
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAgeMs) {
          totalSize += stats.size;
          await fs.unlink(filePath);
          deletedCount++;
          
          const ageHours = (fileAge / (1000 * 60 * 60)).toFixed(1);
          console.log(`🗑️  Deleted old file: ${file} (${ageHours}h old, ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          const ageHours = (fileAge / (1000 * 60 * 60)).toFixed(1);
          console.log(`⏰ Keeping recent file: ${file} (${ageHours}h old)`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🎉 Cleanup complete!`);
      console.log(`✅ Deleted ${deletedCount} old files`);
      console.log(`💾 Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB of storage`);
    } else {
      console.log('✅ No old files to clean up');
    }
    
  } catch (error) {
    console.error('❌ Error during old file cleanup:', error);
  }
}

// Schedule automatic cleanup
function scheduleCleanup() {
  console.log('📅 Setting up automatic temp cleanup...');
  
  // Clean up old files every hour
  setInterval(async () => {
    console.log('⏰ Running scheduled temp cleanup...');
    await cleanupOldFiles(1); // Delete files older than 1 hour
  }, 60 * 60 * 1000); // Every hour
  
  console.log('✅ Automatic cleanup scheduled (every hour)');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'all':
      await cleanupTempDirectory();
      break;
    case 'old':
      const hours = parseInt(args[1]) || 24;
      await cleanupOldFiles(hours);
      break;
    case 'schedule':
      scheduleCleanup();
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n📅 Stopping scheduled cleanup...');
        process.exit(0);
      });
      break;
    default:
      console.log(`
🧹 Temp Directory Cleanup Script

Usage:
  node scripts/cleanup-temp.js all           # Delete ALL temp files
  node scripts/cleanup-temp.js old [hours]   # Delete files older than X hours (default: 24)
  node scripts/cleanup-temp.js schedule      # Start automatic cleanup service

Examples:
  node scripts/cleanup-temp.js old 1         # Delete files older than 1 hour
  node scripts/cleanup-temp.js old 6         # Delete files older than 6 hours
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  cleanupTempDirectory,
  cleanupOldFiles,
  scheduleCleanup
}; 