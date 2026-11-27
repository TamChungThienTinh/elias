import {useEffect, useState} from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  ExternalLink,
  MessageCircle,
  QrCode,
  Send,
  X,
} from 'lucide-react';
import type {AuthUser} from '../types';
import {
  buildVietQrUrl,
  buildVipTransferNote,
  formatVnd,
} from '../utils/readerLogic';

/**
 * ============================================================================
 * CẤU HÌNH TÀI KHOẢN NGÂN HÀNG VIETQR & LIÊN HỆ TÁC GIẢ
 * (Tác giả chỉ cần thay các giá trị bên dưới bằng thông tin thật của mình)
 * ============================================================================
 */
const VIETQR_BANK_CONFIG = {
  // [MA_NGAN_HANG]: ví dụ 'MB', 'VCB', 'TCB', 'ACB', 'BIDV', 'TPB', 'VPB'
  bankCode: 'MB',
  bankDisplayName: 'MB Bank (Ngân hàng Quân Đội)',
  // [SO_TAI_KHOAN]: số tài khoản nhận chuyển khoản
  accountNumber: '0123456789',
  // [TEN_CHU_TK_KHONG_DAU]: tên chủ tài khoản viết hoa không dấu
  accountName: 'NGUYEN MAC LAM',
};

const AUTHOR_CONTACT_LINKS = {
  // [LINK_FB]: đường dẫn Facebook / Messenger nhận biên lai
  facebookUrl: 'https://m.me/huyetnguyetcodo',
  // [LINK_ZALO_HOAC_DISCORD]: đường dẫn Zalo hoặc Discord của tác giả
  zaloOrDiscordUrl: 'https://zalo.me/0123456789',
};

export interface VipPackageOption {
  id: string;
  code: string;
  name: string;
  durationLabel: string;
  price: number;
  highlightLabel?: string;
}

const VIP_PACKAGES: VipPackageOption[] = [
  {
    id: 'vip-1m',
    code: '1THANG',
    name: 'Gói 1 tháng',
    durationLabel: '30 ngày',
    price: 30000,
  },
  {
    id: 'vip-3m',
    code: '3THANG',
    name: 'Gói 3 tháng',
    durationLabel: '90 ngày',
    price: 79000,
    highlightLabel: 'Tiết kiệm',
  },
  {
    id: 'vip-lifetime',
    code: 'VINHVIEN',
    name: 'Gói Vĩnh viễn',
    durationLabel: 'Ủng hộ tác giả',
    price: 199000,
  },
];

interface VipGuideModalProps {
  open: boolean;
  authUser: AuthUser | null;
  onClose: () => void;
  onGoToRedeemInput: () => void;
  onNotifyToast: (message: string) => void;
}

