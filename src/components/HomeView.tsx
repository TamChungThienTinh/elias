import {ArrowRight, Bookmark, BookOpen, Crown, Flame, Sparkles} from 'lucide-react';
import {ARCS, CHAPTERS, NOVEL_INFO, RECOMMENDED_SERIES} from '../data/chapters';
import {MERCH_ITEMS} from '../data/merch';
import type {MerchItem, ReadingProgress, ViewRoute} from '../types';
import {
  calculateReadingTimeMinutes,
  formatCount,
  formatVnd,
  getMerchStatusLabel,
  getPersonalizedRecommendations,
  sortChapters,
} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface HomeViewProps {
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  isVip: boolean;
  onStartFromBeginning: () => void;
  onOpenChapter: (chapterId: string) => void;
  onNavigate: (route: ViewRoute) => void;
  onSelectMerch: (item: MerchItem) => void;
}

export function HomeView({
  progress,
  readHistory,
  favorites,
  isVip,
  onStartFromBeginning,
  onOpenChapter,
  onNavigate,
  onSelectMerch,
}: HomeViewProps) {
  const featuredMerch = MERCH_ITEMS.filter((item) => item.featured).slice(0, 3);
  const latestChapters = [...CHAPTERS].reverse();
  const weeklyTopChapters = sortChapters(CHAPTERS, 'views', favorites);
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
      <section className="relative overflow-hidden border-b border-white/[0.08]">
        {/* Atmospheric Citadel Backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <SafeImage
            src={NOVEL_INFO.bannerImage}
            alt="Bối cảnh kinh thành Thạch Uyên dưới vầng nhật thực"
            loading="eager"
            className="w-full h-full object-cover opacity-35"
          />
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
              <div className="w-60 sm:w-68 lg:w-full max-w-[300px] overflow-hidden rounded-lg border border-white/[0.12] bg-[#13161F] shadow-2xl">
                <SafeImage
                  src={NOVEL_INFO.coverImage}
                  alt={`Ảnh bìa tiểu thuyết ${NOVEL_INFO.title}`}
                  loading="eager"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
            </div>

            {/* Editorial Copy & Primary CTA */}
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
                <button
                  type="button"
                  onClick={onStartFromBeginning}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F1E8]"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Đọc từ đầu
                </button>

                {resumeChapter ? (
                  <button
                    type="button"
                    onClick={() => onOpenChapter(resumeChapter.id)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/[0.15] bg-[#13161F]/80 hover:border-[#C69B53] text-[#F1ECE1] text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Đọc tiếp Chương {resumeChapter.number}
                    <ArrowRight className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/[0.15] bg-[#13161F]/80 hover:border-[#C69B53] text-[#F1ECE1] text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Xem mục lục ({ARCS.length} Arc)
                    <ArrowRight className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/[0.08] text-xs text-[#9A9892]">
                <span>{ARCS.length} Arc đang phát hành</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{CHAPTERS.length} chương mẫu &amp; đọc trước</span>
                <span aria-hidden="true">·</span>
                <span>{NOVEL_INFO.updateSchedule}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: LATEST CHAPTERS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
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
                    {chapter.isVipEarlyAccess && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#D8AE68] font-medium">
                          <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                          {isVip ? 'Đã mở khóa VIP' : 'Đọc trước VIP'}
                        </span>
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
                    className="text-left font-display text-lg sm:text-xl font-medium text-[#F1ECE1] group-hover:text-[#C69B53] transition-colors cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => onOpenChapter(chapter.id)}
                    className="px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] hover:text-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Đọc chương
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: FEATURED MERCH SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
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
            const statusText = getMerchStatusLabel(item.status);
            const statusClass =
              item.status === 'con-hang'
                ? 'text-[#7EC49A]'
                : item.status === 'pre-order'
                ? 'text-[#D8AE68]'
                : 'text-[#D47A7A]';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMerch(item)}
                className="group text-left bg-[#13161F] border border-white/[0.08] hover:border-[#C69B53]/50 rounded-lg overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
              >
                <div className="w-full aspect-[4/3] bg-[#0D1017] overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#9A9892]">
                      <span>{item.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-medium ${statusClass}`}>{statusText}</span>
                    </div>
                    <h3 className="font-ui text-base font-semibold text-[#F1ECE1] group-hover:text-[#C69B53] transition-colors leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                    <span className="text-[15px] font-semibold text-[#C69B53] tabular-nums">
                      {formatVnd(item.priceVnd)}
                    </span>
                    <span className="text-xs text-[#9A9892] group-hover:text-[#E6E3DC] transition-colors">
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: WEEKLY RANKING & PERSONALIZED RECOMMENDATIONS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8 border-t border-white/[0.08]">
          {/* Left: Weekly Top Ranking */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#C69B53]">
              <Flame className="w-4 h-4" aria-hidden="true" />
              <span>Bảng xếp hạng tuần</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#F1ECE1]">
              Chương được yêu thích nhất
            </h2>
            <ol className="divide-y divide-white/[0.08] border-t border-white/[0.08]">
              {weeklyTopChapters.map((chapter, idx) => (
                <li key={chapter.id} className="py-4 flex items-start gap-4">
                  <span className="font-display text-2xl font-semibold text-[#C69B53]/80 tabular-nums w-7 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpenChapter(chapter.id)}
                      className="text-left text-sm font-semibold text-[#F1ECE1] hover:text-[#C69B53] transition-colors cursor-pointer"
                    >
                      Chương {chapter.number}: {chapter.title}
                    </button>
                    <p className="text-xs text-[#8E8C86] tabular-nums mt-1">
                      {formatCount(chapter.views)} lượt xem · {formatCount(chapter.likes)} yêu thích
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: History-based Recommendations */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5E83B5]">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Gợi ý theo lịch sử đọc của bạn</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#F1ECE1]">
              Khám phá vũ trụ Thạch Uyên
            </h2>
            <div className="space-y-4">
              {recommendations.map((story) => (
                <div
                  key={story.id}
                  className="p-4 rounded-lg bg-[#13161F] border border-white/[0.08] flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <div className="w-full sm:w-28 aspect-[4/3] sm:aspect-[3/4] rounded-md overflow-hidden bg-[#0B0D12] shrink-0">
                    <SafeImage
                      src={story.coverImage}
                      alt={story.title}
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
                      <span className="text-[11px] text-[#5E83B5]">
                        {story.matchReason}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenChapter(story.linkedChapterId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#C69B53] hover:text-[#D8AE68] whitespace-nowrap cursor-pointer"
                      >
                        Đọc ngay
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {favorites.length > 0 && (
              <p className="text-xs text-[#8E8C86] flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#C69B53]" aria-hidden="true" />
                Bạn đang đánh dấu {favorites.length} chương yêu thích trong Thư viện.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
