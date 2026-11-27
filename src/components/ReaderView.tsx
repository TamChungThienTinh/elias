import {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Heart,
  List,
  MessageSquare,
  Minus,
  Moon,
  Plus,
  ScrollText,
  Sun,
} from 'lucide-react';
import {ARCS, CHAPTERS} from '../data/chapters';
import type {
  Chapter,
  ChapterComment,
  ReaderFontFamily,
  ReaderSettings,
  ReaderTheme,
  ReadingProgress,
} from '../types';
import {
  calculateReadingTimeMinutes,
  formatCount,
  paginateParagraphs,
  validateCommentInput,
} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface ReaderViewProps {
  chapter: Chapter;
  settings: ReaderSettings;
  progress: ReadingProgress | null;
  isFavorite: boolean;
  isOfflineSaved: boolean;
  isVip: boolean;
  defaultAuthorName: string;
  comments: ChapterComment[];
  likedCommentIds: string[];
  onUpdateSettings: (patch: Partial<ReaderSettings>) => void;
  onSaveProgress: (chapterId: string, scrollPercent: number, pageIndex: number) => void;
  onSelectChapter: (chapterId: string) => void;
  onBackToCatalog: () => void;
  onToggleFavorite: (chapterId: string) => void;
  onToggleOffline: (chapterId: string) => void;
  onOpenVipModal: () => void;
  onAddComment: (chapterId: string, author: string, content: string) => void;
  onToggleLikeComment: (commentId: string) => void;
}

const THEME_STYLES: Record<
  ReaderTheme,
  {
    pageBg: string;
    surfaceBg: string;
    toolbarBg: string;
    textPrimary: string;
    textProse: string;
    textMuted: string;
    border: string;
    buttonIdle: string;
    inputBg: string;
    accentText: string;
  }
> = {
  dark: {
    pageBg: 'bg-[#0D0F14]',
    surfaceBg: 'bg-[#141720]',
    toolbarBg: 'bg-[#0D0F14]/95',
    textPrimary: 'text-[#EFECE6]',
    textProse: 'text-[#D6D3CB]',
    textMuted: 'text-[#96948E]',
    border: 'border-white/[0.09]',
    buttonIdle: 'text-[#C9C5BC] hover:bg-white/[0.06]',
    inputBg: 'bg-[#0B0D12] text-[#EFECE6] placeholder:text-[#6E6D68]',
    accentText: 'text-[#C69B53]',
  },
  light: {
    pageBg: 'bg-[#F8F7F4]',
    surfaceBg: 'bg-[#FFFFFF]',
    toolbarBg: 'bg-[#F8F7F4]/95',
    textPrimary: 'text-[#1A1D24]',
    textProse: 'text-[#272B34]',
    textMuted: 'text-[#555B66]',
    border: 'border-black/[0.1]',
    buttonIdle: 'text-[#3D424D] hover:bg-black/[0.05]',
    inputBg: 'bg-[#FFFFFF] text-[#1A1D24] placeholder:text-[#7E828C]',
    accentText: 'text-[#8C6220]',
  },
  sepia: {
    pageBg: 'bg-[#F3ECD8]',
    surfaceBg: 'bg-[#ECE3CB]',
    toolbarBg: 'bg-[#F3ECD8]/95',
    textPrimary: 'text-[#2D241B]',
    textProse: 'text-[#3A2F23]',
    textMuted: 'text-[#5E4E3D]',
    border: 'border-[#4A3B28]/15',
    buttonIdle: 'text-[#4A3B28] hover:bg-[#4A3B28]/[0.07]',
    inputBg: 'bg-[#F7F1E1] text-[#2D241B] placeholder:text-[#84725E]',
    accentText: 'text-[#855B1B]',
  },
};

const FONT_CLASS_MAP: Record<ReaderFontFamily, string> = {
  lora: 'font-book',
  sans: 'font-ui',
  playfair: 'font-display',
  system: 'font-serif',
};

