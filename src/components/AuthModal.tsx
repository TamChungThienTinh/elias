import {useEffect, useState} from 'react';
import {Chrome, Lock, Mail, User, X} from 'lucide-react';
import {isSupabaseConfigured} from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'signup';
  reasonMessage?: string | null;
  onClose: () => void;
  onEmailLogin: (email: string, password: string) => Promise<{error?: string}>;
  onEmailSignUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{error?: string; info?: string}>;
  onGoogleLogin: () => Promise<{error?: string}>;
}

export function AuthModal({
  open,
  initialMode = 'login',
  reasonMessage,
  onClose,
  onEmailLogin,
  onEmailSignUp,
  onGoogleLogin,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setInfo(null);
      setPassword('');
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }
    if (mode === 'signup' && displayName.trim().length < 2) {
      setError('Vui lòng nhập tên hiển thị từ 2 ký tự trở lên.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await onEmailLogin(cleanEmail, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await onEmailSignUp(cleanEmail, password, displayName.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.info) {
          setInfo(res.info);
        } else {
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const res = await onGoogleLogin();
      if (res.error) {
        setError(res.error);
      } else if (!isSupabaseConfigured) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#13161F] border border-[#C69B53]/35 rounded-xl p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập"
          className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9A9892] hover:text-[#F1ECE1] hover:bg-white/[0.06] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs font-medium text-[#C69B53]">Tài khoản độc giả</p>
        <h2
          id="auth-modal-title"
          className="font-display text-2xl font-semibold text-[#F5F1E8] mt-1"
        >
          {mode === 'login' ? 'Đăng nhập Huyết Nguyệt' : 'Tạo tài khoản mới'}
        </h2>
        <p className="text-xs text-[#9A9892] mt-1.5 leading-relaxed">
          {reasonMessage ||
            'Đồng bộ lịch sử đọc, danh sách yêu thích và quyền lợi Thành viên VIP trên mọi thiết bị.'}
        </p>

        {/* Tabs Đăng nhập / Đăng ký */}
        <div
          role="tablist"
          aria-label="Chọn đăng nhập hoặc đăng ký"
          className="mt-5 grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0B0D12] border border-white/[0.08]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login');
              setError(null);
              setInfo(null);
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'login'
                ? 'bg-[#C69B53] text-[#0B0D12]'
                : 'text-[#9A9892] hover:text-[#E6E3DC]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setError(null);
              setInfo(null);
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'signup'
                ? 'bg-[#C69B53] text-[#0B0D12]'
                : 'text-[#9A9892] hover:text-[#E6E3DC]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleClick}
          className="mt-5 w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md border border-white/[0.14] bg-[#191D29] hover:border-[#C69B53] text-sm font-medium text-[#F1ECE1] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
          Tiếp tục với Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] text-[#7D7B75]">
          <span className="flex-1 h-px bg-white/[0.08]" aria-hidden="true" />
          <span>hoặc dùng Email</span>
          <span className="flex-1 h-px bg-white/[0.08]" aria-hidden="true" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-display-name"
                className="block text-xs font-medium text-[#C9C5BC] mb-1.5"
              >
                Tên hiển thị
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-[#7D7B75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Minh Quân"
                  autoComplete="name"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-[#C9C5BC] mb-1.5"
            >
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-[#7D7B75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docgia@example.com"
                autoComplete="email"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-[#C9C5BC] mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-[#7D7B75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-[#E58A8A] leading-relaxed">
              {error}
            </p>
          )}

          {info && (
            <p role="status" className="text-xs text-[#7EC49A] leading-relaxed">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Đang xử lý...'
              : mode === 'login'
              ? 'Đăng nhập'
              : 'Tạo tài khoản'}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <p className="mt-4 pt-4 border-t border-white/[0.08] text-[11px] text-[#8E8C86] leading-relaxed">
            Chế độ thử nghiệm cục bộ đang hoạt động (chưa cấu hình biến môi trường Supabase). Bạn có thể đăng nhập bằng bất kỳ email nào để kiểm thử toàn bộ quy trình kích hoạt VIP.
          </p>
        )}
      </div>
    </div>
  );
}
