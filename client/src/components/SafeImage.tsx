import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Icon size for the placeholder tile. */
  iconSize?: number;
  loading?: 'lazy' | 'eager';
}

/**
 * An image that degrades to a neutral placeholder tile.
 *
 * Products and categories without a picture are simply ones the admin has not
 * finished setting up — filling the gap with an unrelated stock photo would
 * misrepresent what is being sold, so we show nothing instead.
 */
export default function SafeImage({ src, alt, className = '', iconSize = 20, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <ImageOff size={iconSize} className="text-neutral-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