export function ReaderView({
  chapter,
  settings,
  progress,
  isFavorite,
  isOfflineSaved,
  isVip,
  defaultAuthorName,
  comments,
  likedCommentIds,
  onUpdateSettings,
  onSaveProgress,
  onSelectChapter,
  onBackToCatalog,
  onToggleFavorite,
  onToggleOffline,
  onOpenVipModal,
  onAddComment,
  onToggleLikeComment,
}: ReaderViewProps) {
  const palette = THEME_STYLES[settings.theme];
  const arc = ARCS.find((a) => a.id === chapter.arcId);
  const currentIndex = CHAPTERS.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? CHAPTERS[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < CHAPTERS.length - 1
      ? CHAPTERS[currentIndex + 1]
      : null;

  const isLockedVip = Boolean(chapter.isVipEarlyAccess && !isVip);
  const visibleParagraphs = isLockedVip
    ? chapter.paragraphs.slice(0, 2)
    : chapter.paragraphs;

  const charsPerPage = Math.max(460, Math.round(920 - (settings.fontSize - 16) * 32));
  const pages = useMemo(
    () => paginateParagraphs(visibleParagraphs, charsPerPage),
    [visibleParagraphs, charsPerPage]
  );

  const initialPage =
    progress && progress.chapterId === chapter.id
      ? Math.min(progress.pageIndex, Math.max(0, pages.length - 1))
      : 0;

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [scrollPercent, setScrollPercent] = useState(
    progress && progress.chapterId === chapter.id ? progress.scrollPercent : 0
  );

  const [commentAuthor, setCommentAuthor] = useState(defaultAuthorName);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const restoredChapterRef = useRef<string | null>(null);

  // Đồng bộ khi chuyển chương
  useEffect(() => {
    const savedForThis =
      progress && progress.chapterId === chapter.id ? progress : null;
    const targetPage = savedForThis
      ? Math.min(savedForThis.pageIndex, Math.max(0, pages.length - 1))
      : 0;
    setPageIndex(targetPage);
    setScrollPercent(savedForThis ? savedForThis.scrollPercent : 0);

    if (restoredChapterRef.current !== chapter.id) {
      restoredChapterRef.current = chapter.id;
      if (settings.readingMode === 'scroll' && savedForThis && savedForThis.scrollPercent > 5) {
        window.requestAnimationFrame(() => {
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          if (maxScroll > 0) {
            window.scrollTo({
              top: Math.round((savedForThis.scrollPercent / 100) * maxScroll),
              behavior: 'auto',
            });
          }
        });
      } else {
        window.scrollTo({top: 0, behavior: 'auto'});
      }
    }
  }, [chapter.id]);

  // Bảo đảm pageIndex hợp lệ khi đổi cỡ chữ
  useEffect(() => {
    if (pageIndex >= pages.length) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, pageIndex]);

  // Tự động lưu vị trí cuộn dọc
  useEffect(() => {
    if (settings.readingMode !== 'scroll') return;
    let timer: number | undefined;
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        maxScroll > 0
          ? Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100)))
          : 100;
      setScrollPercent(pct);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        onSaveProgress(chapter.id, pct, pageIndex);
      }, 250);
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [chapter.id, settings.readingMode, pageIndex, onSaveProgress]);

  // Hỗ trợ phím mũi tên trái/phải khi ở chế độ lật trang
  useEffect(() => {
    if (settings.readingMode !== 'paged') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        handleTurnPage(1);
      } else if (e.key === 'ArrowLeft') {
        handleTurnPage(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleTurnPage = (delta: 1 | -1) => {
    const nextIdx = pageIndex + delta;
    if (nextIdx < 0 || nextIdx >= pages.length) return;
    setPageDirection(delta);
    setPageIndex(nextIdx);
    const pct = Math.round(((nextIdx + 1) / pages.length) * 100);
    setScrollPercent(pct);
    onSaveProgress(chapter.id, pct, nextIdx);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateCommentInput(commentAuthor, commentText);
    if (!check.valid) {
      setCommentError(check.error || 'Vui lòng kiểm tra lại bình luận.');
      return;
    }
    setCommentError(null);
    onAddComment(chapter.id, commentAuthor.trim(), commentText.trim());
    setCommentText('');
  };

  const chapterComments = comments.filter((c) => c.chapterId === chapter.id);
  const readingMinutes = calculateReadingTimeMinutes(chapter.paragraphs);
  const displayProgress =
    settings.readingMode === 'paged'
      ? Math.round(((pageIndex + 1) / Math.max(1, pages.length)) * 100)
      : scrollPercent;

  return (
    <div
      data-reader-theme={settings.theme}
      className={`min-h-[calc(100vh-4rem)] transition-colors duration-200 ${palette.pageBg} ${palette.textPrimary}`}
    >
      {/* Thin reading depth progress indicator */}
      <div className="fixed top-16 left-0 right-0 z-30 h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-[#C69B53] transition-all duration-150"
          style={{width: `${Math.max(4, displayProgress)}%`}}
        />
      </div>

      {/* Reader Customization Toolbar */}
      <div
        className={`border-b ${palette.border} ${palette.toolbarBg} transition-colors`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
          {/* Left: Back to Catalog & Theme Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToCatalog}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${palette.buttonIdle}`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              Mục lục
            </button>

            <div
              role="group"
              aria-label="Chọn chế độ nền đọc truyện"
              className={`inline-flex items-center gap-1 p-0.5 rounded-md border ${palette.border}`}
            >
              {(
                [
                  {id: 'dark', label: 'Tối', icon: Moon},
                  {id: 'light', label: 'Sáng', icon: Sun},
                  {id: 'sepia', label: 'Giấy vàng', icon: ScrollText},
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = settings.theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({theme: item.id})}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#C69B53] text-[#0B0D12]'
                        : palette.buttonIdle
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Typography, Font Size, Paged Mode, Bookmark & Offline */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Font selector */}
            <label htmlFor="reader-font-select" className="sr-only">
              Chọn phông chữ
            </label>
            <select
              id="reader-font-select"
              value={settings.fontFamily}
              onChange={(e) =>
                onUpdateSettings({
                  fontFamily: e.target.value as ReaderFontFamily,
                })
              }
              className={`px-2.5 py-1.5 rounded-md border ${palette.border} ${palette.inputBg} text-xs font-medium focus:outline-none focus:border-[#C69B53]`}
            >
              <option value="lora">Lora (Sách)</option>
              <option value="sans">Jakarta Sans</option>
              <option value="playfair">Playfair Serif</option>
              <option value="system">Serif hệ thống</option>
            </select>

            {/* Font size stepper */}
            <div
              role="group"
              aria-label="Điều chỉnh cỡ chữ"
              className={`inline-flex items-center rounded-md border ${palette.border}`}
            >
              <button
                type="button"
                aria-label="Giảm cỡ chữ"
                disabled={settings.fontSize <= 15}
                onClick={() =>
                  onUpdateSettings({
                    fontSize: Math.max(15, settings.fontSize - 1),
                  })
                }
                className={`px-2 py-1.5 rounded-l-md transition-colors cursor-pointer disabled:opacity-40 ${palette.buttonIdle}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-medium tabular-nums">
                {settings.fontSize}px
              </span>
              <button
                type="button"
                aria-label="Tăng cỡ chữ"
                disabled={settings.fontSize >= 24}
                onClick={() =>
                  onUpdateSettings({
                    fontSize: Math.min(24, settings.fontSize + 1),
                  })
                }
                className={`px-2 py-1.5 rounded-r-md transition-colors cursor-pointer disabled:opacity-40 ${palette.buttonIdle}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reading mode switch: Scroll vs Page-Flip */}
            <div
              role="group"
              aria-label="Chế độ đọc trang"
              className={`inline-flex items-center gap-0.5 p-0.5 rounded-md border ${palette.border}`}
            >
              <button
                type="button"
                aria-pressed={settings.readingMode === 'scroll'}
                onClick={() => onUpdateSettings({readingMode: 'scroll'})}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  settings.readingMode === 'scroll'
                    ? 'bg-[#C69B53] text-[#0B0D12]'
                    : palette.buttonIdle
                }`}
              >
                Cuộn dọc
              </button>
              <button
                type="button"
                aria-pressed={settings.readingMode === 'paged'}
                onClick={() => onUpdateSettings({readingMode: 'paged'})}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  settings.readingMode === 'paged'
                    ? 'bg-[#C69B53] text-[#0B0D12]'
                    : palette.buttonIdle
                }`}
              >
                Lật trang
              </button>
            </div>

            {/* Bookmark & Offline toggles */}
            <button
              type="button"
              onClick={() => onToggleFavorite(chapter.id)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Bỏ yêu thích chương này' : 'Đánh dấu chương yêu thích'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isFavorite
                  ? `border-[#C69B53] bg-[#C69B53]/15 ${palette.accentText}`
                  : `${palette.border} ${palette.buttonIdle}`
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">Yêu thích</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleOffline(chapter.id)}
              aria-pressed={isOfflineSaved}
              aria-label={
                isOfflineSaved ? 'Đã lưu ngoại tuyến' : 'Tải chương đọc ngoại tuyến'
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isOfflineSaved
                  ? 'border-[#7EC49A]/70 bg-[#7EC49A]/15 text-[#58A377]'
                  : `${palette.border} ${palette.buttonIdle}`
              }`}
            >
              {isOfflineSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isOfflineSaved ? 'Đã lưu' : 'Ngoại tuyến'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Reading Column */}
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Chapter Heading */}
        <header className={`pb-6 border-b ${palette.border} space-y-2.5`}>
          <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs ${palette.textMuted}`}>
            <span className={`${palette.accentText} font-semibold`}>
              {arc?.title || 'Arc'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Chương {chapter.number}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{chapter.publishedAt}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{readingMinutes} phút đọc</span>
            {isOfflineSaved && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#3C845B] dark:text-[#58A377] font-medium">Sẵn sàng ngoại tuyến</span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-balance">
            {chapter.title}
          </h1>
        </header>

        {/* Optional Chapter Illustration (only on first page in paged mode so pages 2+ stay immediately visible) */}
        {chapter.illustration &&
          (settings.readingMode === 'scroll' || pageIndex === 0) && (
            <figure className="my-7">
              <div className={`overflow-hidden rounded-lg border ${palette.border}`}>
                <SafeImage
                  src={chapter.illustration}
                  alt={chapter.illustrationCaption || chapter.title}
                  className={`w-full object-cover ${
                    settings.readingMode === 'paged' ? 'max-h-[280px]' : 'max-h-[420px]'
                  }`}
                />
              </div>
              {chapter.illustrationCaption && (
                <figcaption className={`mt-2 text-xs italic font-book ${palette.textMuted}`}>
                  {chapter.illustrationCaption}
                </figcaption>
              )}
            </figure>
          )}

        {/* Reading Body: Scroll Mode vs Smooth Page-Flip Mode */}
        {settings.readingMode === 'scroll' ? (
          <div
            data-testid="reader-prose-scroll"
            className={`mt-8 space-y-6 ${FONT_CLASS_MAP[settings.fontFamily]} ${palette.textProse}`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            {visibleParagraphs.map((para, idx) => (
              <p
                key={idx}
                className={
                  idx === 0
                    ? 'first-letter:text-5xl first-letter:font-display first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.9] first-letter:text-[#C69B53]'
                    : ''
                }
              >
                {para}
              </p>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div
              data-testid="reader-prose-paged"
              className={`min-h-[380px] p-6 sm:p-8 rounded-xl border ${palette.border} ${palette.surfaceBg} overflow-hidden`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${chapter.id}-page-${pageIndex}`}
                  initial={{opacity: 0, x: pageDirection * 24}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: pageDirection * -24}}
                  transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
                  className={`space-y-5 ${FONT_CLASS_MAP[settings.fontFamily]} ${palette.textProse}`}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: settings.lineHeight,
                  }}
                >
                  {(pages[pageIndex] || []).map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Page-flip controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleTurnPage(-1)}
                disabled={pageIndex === 0}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border ${palette.border} text-xs font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${palette.buttonIdle}`}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Trang trước
              </button>

              <span className={`text-xs font-medium tabular-nums ${palette.textMuted}`}>
                Trang {pageIndex + 1} / {pages.length}
              </span>

              <button
                type="button"
                onClick={() => handleTurnPage(1)}
                disabled={pageIndex >= pages.length - 1}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border ${palette.border} text-xs font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${palette.buttonIdle}`}
              >
                Trang sau
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* VIP Early-Access Lock Card */}
        {isLockedVip && (
          <div className={`mt-10 p-6 sm:p-7 rounded-xl border border-[#C69B53]/40 ${palette.surfaceBg} space-y-4`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C69B53]">
              <Crown className="w-4 h-4" aria-hidden="true" />
              <span>Chương đọc trước Thành viên VIP</span>
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Mở khóa toàn bộ Chương {chapter.number} ngay hôm nay
            </h2>
            <p className={`text-sm leading-relaxed ${palette.textMuted}`}>
              Chương này thuộc quyền lợi đọc sớm trước lịch công khai ({chapter.vipUnlockDate || 'tuần tới'}). Kích hoạt gói Thành viên VIP để đọc trọn vẹn không quảng cáo qua Ví MoMo, ZaloPay hoặc Thẻ ngân hàng nội địa.
            </p>
            <button
              type="button"
              onClick={onOpenVipModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors cursor-pointer"
            >
              <Crown className="w-4 h-4" aria-hidden="true" />
              Mở khóa Thành viên VIP
            </button>
          </div>
        )}

        {/* Author Note */}
        {chapter.authorNote && !isLockedVip && (
          <div className={`mt-10 p-5 rounded-lg border ${palette.border} ${palette.surfaceBg}`}>
            <p className="text-xs font-semibold text-[#C69B53] mb-1.5">
              Lời nhắn của tác giả
            </p>
            <p className={`text-sm leading-relaxed ${palette.textMuted}`}>
              {chapter.authorNote}
            </p>
          </div>
        )}

        {/* Chapter Previous / Catalog / Next Navigation */}
        <nav
          aria-label="Chuyển chương"
          className={`mt-12 pt-7 border-t ${palette.border} grid grid-cols-1 sm:grid-cols-3 gap-3`}
        >
          <button
            type="button"
            disabled={!prevChapter}
            onClick={() => prevChapter && onSelectChapter(prevChapter.id)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border ${palette.border} text-sm font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${palette.buttonIdle}`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Chương trước
          </button>

          <button
            type="button"
            onClick={onBackToCatalog}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border ${palette.border} text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${palette.buttonIdle}`}
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Danh sách chương
          </button>

          <button
            type="button"
            disabled={!nextChapter}
            onClick={() => nextChapter && onSelectChapter(nextChapter.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          >
            Chương sau
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>

        {/* Interactive Comments Section */}
        <section
          aria-labelledby="comments-heading"
          className={`mt-14 pt-10 border-t ${palette.border} space-y-6`}
        >
          <div className="flex items-center justify-between">
            <h2
              id="comments-heading"
              className="font-display text-2xl font-semibold flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-[#C69B53]" aria-hidden="true" />
              Bình luận chương ({chapterComments.length})
            </h2>
            <span className={`text-xs tabular-nums ${palette.textMuted}`}>
              {formatCount(chapter.views)} lượt xem
            </span>
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className={`p-5 rounded-lg border ${palette.border} ${palette.surfaceBg} space-y-3`}
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="comment-author"
                  className={`block text-xs font-medium mb-1 ${palette.textMuted}`}
                >
                  Tên hiển thị
                </label>
                <input
                  id="comment-author"
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className={`w-full px-3 py-2 rounded-md border ${palette.border} ${palette.inputBg} text-sm focus:outline-none focus:border-[#C69B53]`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="comment-content"
                className={`block text-xs font-medium mb-1 ${palette.textMuted}`}
              >
                Cảm nhận về chương này
              </label>
              <textarea
                id="comment-content"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Chia sẻ suy nghĩ hoặc dự đoán diễn biến tiếp theo..."
                className={`w-full px-3 py-2 rounded-md border ${palette.border} ${palette.inputBg} text-sm focus:outline-none focus:border-[#C69B53]`}
              />
            </div>

            {commentError && (
              <p role="alert" className="text-xs text-[#D96B6B]">
                {commentError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs ${palette.textMuted}`}>
                Bình luận được lưu trên trình duyệt và đi kèm trong bản sao lưu của bạn.
              </p>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Gửi bình luận
              </button>
            </div>
          </form>

          {chapterComments.length === 0 ? (
            <p className={`text-sm py-6 text-center ${palette.textMuted}`}>
              Chưa có bình luận nào cho chương này. Hãy là người đầu tiên chia sẻ cảm nhận!
            </p>
          ) : (
            <ul className={`divide-y ${palette.border}`}>
              {chapterComments.map((cmt) => {
                const liked = likedCommentIds.includes(cmt.id);
                return (
                  <li key={cmt.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{cmt.author}</span>
                        {cmt.isVipBadge && (
                          <span className="text-[#C69B53] font-medium">VIP</span>
                        )}
                        <span aria-hidden="true" className={palette.textMuted}>·</span>
                        <span className={`tabular-nums ${palette.textMuted}`}>
                          {cmt.createdAt}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleLikeComment(cmt.id)}
                        aria-pressed={liked}
                        aria-label={`Thích bình luận của ${cmt.author}`}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs tabular-nums transition-colors cursor-pointer ${
                          liked
                            ? 'text-[#C69B53]'
                            : `${palette.textMuted} hover:text-[#C69B53]`
                        }`}
                      >
                        <Heart
                          className="w-3.5 h-3.5"
                          fill={liked ? 'currentColor' : 'none'}
                        />
                        {cmt.likes + (liked ? 1 : 0)}
                      </button>
                    </div>
                    <p className={`text-sm leading-relaxed ${palette.textProse}`}>
                      {cmt.content}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
