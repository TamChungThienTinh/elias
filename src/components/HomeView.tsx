import {
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  Crown,
  Lock,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  ARCS,
  CHAPTERS,
  NOVEL_INFO,
  RECOMMENDED_SERIES,
} from '../data/chapters';
import {MERCH_ITEMS} from '../data/merch';
import {SITE_CONFIG} from '../data/siteConfig';
import type {MerchItem, ReadingProgress, ViewRoute} from '../types';
import {
  calculateReadingTimeMinutes,
  formatCount,
  formatVnd,
  getMerchStatusLabel,
  getPersonalizedRecommendations,
  isChapterShowingVipLabel,
  isChapterVipCurrentlyLocked,
} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface HomeViewProps {
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  isVip: boolean;
  notificationsEnabled: boolean;
  onStartFromBeginning: () => void;
  onOpenChapter: (chapterId: string) => void;
  onNavigate: (route: ViewRoute) => void;
  onSelectMerch: (item: MerchItem) => void;
  onAddToCart: (item: MerchItem) => void;
  onOpenVipModal: () => void;
  onEnableNotifications: () => void;
}

export function HomeView({
  progress,
  readHistory,
  favorites,
  isVip,
  notificationsEnabled,
  onStartFromBeginning,
  onOpenChapter,
  onNavigate,
  onSelectMerch,
  onAddToCart,
  onOpenVipModal,
  onEnableNotifications,
}: HomeViewProps) {
  const featuredMerch = MERCH_ITEMS.filter((item) => item.featured).slice(0, 3);
  const latestChapters = [...CHAPTERS].reverse();
  const recommendations = getPersonalizedRecommendations(
    RECOMMENDED_SERIES,
    readHistory,
    favorites,
    CHAPTERS
  );

  const resumeChapter = progress
    ? CHAPTERS.find((c) => c.id === progress.chapterId)
    : null;

  return (
    <div className="space-y-20 pb-8">
      {/* SECTION 1: EDITORIAL DARK FANTASY HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.08] fade-in-up">
        {/* Atmospheric Hero Backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          {NOVEL_INFO.bannerImage.trim() ? (
            <SafeImage
              src={NOVEL_INFO.bannerImage}
              alt={`Ảnh nền ${NOVEL_INFO.title}`}
              loading="eager"
              className="w-full h-full object-cover opacity-35"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(198,155,83,0.12),_rgba(11,13,18,0)_60%)]"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/88 to-[#0B0D12]/65"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-[#0B0D12]/40"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Cover Art Column */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="w-60 sm:w-68 lg:w-full max-w-[300px] overflow-hidden rounded-lg bg-[#13161F] shadow-2xl">
                <SafeImage
                  src={NOVEL_INFO.coverImage}
                  alt={`Ảnh bìa tiểu thuyết ${NOVEL_INFO.title}`}
                  placeholderText="Chỗ đặt ảnh bìa truyện (tỷ lệ 3:4)"
                  loading="eager"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
            </div>

            {/* Editorial Copy & Single Adaptive Primary CTA */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#C69B53]">
                <span>{NOVEL_INFO.genres.join(' · ')}</span>
                <span aria-hidden="true" className="text-[#6E6D68]">·</span>
                <span className="text-[#C9C5BC]">{NOVEL_INFO.statusText}</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.12] text-[#F5F1E8] text-balance">
                  {NOVEL_INFO.title}
                </h1>
                <p className="font-display italic text-lg sm:text-xl text-[#B9B4A9]">
                  {NOVEL_INFO.subtitle} — Tác giả {NOVEL_INFO.author}
                </p>
              </div>

              <div className="space-y-3 max-w-2xl text-[15px] sm:text-base leading-relaxed text-[#CFCBC2]">
                {NOVEL_INFO.synopsis.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {resumeChapter ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenChapter(resumeChapter.id)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F1E8]"
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                      Đọc tiếp Chương {resumeChapter.number}
                    </button>
                    <button
                      type="button"
                      onClick={onStartFromBeginning}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/[0.15] bg-[#13161F]/80 hover:border-[#C69B53] text-[#F1ECE1] text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Đọc lại từ đầu
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onStartFromBeginning}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F1E8]"
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                      Đọc từ đầu
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('catalog')}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/[0.15] bg-[#13161F]/80 hover:border-[#C69B53] text-[#F1ECE1] text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Xem mục lục ({ARCS.length} Arc)
                      <ArrowRight className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/[0.08] text-xs text-[#9A9892]">
                <span>{ARCS.length} Arc đang phát hành</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{CHAPTERS.length} chương</span>
                <span aria-hidden="true">·</span>
                <span>{NOVEL_INFO.updateSchedule}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: LATEST CHAPTERS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 fade-in-up fade-delay-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <p className="text-xs font-medium text-[#C69B53]">Cập nhật mới nhất</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F1ECE1] mt-1">
              Danh sách chương vừa đăng
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C69B53] hover:text-[#D8AE68] transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Xem toàn bộ mục lục
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.08]">
          {latestChapters.map((chapter) => {
            const arc = ARCS.find((a) => a.id === chapter.arcId);
            const isFav = favorites.includes(chapter.id);
            const isReading = progress?.chapterId === chapter.id;
            const isRead = readHistory.includes(chapter.id);
            const showVipLabel = isChapterShowingVipLabel(chapter);
            const isLockedVip = isChapterVipCurrentlyLocked(chapter, isVip);
            const readMinutes = calculateReadingTimeMinutes(chapter.paragraphs);

            return (
              <div
                key={chapter.id}
                className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9A9892]">
                    <span className="text-[#C69B53] font-medium">
                      {arc?.title || 'Arc'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{chapter.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{readMinutes} phút đọc</span>
                    {showVipLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#D8AE68] font-medium">
                          <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                          VIP Đọc trước
                        </span>
                      </>
                    )}
                    {isRead && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#7EC49A]">Đã đọc</span>
                      </>
                    )}
                    {isReading && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#5E83B5] font-medium">Đang đọc dở</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChapter(chapter.id)}
                    className={`text-left font-display text-lg sm:text-xl font-medium group-hover:text-[#C69B53] transition-colors cursor-pointer ${
                      isRead && !isReading ? 'text-[#B9B5AC]' : 'text-[#F1ECE1]'
                    }`}
                  >
                    Chương {chapter.number}: {chapter.title}
                  </button>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-xs text-[#8E8C86] tabular-nums flex items-center gap-3">
                    <span>{formatCount(chapter.views)} lượt xem</span>
                    <span aria-hidden="true">·</span>
                    <span className={isFav ? 'text-[#C69B53]' : ''}>
                      {formatCount(chapter.likes + (isFav ? 1 : 0))} yêu thích
                    </span>
                  </div>

                  {isLockedVip ? (
                    <button
                      type="button"
                      onClick={() => onOpenChapter(chapter.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#C69B53]/55 bg-[#C69B53]/10 hover:bg-[#C69B53] hover:text-[#0B0D12] text-xs font-semibold text-[#D8AE68] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      Mở khóa VIP
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenChapter(chapter.id)}
                      className="px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] hover:text-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Đọc chương
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: FEATURED MERCH SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 fade-in-up fade-delay-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <p className="text-xs font-medium text-[#C69B53]">Ấn phẩm sưu tầm</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F1ECE1] mt-1">
              Merch nổi bật
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('merch')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C69B53] hover:text-[#D8AE68] transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Vào cửa hàng Merch
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mt-8">
          {featuredMerch.map((item) => {
            const statusText =
              item.stockStatusLabel || getMerchStatusLabel(item.status);
            const isOutOfStock = item.status === 'het-hang';
            const statusClass =
              item.status === 'con-hang'
                ? 'text-[#7EC49A]'
                : item.status === 'pre-order'
                ? 'text-[#D8AE68]'
                : 'text-[#D47A7A]';

            return (
              <article
                key={item.id}
                className="group bg-[#13161F] border border-white/[0.08] hover:border-[#C69B53]/50 rounded-lg overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => onSelectMerch(item)}
                  aria-label={`Xem chi tiết ${item.name}`}
                  className="w-full aspect-[4/3] bg-[#0D1017] overflow-hidden block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
                >
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    placeholderText="Chỗ đặt ảnh sản phẩm Merch (tỷ lệ 4:3)"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>

                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#9A9892]">
                      <span>{item.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-medium ${statusClass}`}>{statusText}</span>
                    </div>
                    <h3 className="font-ui text-base font-semibold text-[#F1ECE1] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectMerch(item)}
                        className="text-left hover:text-[#C69B53] transition-colors cursor-pointer"
                      >
                        {item.name}
                      </button>
                    </h3>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/[0.07]">
                    <span className="block text-[15px] font-semibold text-[#C69B53] tabular-nums">
                      {item.priceDisplay || formatVnd(item.priceVnd)}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectMerch(item)}
                        className="px-3 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] hover:text-[#C69B53] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onAddToCart(item)}
                        aria-label={`Thêm ${item.name} vào giỏ`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: AUTHOR NOTICE & OPTIONAL RELATED WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 fade-in-up fade-delay-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8 border-t border-white/[0.08] items-stretch">
          {/* Left (or full width if related section is hidden): Author Notice Box */}
          <div
            className={`${
              SITE_CONFIG.showRelatedSection ? 'lg:col-span-5' : 'lg:col-span-12'
            } flex flex-col`}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#C69B53]">
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              <span>Ghi chú &amp; Lịch cập nhật</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#F1ECE1] mt-2">
              {SITE_CONFIG.authorNoticeTitle}
            </h2>

            <div
              data-testid="author-notice-card"
              className="mt-5 flex-1 p-6 rounded-lg bg-[#13161F] border border-[#C69B53]/45 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="pb-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#C69B53] font-medium">
                    {SITE_CONFIG.authorName}
                  </span>
                  <span className="text-[#9A9892] tabular-nums">
                    Cập nhật: {SITE_CONFIG.authorNoticeDate}
                  </span>
                </div>

                <p className="text-sm text-[#CFCBC2] leading-relaxed whitespace-pre-line">
                  {SITE_CONFIG.authorNoticeContent}
                </p>

                <p className="text-xs text-[#9A9892] pt-1">
                  <span className="text-[#E6E3DC] font-medium">Lịch ra chương:</span>{' '}
                  {SITE_CONFIG.updateSchedule}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onEnableNotifications}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] hover:text-[#C69B53] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                  {notificationsEnabled ? 'Đã bật thông báo' : 'Nhận thông báo chương mới'}
                </button>

                {!isVip && (
                  <button
                    type="button"
                    onClick={onOpenVipModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#C69B53]/15 border border-[#C69B53]/40 hover:bg-[#C69B53] hover:text-[#0B0D12] text-xs font-semibold text-[#D8AE68] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                    Hướng dẫn nhận mã VIP
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Optional Related Works / Universe Section */}
          {SITE_CONFIG.showRelatedSection && (
            <div
              data-testid="related-works-section"
              className="lg:col-span-7 flex flex-col"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#5E83B5]">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Ngoại truyện &amp; Tư liệu mở rộng</span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#F1ECE1] mt-2">
                {SITE_CONFIG.relatedSectionTitle}
              </h2>
              <div className="mt-5 space-y-4 flex-1">
                {recommendations.map((story) => (
                  <div
                    key={story.id}
                    className="p-4 rounded-lg bg-[#13161F] border border-white/[0.08] flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                  >
                    <div className="w-full sm:w-28 aspect-[4/3] sm:aspect-[3/4] rounded-md overflow-hidden bg-[#0B0D12] shrink-0">
                      <SafeImage
                        src={story.coverImage}
                        alt={story.title}
                        placeholderText="Chỗ đặt ảnh minh họa (tỷ lệ 3:4)"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-xs text-[#8E8C86]">
                        {story.genre} · {story.arcHint}
                      </p>
                      <h3 className="font-display text-lg font-medium text-[#F1ECE1]">
                        {story.title}
                      </h3>
                      <p className="text-xs text-[#B9B4A9] leading-relaxed">
                        {story.blurb}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                        <span className="text-[11px] font-medium text-[#7EA3D4]">
                          {story.matchReason}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenChapter(story.linkedChapterId)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#C69B53] hover:text-[#D8AE68] whitespace-nowrap cursor-pointer"
                        >
                          Khám phá ngay
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {favorites.length > 0 && (
                <p className="text-xs text-[#8E8C86] flex items-center gap-1.5 mt-4">
                  <Bookmark className="w-3.5 h-3.5 text-[#C69B53]" aria-hidden="true" />
                  Bạn đang đánh dấu {favorites.length} chương yêu thích trong Thư viện.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
