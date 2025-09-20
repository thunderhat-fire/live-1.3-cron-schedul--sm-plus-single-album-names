'use client';

import React, { useState } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';

const StreamPlaceholderUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string>('/videos/vinyl-background.mp4');
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video file
      if (!selectedFile.type.startsWith('video/')) {
        setMessage('Please select a video file');
        return;
      }
      // Check file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setMessage('Video file must be smaller than 50MB');
        return;
      }
      setFile(selectedFile);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/admin/stream-placeholder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentVideo(result.videoUrl);
        setMessage('Placeholder video updated successfully!');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('videoInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/admin/stream-placeholder', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCurrentVideo('/videos/vinyl-background.mp4');
        setMessage('Reset to default placeholder video');
      } else {
        setMessage('Failed to reset placeholder');
      }
    } catch (error) {
      setMessage('Failed to reset placeholder');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-lg font-semibold mb-4">Stream Placeholder Video</h3>
      
      {/* Current Video Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Current Placeholder:</h4>
        <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={currentVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <div className="flex items-center justify-center h-full text-white">
              Video not available
            </div>
          </video>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="videoInput" className="block text-sm font-medium mb-2">
            Upload New Placeholder Video
          </label>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Recommended: MP4 format, 16:9 aspect ratio, max 50MB
          </p>
        </div>

        {file && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded">
            <p className="text-sm">
              <strong>Selected:</strong> {file.name}
            </p>
            <p className="text-xs text-neutral-500">
              Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded ${
            message.includes('success') || message.includes('Reset') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <ButtonPrimary
            onClick={handleUpload}
            disabled={!file || uploading}
            className={uploading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </ButtonPrimary>
          
          <ButtonSecondary
            onClick={handleReset}
            disabled={uploading}
          >
            Reset to Default
          </ButtonSecondary>
        </div>
      </div>
    </div>
  );
};

export default StreamPlaceholderUpload;
