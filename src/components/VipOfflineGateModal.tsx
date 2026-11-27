import {useEffect} from 'react';
import {Crown, KeyRound, QrCode, WifiOff, X} from 'lucide-react';

interface VipOfflineGateModalProps {
  open: boolean;
  onClose: () => void;
  onActivateCode: () => void;
  onOpenVipGuide: () => void;
}

export function VipOfflineGateModal({
  open,
  onClose,
  onActivateCode,
  onOpenVipGuide,
}: VipOfflineGateModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-offline-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-testid="vip-offline-gate-modal"
        className="relative w-full max-w-md bg-[#13161F] border border-[#C69B53]/50 rounded-xl p-6 sm:p-7 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo quyền lợi ngoại tuyến VIP"
          className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9A9892] hover:text-[#F1ECE1] hover:bg-white/[0.06] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2.5 pr-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8AE68]">
            <Crown className="w-4 h-4" aria-hidden="true" />
            <span>Quyền lợi Thành viên VIP</span>
          </div>

          <h2
            id="vip-offline-gate-title"
            className="font-display text-2xl font-semibold text-[#F5F1E8] leading-snug text-balance"
          >
            Tính năng tải đọc ngoại tuyến chỉ dành riêng cho Thành viên VIP
          </h2>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0D1017] border border-white/[0.08] text-xs sm:text-sm text-[#CFCBC2] leading-relaxed">
          <WifiOff
            className="w-4 h-4 text-[#C69B53] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p>
            Nâng cấp Thành viên VIP để tải từng chương hoặc toàn bộ Arc về máy, đọc mượt mà mọi lúc không cần kết nối mạng cùng quyền đọc sớm chương mới.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onActivateCode}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            Kích hoạt mã VIP
          </button>

          <button
            type="button"
            onClick={onOpenVipGuide}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#C69B53]/50 hover:border-[#C69B53] hover:bg-[#C69B53]/10 text-[#D8AE68] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            Hướng dẫn nhận mã VIP
          </button>
        </div>
      </div>
    </div>
  );
}
