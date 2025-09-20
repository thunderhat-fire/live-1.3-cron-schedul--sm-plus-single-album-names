import { useState, useEffect } from 'react';

export const useStreamPlaceholder = () => {
  const [placeholderVideo, setPlaceholderVideo] = useState<string>('/videos/vinyl-background.mp4');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaceholder = async () => {
      try {
        const response = await fetch('/api/admin/stream-placeholder');
        if (response.ok) {
          const data = await response.json();
          setPlaceholderVideo(data.currentVideo);
        }
      } catch (error) {
        console.warn('Could not fetch custom placeholder, using default');
        // Keep default value
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceholder();
  }, []);

  return { placeholderVideo, loading };
};
