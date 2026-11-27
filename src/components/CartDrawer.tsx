import {useEffect, useState} from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {MERCH_ITEMS} from '../data/merch';
import type {CartItem} from '../types';
import {calculateCartTotals, formatVnd} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (merchId: string, delta: number) => void;
  onRemoveItem: (merchId: string) => void;
  onClearCart: () => void;
  onBrowseMerch: () => void;
  onNotifyToast: (message: string) => void;
}

export function CartDrawer({
  open,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBrowseMerch,
  onNotifyToast,
}: CartDrawerProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const detailedItems = cart
    .map((entry) => {
      const product = MERCH_ITEMS.find((m) => m.id === entry.merchId);
      if (!product || product.status === 'het-hang' || entry.quantity <= 0) {
        return null;
      }
      return {product, quantity: entry.quantity};
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const {totalQuantity, totalPriceVnd} = calculateCartTotals(cart, MERCH_ITEMS);

  const handleCopyOrderSummary = async () => {
    const lines = [
      'Đơn đặt Merch — Huyết Nguyệt Cố Đô:',
      ...detailedItems.map(
        ({product, quantity}) =>
          `- ${product.name} × ${quantity} (${formatVnd(product.priceVnd * quantity)})`
      ),
      `Tổng dự kiến: ${formatVnd(totalPriceVnd)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      onNotifyToast('Đã sao chép danh sách đơn hàng để gửi qua Zalo hoặc Google Form.');
      window.setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      onNotifyToast('Không thể truy cập bộ nhớ tạm trên trình duyệt này.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#13161F] border-l border-white/[0.1] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#C69B53]" aria-hidden="true" />
            <h2
              id="cart-drawer-title"
              className="font-display text-xl font-semibold text-[#F5F1E8]"
            >
              Giỏ hàng Merch ({totalQuantity})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9A9892] hover:text-[#F1ECE1] hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {detailedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
              <ShoppingBag className="w-9 h-9 text-[#C69B53]/50" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#E6E3DC]">
                  Giỏ hàng của bạn đang trống
                </p>
                <p className="text-xs text-[#8E8C86] max-w-xs leading-relaxed">
                  Thêm standee, móc khóa hoặc tranh in mỹ thuật vào giỏ để tính tổng giá trị trước khi gửi đơn đặt mua.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBrowseMerch();
                }}
                className="px-4 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors cursor-pointer"
              >
                Khám phá Cửa hàng Merch
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.08]">
              {detailedItems.map(({product, quantity}) => (
                <li key={product.id} className="py-4 flex gap-4">
                  <div className="w-20 h-16 rounded-md overflow-hidden bg-[#0B0D12] border border-white/[0.08] shrink-0">
                    <SafeImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#F1ECE1] leading-snug line-clamp-2">
                        {product.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label={`Xóa ${product.name} khỏi giỏ`}
                        className="text-[#8E8C86] hover:text-[#D47A7A] p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#C69B53] tabular-nums">
                        {formatVnd(product.priceVnd * quantity)}
                      </span>

                      <div className="inline-flex items-center rounded-md border border-white/[0.12] bg-[#0B0D12]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          aria-label={`Giảm số lượng ${product.name}`}
                          className="px-2 py-1 text-[#C9C5BC] hover:text-[#F1ECE1] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-medium text-[#F1ECE1] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          aria-label={`Tăng số lượng ${product.name}`}
                          className="px-2 py-1 text-[#C9C5BC] hover:text-[#F1ECE1] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drawer Footer */}
        {detailedItems.length > 0 && (
          <div className="px-6 py-5 border-t border-white/[0.08] bg-[#0F121A] space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#9A9892]">Tổng dự kiến</span>
              <span className="text-xl font-semibold text-[#C69B53] tabular-nums">
                {formatVnd(totalPriceVnd)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyOrderSummary}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Đã sao chép danh sách đơn
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Sao chép đơn hàng để gửi đặt mua
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://shopee.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap"
              >
                Shopee
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href="https://zalo.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap"
              >
                Zalo
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href="https://docs.google.com/forms/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap"
              >
                Form
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-[#7D7B75]">
                Giỏ hàng lưu cục bộ trên thiết bị này.
              </p>
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-[#9A9892] hover:text-[#D47A7A] cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