export function VipGuideModal({
  open,
  authUser,
  onClose,
  onGoToRedeemInput,
  onNotifyToast,
}: VipGuideModalProps) {
  const [selectedId, setSelectedId] = useState<string>(VIP_PACKAGES[1].id);
  const [qrFailed, setQrFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<'account' | 'note' | null>(null);

  const selectedPackage =
    VIP_PACKAGES.find((p) => p.id === selectedId) || VIP_PACKAGES[0];

  const userIdentifier = authUser?.email || authUser?.displayName || null;
  const transferNote = buildVipTransferNote(selectedPackage.code, userIdentifier);
  const qrUrl = buildVietQrUrl({
    bankCode: VIETQR_BANK_CONFIG.bankCode,
    accountNumber: VIETQR_BANK_CONFIG.accountNumber,
    accountName: VIETQR_BANK_CONFIG.accountName,
    amount: selectedPackage.price,
    transferNote,
  });

  useEffect(() => {
    setQrFailed(false);
  }, [qrUrl]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async (value: string, field: 'account' | 'note', label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      onNotifyToast(`Đã sao chép ${label}.`);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      onNotifyToast(`Không thể tự sao chép — vui lòng bôi đen ${label} để sao chép.`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#13161F] border border-[#C69B53]/45 rounded-xl p-5 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hướng dẫn nhận mã VIP"
          className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9A9892] hover:text-[#F1ECE1] hover:bg-white/[0.06] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Heading */}
        <div className="pr-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C69B53]">
            <Crown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thành viên VIP · Đọc trước chương mới</span>
          </div>
          <h2
            id="vip-guide-modal-title"
            className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F1E8] mt-1"
          >
            Hướng dẫn nhận mã VIP
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9892] mt-1.5">
            Chọn gói phù hợp, quét mã VietQR tự động điền số tiền và gửi biên lai cho tác giả để nhận mã kích hoạt dùng ngay.
          </p>
        </div>

        {/* 1. Package selector cards */}
        <fieldset className="mt-6 space-y-2.5">
          <legend className="text-xs font-semibold text-[#C9C5BC]">
            1. Chọn gói VIP
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VIP_PACKAGES.map((pkg) => {
              const selected = pkg.id === selectedPackage.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedId(pkg.id)}
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                    selected
                      ? 'border-[#C69B53] bg-[#C69B53]/12'
                      : 'border-white/[0.1] bg-[#0D1017] hover:border-white/[0.25]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#F5F1E8]">
                        {pkg.name}
                      </span>
                      {pkg.highlightLabel && (
                        <span className="text-[11px] font-semibold text-[#C69B53] whitespace-nowrap">
                          {pkg.highlightLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8C86]">{pkg.durationLabel}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#D8AE68] tabular-nums pt-1">
                    {formatVnd(pkg.price)}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 2. Dynamic VietQR + Bank transfer details */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* QR Box */}
          <div className="md:col-span-5 flex flex-col items-center space-y-2.5">
            <div className="bg-white p-3 rounded-lg border border-[#C69B53]/75 shadow-lg w-48 h-48 flex items-center justify-center">
              {!qrFailed ? (
                <img
                  src={qrUrl}
                  alt={`Mã VietQR chuyển khoản ${formatVnd(selectedPackage.price)} - ${transferNote}`}
                  referrerPolicy="no-referrer"
                  onError={() => setQrFailed(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-[#1A1D24] p-2 gap-1.5">
                  <QrCode className="w-12 h-12 text-[#8C6220]" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">VietQR {VIETQR_BANK_CONFIG.bankCode}</span>
                  <span className="text-[10px] text-[#555B66] leading-tight">
                    Chuyển khoản thủ công theo thông tin bên cạnh
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#8E8C86] text-center">
              Quét bằng app Ngân hàng hoặc MoMo / ZaloPay
            </p>
          </div>

          {/* Bank Details + Quick Copy */}
          <div className="md:col-span-7 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.07]">
              <span className="text-[#9A9892]">Ngân hàng</span>
              <span className="font-medium text-[#F1ECE1] text-right">
                {VIETQR_BANK_CONFIG.bankDisplayName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.07]">
              <span className="text-[#9A9892]">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span
                  data-testid="vip-bank-account"
                  className="font-mono font-semibold text-[#F5F1E8] tabular-nums"
                >
                  {VIETQR_BANK_CONFIG.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(VIETQR_BANK_CONFIG.accountNumber, 'account', 'số tài khoản')
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/[0.14] hover:border-[#C69B53] text-[11px] font-medium text-[#D8AE68] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copiedField === 'account' ? (
                    <>
                      <Check className="w-3 h-3" aria-hidden="true" />
                      Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.07]">
              <span className="text-[#9A9892]">Chủ tài khoản</span>
              <span className="font-medium text-[#F1ECE1]">
                {VIETQR_BANK_CONFIG.accountName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.07]">
              <span className="text-[#9A9892]">Số tiền</span>
              <span
                data-testid="vip-transfer-amount"
                className="font-semibold text-[#C69B53] tabular-nums"
              >
                {formatVnd(selectedPackage.price)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
              <span className="text-[#9A9892] shrink-0">Nội dung CK</span>
              <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0">
                <span
                  data-testid="vip-transfer-note"
                  className="font-mono text-xs sm:text-[13px] font-semibold text-[#F5F1E8] truncate"
                >
                  {transferNote}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(transferNote, 'note', 'nội dung chuyển khoản')
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/[0.14] hover:border-[#C69B53] text-[11px] font-medium text-[#D8AE68] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedField === 'note' ? (
                    <>
                      <Check className="w-3 h-3" aria-hidden="true" />
                      Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Concise 3-step guide */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-4">
          <h3 className="text-xs font-semibold text-[#C9C5BC]">
            Quy trình nhận mã kích hoạt trong 3 bước
          </h3>
          <ol className="space-y-3 text-xs sm:text-sm text-[#CFCBC2]">
            <li className="flex items-start gap-3">
              <span className="font-semibold text-[#C69B53] tabular-nums shrink-0">
                Bước 1.
              </span>
              <span>Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung chuyển khoản ở trên.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-semibold text-[#C69B53] tabular-nums shrink-0">
                Bước 2.
              </span>
              <div className="space-y-2.5 flex-1">
                <span>Chụp ảnh biên lai và gửi cho tác giả qua một trong hai kênh trực tiếp:</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={AUTHOR_CONTACT_LINKS.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/[0.14] bg-[#0D1017] hover:border-[#C69B53] text-xs font-medium text-[#F1ECE1] hover:text-[#C69B53] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#C69B53]" aria-hidden="true" />
                    Facebook / Messenger
                    <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                  </a>
                  <a
                    href={AUTHOR_CONTACT_LINKS.zaloOrDiscordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/[0.14] bg-[#0D1017] hover:border-[#C69B53] text-xs font-medium text-[#F1ECE1] hover:text-[#C69B53] transition-colors whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5 text-[#C69B53]" aria-hidden="true" />
                    Zalo / Discord
                    <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-semibold text-[#C69B53] tabular-nums shrink-0">
                Bước 3.
              </span>
              <span>
                Nhận mã kích hoạt VIP từ tác giả và nhập vào ô &ldquo;Kích hoạt VIP&rdquo; để mở khóa ngay lập tức.
              </span>
            </li>
          </ol>
        </div>

        {/* Footer CTA back to VIP Code input */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-[#8E8C86]">
            Quyền lợi VIP gắn liền với tài khoản của bạn và tự động đồng bộ trên mọi thiết bị.
          </p>
          <button
            type="button"
            onClick={onGoToRedeemInput}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Tôi đã có mã kích hoạt
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
