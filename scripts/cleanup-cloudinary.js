const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteAllAssets() {
  try {
    console.log('🧹 Starting Cloudinary cleanup...');
    
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Get all resources (images and videos)
      const result = await cloudinary.api.resources({
        resource_type: 'auto', // Gets both images and videos
        type: 'upload',
        max_results: 500, // Maximum per request
      });
      
      if (result.resources.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`📦 Found ${result.resources.length} assets to delete...`);
      
      // Extract public IDs
      const publicIds = result.resources.map(resource => resource.public_id);
      
      // Delete in batches of 100 (Cloudinary limit)
      const batchSize = 100;
      for (let i = 0; i < publicIds.length; i += batchSize) {
        const batch = publicIds.slice(i, i + batchSize);
        
        try {
          const deleteResult = await cloudinary.api.delete_resources(batch, {
            resource_type: 'auto'
          });
          
          const deletedCount = Object.keys(deleteResult.deleted).length;
          totalDeleted += deletedCount;
          
          console.log(`✅ Deleted batch of ${deletedCount} assets`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (batchError) {
          console.error(`❌ Error deleting batch:`, batchError);
        }
      }
      
      // Check if there are more resources
      hasMore = result.resources.length === 500;
    }
    
    console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} total assets`);
    
    // Also clean up folders
    await cleanupFolders();
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function cleanupFolders() {
  try {
    console.log('📁 Cleaning up folders...');
    
    const folders = await cloudinary.api.root_folders();
    
    for (const folder of folders.folders) {
      try {
        await cloudinary.api.delete_folder(folder.name);
        console.log(`✅ Deleted folder: ${folder.name}`);
      } catch (error) {
        console.log(`⚠️ Could not delete folder ${folder.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning folders:', error);
  }
}

async function deleteByResourceType(resourceType = 'image') {
  try {
    console.log(`🧹 Deleting all ${resourceType} assets...`);
    
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const result = await cloudinary.api.resources({
        resource_type: resourceType,
        type: 'upload',
        max_results: 500,
      });
      
      if (result.resources.length === 0) {
        hasMore = false;
        break;
      }
      
      const publicIds = result.resources.map(resource => resource.public_id);
      
      const deleteResult = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType
      });
      
      const deletedCount = Object.keys(deleteResult.deleted).length;
      totalDeleted += deletedCount;
      
      console.log(`✅ Deleted ${deletedCount} ${resourceType} assets`);
      
      hasMore = result.resources.length === 500;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`🎉 Deleted ${totalDeleted} total ${resourceType} assets`);
  } catch (error) {
    console.error(`❌ Error deleting ${resourceType} assets:`, error);
  }
}

async function deleteByFolder(folderName) {
  try {
    console.log(`🧹 Deleting all assets in folder: ${folderName}`);
    
    const result = await cloudinary.api.delete_resources_by_prefix(folderName, {
      resource_type: 'auto'
    });
    
    console.log(`✅ Deleted assets in folder ${folderName}:`, result);
    
    // Also delete the folder itself
    await cloudinary.api.delete_folder(folderName);
    console.log(`✅ Deleted folder: ${folderName}`);
    
  } catch (error) {
    console.error(`❌ Error deleting folder ${folderName}:`, error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'all':
      await deleteAllAssets();
      break;
    case 'images':
      await deleteByResourceType('image');
      break;
    case 'videos':
      await deleteByResourceType('video');
      break;
    case 'folder':
      if (args[1]) {
        await deleteByFolder(args[1]);
      } else {
        console.log('❌ Please specify folder name: npm run cleanup:cloudinary folder <folder-name>');
      }
      break;
    case 'folders':
      await cleanupFolders();
      break;
    default:
      console.log(`
🧹 Cloudinary Cleanup Script

Usage:
  node scripts/cleanup-cloudinary.js all          # Delete ALL assets and folders
  node scripts/cleanup-cloudinary.js images       # Delete only images
  node scripts/cleanup-cloudinary.js videos       # Delete only videos
  node scripts/cleanup-cloudinary.js folder <name> # Delete specific folder
  node scripts/cleanup-cloudinary.js folders      # Delete all empty folders

⚠️  WARNING: These operations are irreversible!
      `);
  }
}

main().catch(console.error); 