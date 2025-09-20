'use client';

import { FC, useState, useEffect } from "react";

export interface NcImageProps {
  containerClassName?: string;
  src?: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  cacheBust?: boolean; // Add cache-busting option
  trackId?: string; // For radio-specific cache busting
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const NcImage: FC<NcImageProps> = ({
  containerClassName = "relative",
  alt = "nc-imgs",
  src,
  fill,
  className = "object-cover w-full h-full",
  sizes = "(max-width: 600px) 480px, 800px",
  cacheBust = false,
  trackId,
  onError,
  ...args
}) => {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update image source when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      
      // Add cache-busting if enabled
      if (cacheBust) {
        const separator = src.includes('?') ? '&' : '?';
        const timestamp = Date.now();
        const cacheBuster = `${separator}v=${timestamp}${trackId ? `&t=${trackId}` : ''}`;
        setImageSrc(`${src}${cacheBuster}`);
      } else {
        setImageSrc(src);
      }
    }
  }, [src, cacheBust, trackId]);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    // Don't set a fallback here, let the parent component handle it
  };

  // Don't render anything until mounted to ensure client/server match
  if (!mounted) {
    return <div className={containerClassName} />;
  }

  return (
    <div className={containerClassName}>
      {imageSrc && !imageError ? (
        <img
          className={className}
          alt={alt || "Image"}
          src={imageSrc}
          onError={(e) => {
            handleImageError();
            if (onError) onError(e);
          }}
        />
      ) : null}
    </div>
  );
};

export default NcImage;
