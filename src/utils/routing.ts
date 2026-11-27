import {CHAPTERS} from '../data/chapters';
import type {ViewRoute} from '../types';

export interface ParsedRoute {
  route: ViewRoute;
  chapterId?: string;
  shouldReplaceCleanPath?: string;
}

export function buildRoutePath(route: ViewRoute, chapterId?: string): string {
  if (route === 'catalog') return '/muc-luc';
  if (route === 'merch') return '/cua-hang';
  if (route === 'library') return '/thu-vien';
  if (route === 'reader') {
    const chapter = chapterId
      ? CHAPTERS.find((c) => c.id === chapterId)
      : CHAPTERS[0];
    const chapterNumber = chapter ? chapter.number : CHAPTERS[0].number;
    return `/chuong/${chapterNumber}`;
  }
  return '/';
}

function resolveChapterFromSegment(segment: string): string | undefined {
  const cleaned = decodeURIComponent(segment).trim();
  if (!cleaned) return undefined;

  // Hỗ trợ dạng /chuong/1, /chuong/2 ...
  if (/^\d+$/.test(cleaned)) {
    const num = Number(cleaned);
    const byNumber = CHAPTERS.find((c) => c.number === num);
    if (byNumber) return byNumber.id;
  }

  // Tương thích ngược nếu đường dẫn dùng chapter id (ví dụ /chuong/arc-1-chuong-1)
  const byId = CHAPTERS.find((c) => c.id === cleaned);
  return byId?.id;
}

function parseNormalizedSegmentPath(rawPath: string): ParsedRoute {
  const trimmed = rawPath.replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return {route: 'home'};
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'muc-luc' || lower === 'catalog') {
    return {route: 'catalog'};
  }
  if (lower === 'cua-hang' || lower === 'merch') {
    return {route: 'merch'};
  }
  if (lower === 'thu-vien' || lower === 'library') {
    return {route: 'library'};
  }

  if (lower.startsWith('chuong/') || lower.startsWith('doc/')) {
    const slashIdx = trimmed.indexOf('/');
    const segment = trimmed.slice(slashIdx + 1);
    const chapterId = resolveChapterFromSegment(segment);
    if (chapterId) {
      return {route: 'reader', chapterId};
    }
  }

  return {route: 'home'};
}

/**
 * Phân tích URL History API sạch (/muc-luc, /thu-vien, /cua-hang, /chuong/1).
 * Nếu người dùng mở lại dấu trang cũ có /#/... thì tự động chuyển đổi sang đường dẫn sạch.
 */
export function parsePathnameRoute(
  pathname: string,
  hash = ''
): ParsedRoute {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  // Tương thích ngược link dấu trang cũ dạng /#/muc-luc hoặc /#/doc/arc-1-chuong-1
  if (normalizedPath === '/' && hash.startsWith('#/')) {
    const legacyParsed = parseNormalizedSegmentPath(hash.slice(2));
    return {
      ...legacyParsed,
      shouldReplaceCleanPath: buildRoutePath(
        legacyParsed.route,
        legacyParsed.chapterId
      ),
    };
  }

  return parseNormalizedSegmentPath(normalizedPath);
}
