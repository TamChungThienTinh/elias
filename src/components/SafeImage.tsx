import {useState} from 'react';
import {ImageOff} from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  loading?: 'eager' | 'lazy';
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  loading = 'lazy',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#151924] via-[#10131C] to-[#0B0D12] text-[#9A9892] p-6 text-center ${className}`}
      >
        <ImageOff className="w-6 h-6 text-[#C69B53]/70" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-[#C9C5BC] max-w-[180px] line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
