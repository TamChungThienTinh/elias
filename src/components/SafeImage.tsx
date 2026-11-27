import {useEffect, useState} from 'react';
import {Image as ImageIcon} from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Chữ hướng dẫn hiển thị bên trong khung ảnh chờ khi chưa điền ảnh */
  placeholderText?: string;
  /** Thu gọn icon/chữ cho các khung ảnh nhỏ (ví dụ thumbnail trong giỏ hàng) */
  compact?: boolean;
  loading?: 'eager' | 'lazy';
}

export function SafeImage({
  src,
  alt,
  className = '',
  placeholderText,
  compact = false,
  loading = 'lazy',
}: SafeImageProps) {
  const trimmedSrc = (src || '').trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmedSrc]);

  if (failed || !trimmedSrc) {
    return (
      <div
        role="img"
        aria-label={placeholderText || alt}
        data-testid="image-placeholder"
        className={`flex flex-col items-center justify-center gap-2.5 bg-[#11141C] border border-dashed border-[#C69B53]/50 rounded-[inherit] text-center select-none ${
          compact ? 'p-2' : 'p-5 sm:p-6'
        } ${className}`}
      >
        <div
          aria-hidden="true"
          className={`inline-flex items-center justify-center rounded-full bg-[#C69B53]/10 border border-[#C69B53]/30 text-[#C69B53] shrink-0 ${
            compact ? 'w-7 h-7' : 'w-10 h-10'
          }`}
        >
          <ImageIcon className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        </div>
        {!compact && (
          <span className="text-xs font-medium leading-relaxed text-[#B9B4A9] max-w-[200px]">
            {placeholderText || alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={trimmedSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
