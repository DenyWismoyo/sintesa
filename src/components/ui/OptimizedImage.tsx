'use client';

import React, { useState, useEffect } from 'react';
import { getThumbnailUrl } from '@/lib/imageUtils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  defaultIcon?: React.ReactNode;
  fallbackSrc?: string;
}

/**
 * Komponen gambar pintar yang otomatis mencoba memuat versi thumbnail WebP
 * (hasil kompresi otomatis Cloud Functions triggers/storageAutomation.ts).
 * Jika thumbnail tidak tersedia, otomatis fallback ke URL asli secara halus.
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  defaultIcon,
  fallbackSrc,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setImgSrc(undefined);
      setHasError(true);
      return;
    }

    setHasError(false);
    setIsLoaded(false);

    // Coba gunakan URL thumbnail WebP terlebih dahulu
    const thumb = getThumbnailUrl(src);
    setImgSrc(thumb !== '/placeholder-image.jpg' ? thumb : src);
  }, [src]);

  const handleError = () => {
    // Jika thumbnail webp gagal dimuat, fallback ke gambar asli
    if (imgSrc !== src && src) {
      setImgSrc(src);
    } else if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (!src || hasError) {
    if (defaultIcon) {
      return <div className={`flex items-center justify-center bg-slate-100 ${className}`}>{defaultIcon}</div>;
    }
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium ${className}`}>
        Gambar Tidak Tersedia
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-75'}`}
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}
