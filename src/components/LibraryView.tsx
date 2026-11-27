import {useEffect, useRef, useState} from 'react';
import {
  Bell,
  Bookmark,
  BookOpen,
  Check,
  Cloud,
  Copy,
  Crown,
  Download,
  KeyRound,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  Trash2,
  Upload,
  WifiOff,
} from 'lucide-react';
import {CHAPTERS} from '../data/chapters';
import {SITE_CONFIG} from '../data/siteConfig';
import {isSupabaseConfigured} from '../lib/supabase';
import type {
  AppBackupPayload,
  AuthUser,
  OfflineChapterRecord,
  ReaderProfile,
  ReadingProgress,
  ViewRoute,
  VipRedeemResult,
} from '../types';
import {
  decodeSyncCode,
  encodeSyncCode,
  formatVipMembershipSummary,
} from '../utils/readerLogic';

export type LibraryTab = 'bookmarks' | 'offline' | 'sync' | 'notifications' | 'vip';

interface LibraryViewProps {
  authUser: AuthUser | null;
  profile: ReaderProfile;
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  offlineChapters: OfflineChapterRecord[];
  backupPayload: AppBackupPayload;
  requestedTab?: LibraryTab | null;
  focusVipInputSignal: number;
  onConsumeRequestedTab: () => void;
  onOpenChapter: (chapterId: string) => void;
  onNavigate: (route: ViewRoute) => void;
  onToggleFavorite: (chapterId: string) => void;
  onToggleOffline: (chapterId: string) => void;
  onDownloadAllOffline: () => void;
  onUpdateProfile: (patch: Partial<ReaderProfile>) => void;
  onImportBackup: (payload: AppBackupPayload) => void;
  onTriggerNotificationTest: () => void;
  onEnableNotifications: () => void;
  onOpenAuthModal: (reason?: string) => void;
  onSignOut: () => void;
  onOpenVipGuideModal: () => void;
  onRedeemVipCode: (code: string) => Promise<VipRedeemResult>;
  onNotifyToast: (message: string) => void;
}

