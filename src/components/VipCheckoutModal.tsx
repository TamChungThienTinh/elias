import {useEffect, useState} from 'react';
import {Check, CreditCard, ShieldCheck, Smartphone, X} from 'lucide-react';
import {formatVnd, validateVipForm} from '../utils/readerLogic';

interface VipCheckoutModalProps {
  open: boolean;
  defaultName: string;
  defaultEmail: string;
  onClose: () => void;
  onActivateVip: (planName: string, displayName: string, contact: string) => void;
}

const VIP_PLANS = [
  {
    id: 'vip-month',
    name: 'Thành viên Tháng',
    priceVnd: 39000,
    note: 'Đọc trước chương VIP 7 ngày · Không quảng cáo',
  },
  {
    id: 'vip-quarter',
    name: 'Thành viên Quý (3 tháng)',
    priceVnd: 99000,
    note: 'Tiết kiệm 15% · Tặng kèm gói hình nền độ phân giải cao',
  },
];

const PAYMENT_METHODS = [
  {id: 'momo', label: 'Ví MoMo', detail: 'Quét mã QR hoặc chuyển khoản nhanh'},
  {id: 'zalopay', label: 'Ví ZaloPay', detail: 'Thanh toán tức thì không phí'},
  {id: 'napas', label: 'Thẻ ngân hàng nội địa (VietQR / NAPAS)', detail: 'Hỗ trợ 40+ ngân hàng Việt Nam'},
];

export function VipCheckoutModal({
  open,
  defaultName,
  defaultEmail,
  onClose,
  onActivateVip,
}: VipCheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(VIP_PLANS[0].id);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [fullName, setFullName] = useState(defaultName);
  const [contact, setContact] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFullName(defaultName);
      setContact(defaultEmail);
      setError(null);
    }
  }, [open, defaultName, defaultEmail]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activePlan = VIP_PLANS.find((p) => p.id === selectedPlan) || VIP_PLANS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateVipForm(fullName, contact);
    if (!check.valid) {
      setError(check.error || 'Thông tin chưa hợp lệ.');
      return;
    }
    setError(null);
    onActivateVip(activePlan.name, fullName.trim(), contact.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#13161F] border border-white/[0.1] rounded-xl p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng ký VIP"
          className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9A9892] hover:text-[#E6E3DC] hover:bg-white/[0.06] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs font-medium text-[#C69B53]">Thành viên VIP · Đọc trước chương mới</p>
        <h2
          id="vip-modal-title"
          className="font-display text-2xl font-semibold text-[#F1ECE1] mt-1"
        >
          Mở khóa quyền lợi Thành viên
        </h2>
        <p className="text-sm text-[#9A9892] mt-1.5">
          Đọc trước chương mới của Arc 2, trải nghiệm đọc thuần khiết không quảng cáo và lưu trữ bản sao lưu không giới hạn.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {/* Plan selector */}
          <fieldset className="space-y-2.5">
            <legend className="text-xs font-medium text-[#C9C5BC] mb-2">
              1. Chọn gói thành viên
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIP_PLANS.map((plan) => {
                const selected = plan.id === selectedPlan;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#C69B53] bg-[#C69B53]/10'
                        : 'border-white/[0.08] bg-[#0E1118] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#F1ECE1]">
                        {plan.name}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />}
                    </div>
                    <p className="text-lg font-semibold text-[#C69B53] tabular-nums mt-1">
                      {formatVnd(plan.priceVnd)}
                    </p>
                    <p className="text-xs text-[#9A9892] mt-1.5 leading-relaxed">
                      {plan.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Payment methods */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[#C9C5BC] mb-2">
              2. Phương thức thanh toán (Ví điện tử &amp; Thẻ nội địa)
            </legend>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => {
                const selected = pm.id === paymentMethod;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#C69B53] bg-[#C69B53]/10'
                        : 'border-white/[0.08] bg-[#0E1118] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {pm.id === 'napas' ? (
                        <CreditCard className="w-4 h-4 text-[#C69B53] shrink-0" aria-hidden="true" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-[#C69B53] shrink-0" aria-hidden="true" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#F1ECE1]">{pm.label}</p>
                        <p className="text-xs text-[#8C8A84]">{pm.detail}</p>
                      </div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#C69B53] shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Reader contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="vip-fullname"
                className="block text-xs font-medium text-[#C9C5BC] mb-1.5"
              >
                Tên hiển thị độc giả
              </label>
              <input
                id="vip-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Quân"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
              />
            </div>
            <div>
              <label
                htmlFor="vip-contact"
                className="block text-xs font-medium text-[#C9C5BC] mb-1.5"
              >
                Email hoặc SĐT xác nhận
              </label>
              <input
                id="vip-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0912345678 hoặc email@..."
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-[#E58A8A]">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#8C8A84]">
              <ShieldCheck className="w-4 h-4 text-[#7EC49A] shrink-0" aria-hidden="true" />
              <span>Chế độ kích hoạt thử nghiệm tĩnh — không trừ tiền thật.</span>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Xác nhận ({formatVnd(activePlan.priceVnd)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
