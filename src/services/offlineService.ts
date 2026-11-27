import type {Chapter} from '../types';
import {canUseOfflineDownload, estimateChapterSizeKb} from '../utils/readerLogic';
import {fetchChapterAccessContent} from './vipService';

const OFFLINE_CACHE_KEY = 'huyet_nguyet_offline_content_v1';

export interface CachedOfflineChapter {
  chapterId: string;
  title: string;
  paragraphs: string[];
  savedAt: string;
  sizeKb: number;
}

type OfflineCacheMap = Record<string, CachedOfflineChapter>;

function readOfflineCacheMap(): OfflineCacheMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OfflineCacheMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeOfflineCacheMap(map: OfflineCacheMap): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(map);
    if (keys.length === 0) {
      window.localStorage.removeItem(OFFLINE_CACHE_KEY);
    } else {
      window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(map));
    }
  } catch {
    // Bỏ qua nếu bộ nhớ trình duyệt đầy hoặc chế độ riêng tư chặn ghi
  }
}

/**
 * Kiểm tra xem có dữ liệu nội dung chương ngoại tuyến nào đang tồn tại trong localStorage không.
 */
export function hasCachedOfflineContent(): boolean {
  return Object.keys(readOfflineCacheMap()).length > 0;
}

/**
 * Đọc nội dung một chương đã tải ngoại tuyến — chỉ trả về khi tài khoản vẫn còn VIP hiệu lực.
 */
export function getCachedOfflineChapter(
  chapterId: string,
  isVip: boolean,
  vipExpiresAt?: string | null
): CachedOfflineChapter | null {
  if (!canUseOfflineDownload(isVip, vipExpiresAt)) {
    return null;
  }
  const map = readOfflineCacheMap();
  return map[chapterId] ?? null;
}

/**
 * Xóa một chương khỏi bộ nhớ đệm ngoại tuyến.
 */
export function removeOfflineChapterFromCache(chapterId: string): void {
  const map = readOfflineCacheMap();
  if (chapterId in map) {
    delete map[chapterId];
    writeOfflineCacheMap(map);
  }
}

/**
 * Tự động dọn sạch toàn bộ nội dung chương đã lưu ngoại tuyến (khi đăng xuất hoặc VIP hết hạn).
 */
export function clearOfflineContentCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(OFFLINE_CACHE_KEY);
  } catch {
    // Bỏ qua
  }
}

/**
 * Tải nội dung đầy đủ của một chương lưu xuống bộ nhớ ngoại tuyến.
 * Bắt buộc kiểm tra `is_vip === true` và `vip_expires_at` chưa hết hạn trước khi gọi Supabase lấy `full_content`.
 */
export async function downloadChapterForOffline(params: {
  chapter: Chapter;
  isVip: boolean;
  vipExpiresAt?: string | null;
}): Promise<
  | {allowed: false; reason: 'vip-required'}
  | {allowed: true; record: CachedOfflineChapter}
> {
  if (!canUseOfflineDownload(params.isVip, params.vipExpiresAt)) {
    return {allowed: false, reason: 'vip-required'};
  }

  const accessResult = await fetchChapterAccessContent(params.chapter, true);
  if (!accessResult.hasFullAccess) {
    return {allowed: false, reason: 'vip-required'};
  }

  const paragraphs = accessResult.paragraphs;
  const sizeKb = estimateChapterSizeKb({
    ...params.chapter,
    paragraphs,
  });

  const record: CachedOfflineChapter = {
    chapterId: params.chapter.id,
    title: params.chapter.title,
    paragraphs,
    savedAt: new Date().toLocaleDateString('vi-VN'),
    sizeKb,
  };

  const map = readOfflineCacheMap();
  map[params.chapter.id] = record;
  writeOfflineCacheMap(map);

  return {allowed: true, record};
}
