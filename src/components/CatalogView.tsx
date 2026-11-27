import {useState} from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  Download,
  Lock,
  Search,
  X,
} from 'lucide-react';
import {ARCS, CHAPTERS} from '../data/chapters';
import type {OfflineChapterRecord, ReadingProgress} from '../types';
import {
  calculateReadingTimeMinutes,
  filterChaptersByQuery,
  formatCount,
  isChapterShowingVipLabel,
  isChapterVipCurrentlyLocked,
  sortChapters,
} from '../utils/readerLogic';

interface CatalogViewProps {
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  offlineChapters: OfflineChapterRecord[];
  isVip: boolean;
  onOpenChapter: (chapterId: string) => void;
  onToggleFavorite: (chapterId: string) => void;
  onToggleOffline: (chapterId: string) => void;
  onDownloadAllOffline: () => void;
}

type CatalogFilter = 'all' | 'favorites' | 'offline';
type CatalogSort = 'order' | 'views' | 'likes';

export function CatalogView({
  progress,
  readHistory,
  favorites,
  offlineChapters,
  isVip,
  onOpenChapter,
  onToggleFavorite,
  onToggleOffline,
  onDownloadAllOffline,
}: CatalogViewProps) {
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [sortBy, setSortBy] = useState<CatalogSort>('order');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedArcs, setCollapsedArcs] = useState<Record<string, boolean>>({});

  const offlineIds = new Set(offlineChapters.map((r) => r.chapterId));
  const readSet = new Set(readHistory);

  const searchedChapters = filterChaptersByQuery(CHAPTERS, searchQuery);
  const filteredChapters = sortChapters(
    searchedChapters.filter((ch) => {
      if (filter === 'favorites') return favorites.includes(ch.id);
      if (filter === 'offline') return offlineIds.has(ch.id);
      return true;
    }),
    sortBy,
    favorites
  );

  const toggleArcCollapse = (arcId: string) => {
    setCollapsedArcs((prev) => ({...prev, [arcId]: !prev[arcId]}));
  };

  const allArcsCollapsed = ARCS.every((arc) => Boolean(collapsedArcs[arc.id]));
  const handleToggleAllArcs = () => {
    const nextCollapsed = !allArcsCollapsed;
    const nextState: Record<string, boolean> = {};
    for (const arc of ARCS) {
      nextState[arc.id] = nextCollapsed;
    }
    setCollapsedArcs(nextState);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-9">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <p className="text-xs font-medium text-[#C69B53]">Mục lục tiểu thuyết</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F5F1E8] mt-1">
            Danh sách chương theo từng Arc
          </h1>
          <p className="text-sm text-[#9A9892] mt-2">
            Tìm nhanh chương theo tên hoặc số chương, thu gọn từng Arc, đánh dấu yêu thích hoặc tải ngoại tuyến.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadAllOffline}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-white/[0.12] bg-[#13161F] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
          Tải tất cả ngoại tuyến
        </button>
      </div>

      {/* Search + Filter + Sort toolbar */}
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#8E8C86] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="catalog-search" className="sr-only">
            Tìm kiếm theo tên hoặc số chương
          </label>
          <input
            id="catalog-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc số chương (ví dụ: Chương 2, Tháp Nhật Thực...)"
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#13161F] border border-white/[0.1] text-sm text-[#F1ECE1] placeholder:text-[#7D7B75] focus:outline-none focus:border-[#C69B53]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8C86] hover:text-[#F1ECE1] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Lọc danh sách chương"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#13161F] border border-white/[0.08] self-start"
          >
            {(
              [
                {id: 'all', label: `Tất cả (${CHAPTERS.length})`},
                {id: 'favorites', label: `Yêu thích (${favorites.length})`},
                {id: 'offline', label: `Ngoại tuyến (${offlineChapters.length})`},
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#C69B53] text-[#0B0D12]'
                    : 'text-[#9A9892] hover:text-[#E6E3DC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#9A9892]">
            <span className="tabular-nums">
              Đã đọc {readSet.size}/{CHAPTERS.length} chương
            </span>
            {ARCS.length > 1 && (
              <button
                type="button"
                onClick={handleToggleAllArcs}
                className="px-2.5 py-1.5 rounded-md border border-white/[0.1] bg-[#13161F] hover:border-[#C69B53] text-[#E6E3DC] hover:text-[#C69B53] transition-colors whitespace-nowrap cursor-pointer"
              >
                {allArcsCollapsed ? 'Mở tất cả Arc' : 'Thu gọn tất cả'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="catalog-sort" className="whitespace-nowrap">
                Sắp xếp:
              </label>
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CatalogSort)}
                className="px-3 py-1.5 rounded-md bg-[#13161F] border border-white/[0.1] text-[#E6E3DC] text-xs focus:outline-none focus:border-[#C69B53]"
              >
                <option value="order">Thứ tự chương</option>
                <option value="views">Lượt xem cao nhất</option>
                <option value="likes">Yêu thích nhất</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Arc-grouped Accordion chapter list */}
      {filteredChapters.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-white/[0.08] bg-[#13161F] space-y-3">
          <p className="text-sm text-[#C9C5BC]">
            {searchQuery
              ? `Không tìm thấy chương nào khớp với "${searchQuery}".`
              : filter === 'favorites'
              ? 'Bạn chưa đánh dấu chương yêu thích nào.'
              : 'Bạn chưa lưu chương nào để đọc ngoại tuyến.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] cursor-pointer"
          >
            Xem tất cả chương
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {ARCS.map((arc) => {
            const arcChapters = filteredChapters.filter(
              (ch) => ch.arcId === arc.id
            );
            if (arcChapters.length === 0) return null;
            const isCollapsed =
              searchQuery.trim().length > 0 ? false : Boolean(collapsedArcs[arc.id]);
            const readInArc = arcChapters.filter((c) => readSet.has(c.id)).length;

            return (
              <section
                key={arc.id}
                aria-labelledby={`arc-heading-${arc.id}`}
                className="rounded-lg border border-white/[0.08] bg-[#10131B]/60 overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-controls={`arc-panel-${arc.id}`}
                  onClick={() => toggleArcCollapse(arc.id)}
                  className="w-full px-5 py-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C69B53]"
                >
                  <div className="flex items-start gap-3">
                    {isCollapsed ? (
                      <ChevronRight
                        className="w-5 h-5 text-[#C69B53] mt-1 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className="w-5 h-5 text-[#C69B53] mt-1 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <h2
                        id={`arc-heading-${arc.id}`}
                        className="font-display text-xl sm:text-2xl font-semibold text-[#F1ECE1]"
                      >
                        {arc.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#9A9892] mt-1">
                        {arc.summary}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#C69B53] font-medium whitespace-nowrap tabular-nums pl-8 sm:pl-0">
                    {arcChapters.length} chương · Đã đọc {readInArc}/{arcChapters.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div
                    id={`arc-panel-${arc.id}`}
                    className="px-5 border-t border-white/[0.08] divide-y divide-white/[0.07]"
                  >
                    {arcChapters.map((chapter) => {
                      const isFav = favorites.includes(chapter.id);
                      const isOffline = offlineIds.has(chapter.id);
                      const isCurrent = progress?.chapterId === chapter.id;
                      const isRead = readSet.has(chapter.id);
                      const showVipLabel = isChapterShowingVipLabel(chapter);
                      const isLockedVip = isChapterVipCurrentlyLocked(chapter, isVip);
                      const minutes = calculateReadingTimeMinutes(chapter.paragraphs);

                      return (
                        <div
                          key={chapter.id}
                          className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#8E8C86]">
                              <span className="tabular-nums">
                                Chương {chapter.number}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{chapter.publishedAt}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{minutes} phút đọc</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {formatCount(chapter.views)} lượt xem
                              </span>
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
                                  <span className="inline-flex items-center gap-1 text-[#7EC49A] font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    Đã đọc
                                  </span>
                                </>
                              )}
                              {isCurrent && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#5E83B5] font-medium tabular-nums">
                                    Đang đọc ({Math.round(progress.scrollPercent)}%)
                                  </span>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onOpenChapter(chapter.id)}
                              className={`text-left font-display text-lg sm:text-xl font-medium hover:text-[#C69B53] transition-colors cursor-pointer ${
                                isRead && !isCurrent ? 'text-[#B5B2AA]' : 'text-[#F1ECE1]'
                              }`}
                            >
                              {chapter.title}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(chapter.id)}
                              aria-label={
                                isFav
                                  ? `Bỏ yêu thích Chương ${chapter.number}`
                                  : `Đánh dấu yêu thích Chương ${chapter.number}`
                              }
                              aria-pressed={isFav}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-md border transition-colors cursor-pointer ${
                                isFav
                                  ? 'border-[#C69B53] bg-[#C69B53]/15 text-[#C69B53]'
                                  : 'border-white/[0.1] text-[#9A9892] hover:text-[#E6E3DC] hover:border-white/[0.25]'
                              }`}
                            >
                              <Bookmark
                                className="w-4 h-4"
                                fill={isFav ? 'currentColor' : 'none'}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleOffline(chapter.id)}
                              aria-label={
                                isOffline
                                  ? `Xóa bản ngoại tuyến Chương ${chapter.number}`
                                  : `Tải ngoại tuyến Chương ${chapter.number}`
                              }
                              aria-pressed={isOffline}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-md border transition-colors cursor-pointer ${
                                isOffline
                                  ? 'border-[#7EC49A]/60 bg-[#7EC49A]/10 text-[#7EC49A]'
                                  : 'border-white/[0.1] text-[#9A9892] hover:text-[#E6E3DC] hover:border-white/[0.25]'
                              }`}
                            >
                              {isOffline ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>

                            {isLockedVip ? (
                              <button
                                type="button"
                                onClick={() => onOpenChapter(chapter.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-[#C69B53]/55 bg-[#C69B53]/10 hover:bg-[#C69B53] hover:text-[#0B0D12] text-[#D8AE68] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                Mở khóa VIP
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenChapter(chapter.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#1A1F2B] hover:bg-[#C69B53] hover:text-[#0B0D12] text-[#F1ECE1] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                                Đọc chương
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
