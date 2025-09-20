const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function createBackupManifest() {
  try {
    console.log('📋 Creating backup manifest...');
    
    const backupDir = path.join(process.cwd(), 'cloudinary-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const manifest = {
      created_at: new Date().toISOString(),
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      total_assets: 0,
      resources: [],
      folders: []
    };
    
    // Get all resources
    let allResources = [];
    let nextCursor = null;
    
    do {
      const options = {
        resource_type: 'auto',
        type: 'upload',
        max_results: 500,
        ...(nextCursor && { next_cursor: nextCursor })
      };
      
      const result = await cloudinary.api.resources(options);
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`📦 Fetched ${result.resources.length} resources (Total: ${allResources.length})`);
    } while (nextCursor);
    
    // Get all folders
    const folders = await cloudinary.api.root_folders();
    
    manifest.total_assets = allResources.length;
    manifest.resources = allResources.map(resource => ({
      public_id: resource.public_id,
      format: resource.format,
      resource_type: resource.resource_type,
      type: resource.type,
      url: resource.secure_url,
      bytes: resource.bytes,
      created_at: resource.created_at,
      folder: resource.folder || null,
      tags: resource.tags || []
    }));
    manifest.folders = folders.folders.map(folder => folder.name);
    
    // Save manifest
    const manifestPath = path.join(backupDir, `manifest-${Date.now()}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Backup manifest created: ${manifestPath}`);
    console.log(`📊 Total assets: ${manifest.total_assets}`);
    console.log(`📁 Total folders: ${manifest.folders.length}`);
    
    return manifestPath;
  } catch (error) {
    console.error('❌ Error creating backup manifest:', error);
    throw error;
  }
}

async function downloadAssets(manifestPath, downloadAssets = false) {
  if (!downloadAssets) {
    console.log('ℹ️  Skipping asset download. Use --download flag to download assets.');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const backupDir = path.dirname(manifestPath);
    const assetsDir = path.join(backupDir, 'assets');
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    console.log(`📥 Downloading ${manifest.resources.length} assets...`);
    
    let downloaded = 0;
    for (const resource of manifest.resources) {
      try {
        const response = await fetch(resource.url);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const filename = `${resource.public_id.replace(/\//g, '_')}.${resource.format}`;
          const filepath = path.join(assetsDir, filename);
          
          fs.writeFileSync(filepath, Buffer.from(buffer));
          downloaded++;
          
          if (downloaded % 10 === 0) {
            console.log(`📥 Downloaded ${downloaded}/${manifest.resources.length} assets`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to download ${resource.public_id}:`, error.message);
      }
    }
    
    console.log(`✅ Downloaded ${downloaded} assets to ${assetsDir}`);
  } catch (error) {
    console.error('❌ Error downloading assets:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldDownload = args.includes('--download');
  
  try {
    const manifestPath = await createBackupManifest();
    await downloadAssets(manifestPath, shouldDownload);
    
    console.log(`
🎉 Backup complete!

Next steps:
1. Review the manifest file to ensure all assets are listed
2. Run cleanup script: npm run cleanup:cloudinary:all
3. Keep the backup safe in case you need to restore anything

Manifest location: ${manifestPath}
    `);
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

main().catch(console.error); 