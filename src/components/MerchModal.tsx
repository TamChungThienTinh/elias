import {useEffect, useState} from 'react';
import {ExternalLink, Maximize2, Minimize2, X} from 'lucide-react';
import type {MerchItem} from '../types';
import {formatVnd, getMerchStatusLabel} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface MerchModalProps {
  item: MerchItem | null;
  onClose: () => void;
}

export function MerchModal({item, onClose}: MerchModalProps) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const isOutOfStock = item.status === 'het-hang';
  const statusLabel = getMerchStatusLabel(item.status);
  const statusColorClass =
    item.status === 'con-hang'
      ? 'text-[#7EC49A]'
      : item.status === 'pre-order'
      ? 'text-[#D8AE68]'
      : 'text-[#D47A7A]';

  const primaryLink =
    item.orderLinks.shopee || item.orderLinks.zalo || item.orderLinks.googleForm;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="merch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#13161F] border border-white/[0.1] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ sản phẩm"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#0B0D12]/80 text-[#E6E3DC] hover:text-[#C69B53] border border-white/[0.1] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Large image viewer */}
          <div className="lg:col-span-7 bg-[#0B0D12] p-5 sm:p-7 flex flex-col justify-center gap-4 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
            <div className="relative overflow-hidden rounded-lg bg-[#11141D] border border-white/[0.07]">
              <SafeImage
                src={item.image}
                alt={item.name}
                loading="eager"
                className={`w-full aspect-[4/3] object-cover transition-transform duration-300 ${
                  zoomed ? 'scale-125 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
              />
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B0D12]/85 text-xs font-medium text-[#E6E3DC] border border-white/[0.12] hover:border-[#C69B53] transition-colors cursor-pointer"
              >
                {zoomed ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Thu nhỏ
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Xem ảnh lớn
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#9A9892] leading-relaxed">
              {item.releaseNote}
            </p>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9A9892]">
                <span>{item.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${statusColorClass}`}>
                  {statusLabel}
                </span>
              </div>

              <h2
                id="merch-modal-title"
                className="font-display text-2xl font-semibold text-[#F1ECE1] mt-2 leading-snug text-balance"
              >
                {item.name}
              </h2>

              <p className="text-2xl font-semibold text-[#C69B53] tabular-nums mt-3">
                {formatVnd(item.priceVnd)}
              </p>

              <p className="text-sm text-[#C9C5BC] leading-relaxed mt-4">
                {item.description}
              </p>

              <dl className="mt-5 pt-4 border-t border-white/[0.08] space-y-2.5 text-xs">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[#8C8A84]">Kích thước</dt>
                  <dd className="text-[#E6E3DC]">{item.dimensions}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[#8C8A84]">Chất liệu</dt>
                  <dd className="text-[#E6E3DC]">{item.material}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              {isOutOfStock ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-md bg-white/[0.06] text-[#8C8A84] text-sm font-medium cursor-not-allowed"
                >
                  Tạm hết hàng — Chờ đợt in tiếp theo
                </button>
              ) : (
                <>
                  {primaryLink && (
                    <a
                      href={primaryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      Đặt mua ngay
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {item.orderLinks.shopee && (
                      <a
                        href={item.orderLinks.shopee}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-md border border-white/[0.1] text-xs font-medium text-[#E6E3DC] hover:border-[#C69B53] hover:text-[#C69B53] transition-colors whitespace-nowrap"
                      >
                        Shopee
                      </a>
                    )}
                    {item.orderLinks.zalo && (
                      <a
                        href={item.orderLinks.zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-md border border-white/[0.1] text-xs font-medium text-[#E6E3DC] hover:border-[#C69B53] hover:text-[#C69B53] transition-colors whitespace-nowrap"
                      >
                        Zalo
                      </a>
                    )}
                    {item.orderLinks.googleForm && (
                      <a
                        href={item.orderLinks.googleForm}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-md border border-white/[0.1] text-xs font-medium text-[#E6E3DC] hover:border-[#C69B53] hover:text-[#C69B53] transition-colors whitespace-nowrap"
                      >
                        Google Form
                      </a>
                    )}
                  </div>
                </>
              )}
              <p className="text-[11px] text-[#7D7B75] leading-relaxed">
                Liên kết đặt hàng mở ở tab mới để bạn xác nhận đơn trực tiếp với tác giả qua Shopee, Zalo hoặc Google Form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