export function LibraryView({
  authUser,
  profile,
  progress,
  readHistory,
  favorites,
  offlineChapters,
  backupPayload,
  requestedTab,
  focusVipInputSignal,
  onConsumeRequestedTab,
  onOpenChapter,
  onNavigate,
  onToggleFavorite,
  onToggleOffline,
  onDownloadAllOffline,
  onUpdateProfile,
  onImportBackup,
  onTriggerNotificationTest,
  onEnableNotifications,
  onOpenAuthModal,
  onSignOut,
  onOpenVipGuideModal,
  onRedeemVipCode,
  onNotifyToast,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>(requestedTab || 'bookmarks');
  const [syncInput, setSyncInput] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [vipCodeInput, setVipCodeInput] = useState('');
  const [vipCodeError, setVipCodeError] = useState<string | null>(null);
  const [vipRedeeming, setVipRedeeming] = useState(false);
  const vipInputRef = useRef<HTMLInputElement | null>(null);

  const vipSummary = formatVipMembershipSummary(profile.isVip, profile.vipExpiresAt);

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
      onConsumeRequestedTab();
    }
  }, [requestedTab, onConsumeRequestedTab]);

  useEffect(() => {
    if (focusVipInputSignal <= 0) return;
    setActiveTab('vip');
    window.setTimeout(() => {
      vipInputRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
      vipInputRef.current?.focus();
    }, 180);
  }, [focusVipInputSignal]);

  const handleRedeemVipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVipCodeError(null);
    const trimmed = vipCodeInput.trim();
    if (!trimmed) {
      setVipCodeError('Vui lòng nhập mã kích hoạt VIP.');
      return;
    }
    setVipRedeeming(true);
    try {
      const res = await onRedeemVipCode(trimmed);
      if (!res.success) {
        setVipCodeError(res.message);
      } else {
        setVipCodeInput('');
      }
    } finally {
      setVipRedeeming(false);
    }
  };

  const syncCode = encodeSyncCode(backupPayload);
  const totalOfflineKb = offlineChapters.reduce((sum, item) => sum + item.sizeKb, 0);

  const favoriteChapterObjects = CHAPTERS.filter((c) => favorites.includes(c.id));
  const historyChapterObjects = readHistory
    .map((id) => CHAPTERS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const resumeChapter = progress
    ? CHAPTERS.find((c) => c.id === progress.chapterId)
    : null;

  const handleCopySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopiedCode(true);
      onNotifyToast('Đã sao chép mã đồng bộ thiết bị.');
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      onNotifyToast('Không thể truy cập bộ nhớ tạm — hãy chọn và sao chép mã thủ công.');
    }
  };

  const handleDownloadBackupFile = () => {
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huyet-nguyet-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onUpdateProfile({lastBackupAt: new Date().toLocaleString('vi-VN')});
    onNotifyToast('Đã xuất tệp sao lưu thư viện JSON.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppBackupPayload;
        if (!parsed || typeof parsed.version !== 'number' || !parsed.profile) {
          setSyncError('Tệp sao lưu JSON không đúng định dạng.');
          return;
        }
        setSyncError(null);
        onImportBackup(parsed);
      } catch {
        setSyncError('Không thể đọc tệp JSON này.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreSyncCode = (e: React.FormEvent) => {
    e.preventDefault();
    const decoded = decodeSyncCode(syncInput);
    if (!decoded) {
      setSyncError('Mã đồng bộ không hợp lệ (cần bắt đầu bằng HNCD1:).');
      return;
    }
    setSyncError(null);
    setSyncInput('');
    onImportBackup(decoded);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#C69B53]">Góc độc giả</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F5F1E8] mt-1">
            Thư viện &amp; Đồng bộ cá nhân
          </h1>
          <p className="text-sm text-[#9A9892] mt-2">
            {authUser
              ? isSupabaseConfigured
                ? 'Tài khoản của bạn đang đồng bộ trực tuyến lịch sử đọc, danh sách yêu thích và quyền lợi VIP với Supabase.'
                : 'Bạn đang đăng nhập ở chế độ thử nghiệm cục bộ. Lịch sử đọc, yêu thích và trạng thái VIP được đồng bộ theo tài khoản trên thiết bị này.'
              : 'Đăng nhập tài khoản để đồng bộ lịch sử đọc, chương yêu thích và kích hoạt Thành viên VIP trên nhiều thiết bị.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#C9C5BC] shrink-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>{authUser ? authUser.displayName : profile.displayName}</span>
            <span aria-hidden="true" className="text-[#6E6D68]">·</span>
            <span className={vipSummary.active ? 'text-[#C69B53] font-semibold' : 'text-[#9A9892]'}>
              {vipSummary.tierLabel}
            </span>
          </div>
          {authUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.12] hover:border-[#D47A7A]/60 text-[#D47A7A] transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Đăng xuất
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div
        role="tablist"
        aria-label="Mục quản lý thư viện"
        className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#13161F] border border-white/[0.08]"
      >
        {(
          [
            {id: 'bookmarks', label: `Yêu thích (${favorites.length})`, icon: Bookmark},
            {
              id: 'offline',
              label: vipSummary.active
                ? `Ngoại tuyến (${offlineChapters.length})`
                : 'Ngoại tuyến (VIP)',
              icon: Download,
            },
            {id: 'sync', label: 'Đồng bộ & Sao lưu', icon: Cloud},
            {id: 'notifications', label: 'Thông báo', icon: Bell},
            {id: 'vip', label: 'Thành viên VIP', icon: Crown},
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#C69B53] text-[#0B0D12]'
                  : 'text-[#9A9892] hover:text-[#E6E3DC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOOKMARKS & READING HISTORY */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-8 fade-in-up">
          {resumeChapter && progress && (
            <div className="p-6 rounded-lg bg-[#13161F] border border-white/[0.1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#5E83B5]">Vị trí đọc gần nhất</p>
                <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
                  Chương {resumeChapter.number}: {resumeChapter.title}
                </h2>
                <p className="text-xs text-[#9A9892] tabular-nums">
                  Tiến độ đã lưu: {Math.round(progress.scrollPercent)}% · Trang {progress.pageIndex + 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChapter(resumeChapter.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Đọc tiếp ngay
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Favorite Chapters */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
                Chương đã đánh dấu yêu thích
              </h2>
              {favoriteChapterObjects.length === 0 ? (
                <div className="p-5 rounded-lg border border-white/[0.08] bg-[#13161F] space-y-3.5">
                  <p className="text-sm text-[#8E8C86] leading-relaxed">
                    Bạn chưa đánh dấu chương nào. Nhấn biểu tượng đánh dấu trong Mục lục hoặc Trang đọc để lưu lại.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/[0.14] hover:border-[#C69B53] text-xs font-medium text-[#F1ECE1] hover:text-[#C69B53] transition-colors cursor-pointer"
                  >
                    Xem Mục lục
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
                  {favoriteChapterObjects.map((ch) => (
                    <li key={ch.id} className="py-3.5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenChapter(ch.id)}
                        className="text-left text-sm font-medium text-[#F1ECE1] hover:text-[#C69B53] cursor-pointer"
                      >
                        Chương {ch.number}: {ch.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(ch.id)}
                        aria-label={`Bỏ yêu thích Chương ${ch.number}`}
                        className="text-xs text-[#9A9892] hover:text-[#D47A7A] cursor-pointer whitespace-nowrap"
                      >
                        Bỏ lưu
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Reading History */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
                Lịch sử đọc gần đây
              </h2>
              {historyChapterObjects.length === 0 ? (
                <div className="p-5 rounded-lg border border-white/[0.08] bg-[#13161F] space-y-3.5">
                  <p className="text-sm text-[#8E8C86] leading-relaxed">
                    Chưa có lịch sử đọc. Mở Chương 1 để bắt đầu ghi nhận tiến độ đọc tự động trên thiết bị này.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenChapter(CHAPTERS[0].id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    Mở Chương 1 ngay
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
                  {historyChapterObjects.map((ch) => (
                    <li key={ch.id} className="py-3.5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenChapter(ch.id)}
                        className="text-left text-sm font-medium text-[#F1ECE1] hover:text-[#C69B53] cursor-pointer"
                      >
                        Chương {ch.number}: {ch.title}
                      </button>
                      <span className="text-xs text-[#8E8C86] tabular-nums whitespace-nowrap">
                        {ch.publishedAt}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: OFFLINE CHAPTERS (VIP-ONLY) */}
      {activeTab === 'offline' && (
        <div className="space-y-6 fade-in-up">
          {!vipSummary.active ? (
            <div
              data-testid="library-offline-vip-lock"
              className="p-7 sm:p-9 rounded-xl bg-[#13161F] border border-[#C69B53]/50 space-y-5"
            >
              <div className="space-y-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C69B53]">
                  <Crown className="w-4 h-4" aria-hidden="true" />
                  Đặc quyền Thành viên VIP
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F1E8] text-balance">
                  Đọc ngoại tuyến không cần mạng
                </h2>
                <p className="text-sm text-[#CFCBC2] leading-relaxed max-w-2xl">
                  Tính năng tải đọc ngoại tuyến chỉ dành riêng cho Thành viên VIP còn hạn. Khi nâng cấp VIP, bạn có thể tải từng chương hoặc toàn bộ bộ truyện về thiết bị để đọc mượt mà trên máy bay, tàu xe hay bất cứ nơi nào không có kết nối mạng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.08] text-xs text-[#9A9892]">
                <div className="flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-[#C69B53] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Tải từng chương hoặc tải trọn bộ chỉ với 1 chạm.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#7EC49A] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Tự động bảo toàn đầy đủ nội dung chương VIP đã mở khóa.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Trash2 className="w-4 h-4 text-[#C69B53] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Quản lý dung lượng dễ dàng, xóa từng chương khi cần.</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('vip');
                    window.setTimeout(() => {
                      vipInputRef.current?.focus();
                    }, 120);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Crown className="w-4 h-4" aria-hidden="true" />
                  Nâng cấp VIP ngay
                </button>
                <button
                  type="button"
                  onClick={onOpenVipGuideModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-[#C69B53]/50 hover:border-[#C69B53] text-[#D8AE68] text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  Hướng dẫn nhận mã VIP
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 rounded-lg bg-[#13161F] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C69B53]">
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                    Quyền lợi Thành viên VIP đang hoạt động
                  </p>
                  <h2 className="font-display text-xl font-semibold text-[#F1ECE1] mt-1">
                    Kho lưu trữ đọc ngoại tuyến
                  </h2>
                  <p className="text-xs text-[#9A9892] mt-1 tabular-nums">
                    Đã lưu {offlineChapters.length} / {CHAPTERS.length} chương · Dung lượng bộ nhớ đệm: {totalOfflineKb} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadAllOffline}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Tải tất cả chương
                </button>
              </div>

              {offlineChapters.length === 0 ? (
                <p className="text-sm text-[#8E8C86] p-6 rounded-lg border border-white/[0.08] bg-[#13161F]">
                  Chưa có chương nào được tải về máy. Bấm &ldquo;Tải tất cả chương&rdquo; hoặc biểu tượng tải xuống ở từng chương trong Mục lục để đọc mượt mà ngay cả khi mất kết nối mạng.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
                  {offlineChapters.map((rec) => {
                    const ch = CHAPTERS.find((c) => c.id === rec.chapterId);
                    if (!ch) return null;
                    return (
                      <li key={rec.chapterId} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7EC49A]/15 text-[#7EC49A] shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenChapter(ch.id)}
                              className="text-left text-sm font-medium text-[#F1ECE1] hover:text-[#C69B53] cursor-pointer"
                            >
                              Chương {ch.number}: {ch.title}
                            </button>
                            <p className="text-xs text-[#8E8C86] tabular-nums mt-0.5">
                              Đã tải ngày {rec.savedAt} · {rec.sizeKb} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleOffline(ch.id)}
                          aria-label={`Xóa bản lưu ngoại tuyến Chương ${ch.number}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.1] text-xs text-[#9A9892] hover:text-[#D47A7A] hover:border-[#D47A7A]/40 cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Xóa
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT PROFILE, AUTO-BACKUP & CROSS-DEVICE SYNC */}
      {activeTab === 'sync' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-in-up">
          <div className="p-6 rounded-lg bg-[#13161F] border border-white/[0.08] space-y-5">
            <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
              Hồ sơ cá nhân &amp; Sao lưu tự động
            </h2>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-medium text-[#C9C5BC] mb-1"
                >
                  Tên hiển thị độc giả
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => onUpdateProfile({displayName: e.target.value})}
                  className="w-full px-3.5 py-2 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] focus:outline-none focus:border-[#C69B53]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-medium text-[#C9C5BC] mb-1"
                >
                  Email đồng bộ (tùy chọn)
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => onUpdateProfile({email: e.target.value})}
                  placeholder="ban@example.com"
                  className="w-full px-3.5 py-2 rounded-md bg-[#0B0D12] border border-white/[0.12] text-sm text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
                />
              </div>

              <label className="flex items-center justify-between gap-3 pt-2 cursor-pointer">
                <span className="text-xs text-[#C9C5BC]">
                  Tự động ghi nhận bản sao lưu khi đổi chương hoặc đánh dấu
                </span>
                <input
                  type="checkbox"
                  checked={profile.autoBackupEnabled}
                  onChange={(e) =>
                    onUpdateProfile({autoBackupEnabled: e.target.checked})
                  }
                  className="w-4 h-4 accent-[#C69B53]"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBackupFile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Tải tệp sao lưu JSON
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                Nhập tệp JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJsonFile}
                  className="sr-only"
                />
              </label>
            </div>

            {profile.lastBackupAt && (
              <p className="text-xs text-[#8E8C86] tabular-nums">
                Lần sao lưu gần nhất: {profile.lastBackupAt}
              </p>
            )}
          </div>

          <div className="p-6 rounded-lg bg-[#13161F] border border-white/[0.08] space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
                Đồng bộ nhanh giữa điện thoại &amp; máy tính
              </h2>
              <p className="text-xs text-[#9A9892] mt-1 leading-relaxed">
                Sao chép mã đồng bộ chứa toàn bộ tiến độ đọc, chương yêu thích, cài đặt giao diện và bình luận, sau đó dán vào thiết bị kia (không cần máy chủ hay tài khoản bên thứ ba).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#C9C5BC]">
                  Mã đồng bộ thiết bị hiện tại
                </span>
                <button
                  type="button"
                  onClick={handleCopySyncCode}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C69B53] hover:text-[#D8AE68] cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép mã
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                aria-label="Mã đồng bộ thiết bị hiện tại"
                value={syncCode}
                className="w-full px-3 py-2 rounded-md bg-[#0B0D12] border border-white/[0.1] text-[11px] font-mono text-[#9A9892] break-all"
              />
            </div>

            <form onSubmit={handleRestoreSyncCode} className="space-y-2.5">
              <label
                htmlFor="restore-sync-input"
                className="block text-xs font-medium text-[#C9C5BC]"
              >
                Khôi phục từ mã thiết bị khác
              </label>
              <textarea
                id="restore-sync-input"
                rows={2}
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
                placeholder="Dán mã bắt đầu bằng HNCD1:... tại đây"
                className="w-full px-3 py-2 rounded-md bg-[#0B0D12] border border-white/[0.12] text-xs text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
              />
              {syncError && (
                <p role="alert" className="text-xs text-[#E58A8A]">
                  {syncError}
                </p>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-white/[0.14] hover:border-[#C69B53] text-xs font-medium text-[#F1ECE1] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Khôi phục dữ liệu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PUSH NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-lg bg-[#13161F] border border-white/[0.08] space-y-6 fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#F1ECE1]">
                Thông báo đẩy chương truyện mới
              </h2>
              <p className="text-xs text-[#9A9892] mt-1">
                Nhận thông báo ngay khi {SITE_CONFIG.storyTitle} đăng chương mới ({SITE_CONFIG.updateSchedule}).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onEnableNotifications}
                className="px-4 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {profile.notificationsEnabled
                  ? 'Đang bật thông báo'
                  : 'Bật thông báo đẩy'}
              </button>
              <button
                type="button"
                onClick={onTriggerNotificationTest}
                className="px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap cursor-pointer"
              >
                Thử thông báo chương mới
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-medium text-[#C69B53]">
              Lịch sử cập nhật gần đây
            </h3>
            <ul className="divide-y divide-white/[0.07]">
              {[...CHAPTERS].reverse().map((ch) => (
                <li
                  key={ch.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F1ECE1]">
                      Chương mới: Chương {ch.number} — {ch.title}
                    </p>
                    <p className="text-xs text-[#8E8C86] tabular-nums mt-0.5">
                      Phát hành ngày {ch.publishedAt}
                      {ch.isVipEarlyAccess ? ' · Đọc trước VIP' : ' · Công khai'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChapter(ch.id)}
                    className="text-xs font-medium text-[#C69B53] hover:text-[#D8AE68] self-start sm:self-auto cursor-pointer whitespace-nowrap"
                  >
                    Mở đọc ngay
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 5: VIP MEMBERSHIP */}
      {activeTab === 'vip' && (
        <div className="space-y-6 fade-in-up">
          {/* Current Account Tier & Expiry Card */}
          <div className="p-6 sm:p-8 rounded-xl bg-[#13161F] border border-[#C69B53]/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#C69B53] inline-flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                  Trạng thái tài khoản hiện tại
                </p>
                <h2
                  data-testid="library-vip-tier"
                  className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F1E8]"
                >
                  {vipSummary.tierLabel}
                </h2>
                <p
                  data-testid="library-vip-expiry"
                  className={`text-sm tabular-nums ${
                    vipSummary.active ? 'text-[#D8AE68] font-medium' : 'text-[#9A9892]'
                  }`}
                >
                  {vipSummary.expiryLabel}
                </p>
                {authUser && (
                  <p className="text-xs text-[#8E8C86]">
                    Tài khoản: <span className="text-[#E6E3DC]">{authUser.email}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                {vipSummary.active && CHAPTERS.length > 0 && (() => {
                  const vipShortcutChapter =
                    CHAPTERS.find((c) => c.isVipEarlyAccess) || CHAPTERS[0];
                  return (
                    <button
                      type="button"
                      onClick={() => onOpenChapter(vipShortcutChapter.id)}
                      className="px-4 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Đọc Chương {vipShortcutChapter.number}
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={onOpenVipGuideModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-[#C69B53]/50 hover:bg-[#C69B53] hover:text-[#0B0D12] text-[#D8AE68] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                  Hướng dẫn nhận mã VIP
                </button>
              </div>
            </div>

            {/* Redeem / Extend VIP Code Box */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F1E8]">
                  {vipSummary.active ? 'Gia hạn thêm thời gian VIP' : 'Kích hoạt bằng Mã VIP'}
                </h3>
                <p className="text-xs text-[#9A9892] mt-1">
                  Nhập mã kích hoạt dùng 1 lần nhận từ tác giả. Nếu bạn đang là Thành viên VIP, số ngày mới sẽ tự động cộng dồn vào ngày hết hạn hiện tại.
                </p>
              </div>

              {!authUser ? (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenAuthModal(
                        'Đăng nhập tài khoản để nhập mã kích hoạt và lưu quyền lợi Thành viên VIP.'
                      )
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Đăng nhập để kích hoạt VIP
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRedeemVipSubmit} className="space-y-2.5" noValidate>
                  <label htmlFor="library-vip-code-input" className="sr-only">
                    Mã kích hoạt VIP
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1 max-w-md">
                      <KeyRound
                        className="w-4 h-4 text-[#C69B53] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        ref={vipInputRef}
                        id="library-vip-code-input"
                        type="text"
                        value={vipCodeInput}
                        onChange={(e) => {
                          setVipCodeInput(e.target.value);
                          if (vipCodeError) setVipCodeError(null);
                        }}
                        placeholder="Nhập mã kích hoạt VIP (vd: VIP30-DEMO)"
                        autoComplete="off"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B0D12] border border-white/[0.14] text-sm font-mono uppercase text-[#F1ECE1] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#C69B53]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={vipRedeeming}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      <Crown className="w-4 h-4" aria-hidden="true" />
                      {vipRedeeming
                        ? 'Đang kích hoạt...'
                        : vipSummary.active
                        ? 'Gia hạn ngay'
                        : 'Kích hoạt ngay'}
                    </button>
                  </div>

                  {vipCodeError && (
                    <p role="alert" className="text-xs text-[#E58A8A]">
                      {vipCodeError}
                    </p>
                  )}

                  {!isSupabaseConfigured && (
                    <p className="text-[11px] text-[#8E8C86]">
                      Mã thử nghiệm cục bộ: <span className="font-mono text-[#C9C5BC]">VIP30-DEMO</span> (30 ngày),{' '}
                      <span className="font-mono text-[#C9C5BC]">VIP90-DEMO</span> (90 ngày),{' '}
                      <span className="font-mono text-[#C9C5BC]">VIPFULL-DEMO</span> (Vĩnh viễn).
                    </p>
                  )}
                </form>
              )}
            </div>

            <div className="pt-5 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1.5">
                <h3 className="font-semibold text-[#F1ECE1]">Đọc trước 7 ngày</h3>
                <p className="text-xs text-[#9A9892] leading-relaxed">
                  Mở khóa sớm toàn bộ chương mới dành cho Thành viên VIP trước ngày tự động phát hành miễn phí.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-[#F1ECE1]">Đồng bộ theo tài khoản</h3>
                <p className="text-xs text-[#9A9892] leading-relaxed">
                  Quyền lợi VIP, lịch sử đọc và danh sách chương yêu thích tự động đồng bộ qua Supabase.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-[#F1ECE1]">Huy hiệu VIP vàng đồng</h3>
                <p className="text-xs text-[#9A9892] leading-relaxed">
                  Hiển thị huy hiệu Thành viên VIP trên thanh tài khoản và khi bình luận chương truyện.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
