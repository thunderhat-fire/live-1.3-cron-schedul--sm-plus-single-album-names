import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (
  file: Buffer, 
  folder: string = 'forum', 
  context?: Record<string, string>,
  userId?: string,
  originalFilename?: string
): Promise<string> => {
  try {
    // Build context metadata
    const contextMetadata: Record<string, string> = {
      ...(context || {}),
      ...(userId ? { user_id: userId } : {}),
      ...(originalFilename ? { original_filename: originalFilename } : {}),
      upload_timestamp: new Date().toISOString(),
    };

    // Extract album title for tagging and better searchability
    const albumTitle = context?.album_title;
    const tags: string[] = [];
    
    // Add album title as a tag for better search functionality
    if (albumTitle) {
      // Clean the album title for use as a tag (remove special characters, convert to lowercase)
      const cleanAlbumTitle = albumTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
      
      if (cleanAlbumTitle) {
        tags.push(`album_${cleanAlbumTitle}`);
        tags.push(cleanAlbumTitle); // Also add the clean title directly
      }
    }

    // Add folder-based tags for organization
    if (folder) {
      const folderParts = folder.split('/').filter(Boolean);
      folderParts.forEach(part => {
        const cleanPart = part.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanPart) {
          tags.push(cleanPart);
        }
      });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'auto',
            context: contextMetadata,
            tags: tags.length > 0 ? tags : undefined, // Add tags for searchability
            use_filename: true,
            unique_filename: true,
          },
          (error: any, result: UploadApiResponse | undefined) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error('No result from upload'));
          }
        )
        .end(file);
    });

    console.log('✅ Cloudinary upload successful:', {
      secure_url: result.secure_url,
      public_id: result.public_id,
      tags: result.tags,
      context: result.context,
      folder: result.folder
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Search Cloudinary assets by album title
 */
export async function searchAssetsByAlbumTitle(albumTitle: string) {
  try {
    const cleanAlbumTitle = albumTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();

    if (!cleanAlbumTitle) {
      throw new Error('Invalid album title for search');
    }

    // Use the Admin API to search for assets
    const searchResults = await cloudinary.search
      .expression(`tags:${cleanAlbumTitle} OR tags:album_${cleanAlbumTitle}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    console.log(`🔍 Found ${searchResults.total_count} assets for album: "${albumTitle}"`);
    
    return {
      success: true,
      total_count: searchResults.total_count,
      assets: searchResults.resources,
      next_cursor: searchResults.next_cursor
    };
  } catch (error) {
    console.error('Error searching Cloudinary assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      total_count: 0,
      assets: []
    };
  }
}

/**
 * Search Cloudinary assets by context metadata
 */
export async function searchAssetsByContext(key: string, value: string) {
  try {
    // Use the Admin API to search for assets by context
    const searchResults = await cloudinary.search
      .expression(`context.${key}:${value}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    console.log(`🔍 Found ${searchResults.total_count} assets with ${key}="${value}"`);
    
    return {
      success: true,
      total_count: searchResults.total_count,
      assets: searchResults.resources,
      next_cursor: searchResults.next_cursor
    };
  } catch (error) {
    console.error('Error searching Cloudinary assets by context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      total_count: 0,
      assets: []
    };
  }
}

/**
 * Get all tags from Cloudinary (useful for debugging)
 */
export async function getAllTags() {
  try {
    const result = await cloudinary.api.tags({
      max_results: 100
    });
    
    console.log('📋 Available tags in Cloudinary:', result.tags);
    return result.tags;
  } catch (error) {
    console.error('Error fetching Cloudinary tags:', error);
    return [];
  }
}

export default cloudinary; 