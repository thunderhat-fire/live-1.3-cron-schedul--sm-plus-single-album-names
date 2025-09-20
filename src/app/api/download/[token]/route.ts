import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

// Function to convert audio to M4A using FFmpeg
async function convertToM4A(audioBuffer: ArrayBuffer, originalExtension: string): Promise<ArrayBuffer> {
  return new Promise(async (resolve, reject) => {
    const tempDir = path.join(process.cwd(), 'temp');
    const inputPath = path.join(tempDir, `input-${Date.now()}${originalExtension}`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.m4a`);

    try {
      // Ensure temp directory exists
      await writeFile(inputPath, Buffer.from(audioBuffer));

      // Convert using FFmpeg to M4A with AAC codec
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart', // Optimize for streaming
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.on('close', async (code) => {
        try {
          if (code === 0) {
            // Read the converted M4A file
            const m4aBuffer = await readFile(outputPath);
            
            // Clean up temp files
            await unlink(inputPath).catch(() => {});
            await unlink(outputPath).catch(() => {});
            
            resolve(m4aBuffer.buffer);
          } else {
            console.error('FFmpeg conversion failed with code:', code);
            // Clean up temp files
            await unlink(inputPath).catch(() => {});
            await unlink(outputPath).catch(() => {});
            reject(new Error(`FFmpeg conversion failed with code ${code}`));
          }
        } catch (error) {
          reject(error);
        }
      });

      ffmpeg.on('error', async (error) => {
        console.error('FFmpeg error:', error);
        // Clean up temp files
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Function to embed metadata into M4A using FFmpeg
async function embedMetadataIntoM4A(
  m4aBuffer: ArrayBuffer,
  artworkUrl: string,
  trackName: string,
  albumName: string,
  artistName: string,
  genre?: string
): Promise<ArrayBuffer> {
  return new Promise(async (resolve, reject) => {
    const tempDir = path.join(process.cwd(), 'temp');
    const inputPath = path.join(tempDir, `input-${Date.now()}.m4a`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.m4a`);
    const artworkPath = path.join(tempDir, `artwork-${Date.now()}.jpg`);

    try {
      // Write M4A file
      await writeFile(inputPath, Buffer.from(m4aBuffer));

      // Fetch and save artwork
      let artworkArgs: string[] = [];
      if (artworkUrl) {
        try {
          const artworkResponse = await fetch(artworkUrl);
          if (artworkResponse.ok) {
            const artworkBuffer = await artworkResponse.arrayBuffer();
            await writeFile(artworkPath, Buffer.from(artworkBuffer));
            artworkArgs = ['-i', artworkPath, '-map', '0:a', '-map', '1:v', '-c:a', 'copy', '-c:v', 'copy', '-disposition:v:0', 'attached_pic'];
            console.log('✅ Fetched artwork for M4A embedding');
          }
        } catch (artworkError) {
          console.warn('⚠️ Error fetching artwork:', artworkError);
        }
      }

      // Build FFmpeg command with iTunes-compatible metadata
      const ffmpegArgs = [
        '-i', inputPath,
        ...artworkArgs,
        // iTunes-compatible metadata tags
        '-metadata', `title=${trackName.replace('.wav', '').replace('.flac', '').replace('.mp3', '')}`,
        '-metadata', `album=${albumName}`,
        '-metadata', `artist=${artistName}`,
        '-metadata', `album_artist=${artistName}`,
      ];

      if (genre && genre !== 'Unknown') {
        ffmpegArgs.push('-metadata', `genre=${genre}`);
      }

      // Add current year
      const currentYear = new Date().getFullYear();
      ffmpegArgs.push('-metadata', `date=${currentYear}`);

      // Final output arguments
      if (artworkArgs.length === 0) {
        ffmpegArgs.push('-c:a', 'copy');
      }
      
      ffmpegArgs.push('-y', outputPath);

      console.log('🎵 Embedding iTunes-compatible metadata into M4A...', {
        title: trackName.replace('.wav', '').replace('.flac', '').replace('.mp3', ''),
        album: albumName,
        artist: artistName,
        genre: genre || 'Not specified',
        hasArtwork: artworkArgs.length > 0
      });

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let ffmpegOutput = '';
      ffmpeg.stderr.on('data', (data) => {
        ffmpegOutput += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        try {
          if (code === 0) {
            const finalBuffer = await readFile(outputPath);
            
            // Clean up temp files
            await unlink(inputPath).catch(() => {});
            await unlink(outputPath).catch(() => {});
            await unlink(artworkPath).catch(() => {});
            
            console.log('✅ Successfully embedded iTunes-compatible metadata into M4A');
            resolve(finalBuffer.buffer);
          } else {
            console.error('FFmpeg metadata embedding failed with code:', code);
            console.error('FFmpeg output:', ffmpegOutput);
            // Clean up temp files
            await unlink(inputPath).catch(() => {});
            await unlink(outputPath).catch(() => {});
            await unlink(artworkPath).catch(() => {});
            resolve(m4aBuffer); // Return original if embedding fails
          }
        } catch (error) {
          reject(error);
        }
      });

      ffmpeg.on('error', async (error) => {
        console.error('FFmpeg metadata error:', error);
        // Clean up temp files
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});
        await unlink(artworkPath).catch(() => {});
        resolve(m4aBuffer); // Return original if embedding fails
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Function to embed artwork into audio file
async function embedArtworkIntoAudio(
  audioBuffer: ArrayBuffer, 
  artworkUrl: string, 
  trackName: string,
  albumName: string,
  artistName: string,
  fileExtension: string,
  genre?: string
): Promise<{ buffer: ArrayBuffer; extension: string }> {
  try {
    let processedBuffer = audioBuffer;
    let finalExtension = fileExtension;

    // Convert non-M4A files to M4A for better iTunes compatibility
    if (fileExtension !== '.m4a') {
      console.log(`🔄 Converting ${fileExtension} to M4A for better iTunes compatibility...`);
      try {
        processedBuffer = await convertToM4A(audioBuffer, fileExtension);
        finalExtension = '.m4a';
        console.log('✅ Successfully converted to M4A');
      } catch (conversionError) {
        console.warn(`⚠️ ${fileExtension} to M4A conversion failed, keeping original:`, conversionError);
        return { buffer: audioBuffer, extension: fileExtension };
      }
    }

    // Embed metadata into M4A
    if (finalExtension === '.m4a') {
      console.log('🎵 Embedding metadata into M4A:', {
        trackName,
        albumName,
        artistName,
        artworkUrl,
        genre,
        fileSize: processedBuffer.byteLength
      });

      try {
        processedBuffer = await embedMetadataIntoM4A(
          processedBuffer,
          artworkUrl,
          trackName,
          albumName,
          artistName,
          genre
        );
      } catch (metadataError) {
        console.warn('⚠️ M4A metadata embedding failed:', metadataError);
      }
    }

    return { buffer: processedBuffer, extension: finalExtension };

  } catch (error) {
    console.error('❌ Error processing audio file:', error);
    return { buffer: audioBuffer, extension: fileExtension };
  }
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Ensure JWT_SECRET is properly configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not configured');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }
    
    // Verify the token
    const decoded = verify(
      token,
      process.env.JWT_SECRET
    ) as { url: string; trackName?: string; albumName?: string; artistName?: string; artworkUrl?: string; genre?: string };

    const trackUrl = decoded.url;
    const trackName = decoded.trackName;
    const albumName = decoded.albumName;
    const artistName = decoded.artistName;
    const artworkUrl = decoded.artworkUrl;
    const genre = decoded.genre;
    
    console.log('Processing download with metadata:', {
      trackUrl,
      trackName,
      albumName,
      artistName,
      artworkUrl,
      genre
    });

    // Check if this is a Cloudinary URL or a local file path
    if (trackUrl.startsWith('http://') || trackUrl.startsWith('https://')) {
      // This is a remote URL (Cloudinary), fetch and serve the file
      try {
        console.log('Fetching remote file from:', trackUrl);
        const response = await fetch(trackUrl);
        
        if (!response.ok) {
          console.error('Failed to fetch remote file:', response.status, response.statusText);
          return NextResponse.json({ 
            error: 'File not available',
            details: `Remote file returned ${response.status}: ${response.statusText}`
          }, { status: 404 });
        }

        // Get the file content as buffer
        let fileBuffer = await response.arrayBuffer();
        
        // Use track name from token if available, otherwise extract from URL
        let filename = trackName || 'download';
        
        if (!trackName) {
          // Fallback: extract filename from URL
          try {
            const urlPath = new URL(trackUrl).pathname;
            const pathSegments = urlPath.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment && lastSegment.includes('.')) {
              filename = decodeURIComponent(lastSegment);
            }
          } catch (e) {
            console.warn('Could not extract filename from URL:', e);
          }
        }
        
        // Get the file extension for content type
        let ext = path.extname(filename).toLowerCase();
        
        // If track name doesn't have extension, try to detect it
        if (!ext) {
          // Try to detect from response headers
          const responseContentType = response.headers.get('content-type');
          if (responseContentType?.includes('audio/mpeg')) {
            ext = '.mp3';
          } else if (responseContentType?.includes('audio/wav')) {
            ext = '.wav';
          } else if (responseContentType?.includes('audio/mp4')) {
            ext = '.m4a';
          } else if (responseContentType?.includes('audio/flac')) {
            ext = '.flac';
          } else {
            // Try to extract from URL as fallback
            try {
              const urlPath = new URL(trackUrl).pathname;
              const urlExt = path.extname(urlPath).toLowerCase();
              if (urlExt) {
                ext = urlExt;
              } else {
                ext = '.mp3'; // Default fallback
              }
            } catch (e) {
              ext = '.mp3'; // Default fallback
            }
          }
          
          // Add extension to filename if it doesn't have one
          if (!filename.includes('.')) {
            filename += ext;
          }
        }

        // Embed artwork and metadata if we have all the necessary information
        if (trackName && albumName && artistName) {
          console.log('Embedding metadata into audio file...');
          const result = await embedArtworkIntoAudio(
            fileBuffer,
            artworkUrl || '',
            trackName,
            albumName,
            artistName,
            ext,
            genre
          );
          
          fileBuffer = result.buffer;
          
          // Update extension and filename if conversion happened
          if (result.extension !== ext) {
            ext = result.extension;
            // Update filename extension
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
            filename = nameWithoutExt + ext;
          }
        } else {
          console.warn('Missing metadata for embedding:', {
            hasTrackName: !!trackName,
            hasAlbumName: !!albumName,
            hasArtistName: !!artistName
          });
        }
        
        // Set the appropriate content type
        let contentType = 'application/octet-stream';
        if (ext === '.mp3') contentType = 'audio/mpeg';
        if (ext === '.wav') contentType = 'audio/wav';
        if (ext === '.m4a') contentType = 'audio/mp4';
        if (ext === '.flac') contentType = 'audio/flac';

        // Set headers for download
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Length', fileBuffer.byteLength.toString());
        headers.set('Cache-Control', 'no-cache');

        console.log('Serving download:', {
          filename,
          contentType,
          size: fileBuffer.byteLength,
          originalTrackName: trackName,
          hasArtwork: !!artworkUrl,
          hasMetadata: !!(trackName && albumName && artistName)
        });

        return new NextResponse(fileBuffer, { headers });
        
      } catch (error) {
        console.error('Error fetching remote file:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // This is a local file path, use the original logic
      const relativePath = trackUrl.startsWith('/') ? trackUrl.slice(1) : trackUrl;
      const filePath = path.join(process.cwd(), 'public', relativePath);

      console.log('Attempting to read local file:', {
        decodedUrl: trackUrl,
        relativePath,
        filePath
      });

      try {
        // Read the file
        let fileBuffer = await readFile(filePath);
        
        // Use track name from token if available, otherwise use file path
        let filename = trackName || path.basename(filePath);
        
        // Get the file extension
        let ext = path.extname(filePath).toLowerCase();
        
        // Add extension to track name if it doesn't have one
        if (trackName && !trackName.includes('.')) {
          filename = trackName + ext;
        }

        // Embed artwork and metadata if we have all the necessary information
        if (trackName && albumName && artistName) {
          console.log('Embedding metadata into local audio file...');
          const result = await embedArtworkIntoAudio(
            fileBuffer.buffer,
            artworkUrl || '',
            trackName,
            albumName,
            artistName,
            ext,
            genre
          );
          
          fileBuffer = Buffer.from(result.buffer);
          
          // Update extension and filename if conversion happened
          if (result.extension !== ext) {
            ext = result.extension;
            // Update filename extension
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
            filename = nameWithoutExt + ext;
          }
        }
        
        // Set the appropriate content type
        let contentType = 'application/octet-stream';
        if (ext === '.mp3') contentType = 'audio/mpeg';
        if (ext === '.wav') contentType = 'audio/wav';
        if (ext === '.m4a') contentType = 'audio/mp4';
        if (ext === '.flac') contentType = 'audio/flac';

        // Set headers for download
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Length', fileBuffer.length.toString());

        return new NextResponse(fileBuffer, { headers });
      } catch (error) {
        console.error('Error reading local file:', error);
        return NextResponse.json({ 
          error: 'File not found',
          path: relativePath,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 404 });
      }
    }
  } catch (error) {
    console.error('Error processing download:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Invalid download token',
        details: error.message 
      }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
} 