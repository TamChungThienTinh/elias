import type {
  AppBackupPayload,
  Chapter,
  MerchCategory,
  MerchItem,
  MerchStatus,
  RecommendedStory,
} from '../types';

/**
 * Định dạng giá tiền Việt Nam Đồng (VNĐ) với dấu phân cách hàng nghìn chuẩn.
 */
export function formatVnd(amount: number): string {
  const safe = Math.max(0, Math.round(amount));
  return `${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}

/**
 * Định dạng số lượt xem / yêu thích gọn gàng (ví dụ: 14.820).
 */
export function formatCount(count: number): string {
  return Math.max(0, Math.round(count))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Ước tính thời gian đọc (phút) dựa trên tốc độ đọc tiếng Việt ~220 từ/phút.
 */
export function calculateReadingTimeMinutes(paragraphs: string[]): number {
  const totalWords = paragraphs.reduce((acc, p) => {
    const trimmed = p.trim();
    if (!trimmed) return acc;
    return acc + trimmed.split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.ceil(totalWords / 220));
}

/**
 * Chia danh sách đoạn văn thành các trang cân đối cho chế độ lật trang mượt mà.
 * Đảm bảo không bao giờ làm rơi đoạn văn nào và mỗi trang luôn có ít nhất 1 đoạn.
 */
export function paginateParagraphs(
  paragraphs: string[],
  maxCharsPerPage = 780
): string[][] {
  const clean = paragraphs.filter((p) => p.trim().length > 0);
  if (clean.length === 0) return [[]];

  const threshold = Math.max(240, maxCharsPerPage);
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentChars = 0;

  for (const para of clean) {
    if (currentPage.length > 0 && currentChars + para.length > threshold) {
      pages.push(currentPage);
      currentPage = [para];
      currentChars = para.length;
    } else {
      currentPage.push(para);
      currentChars += para.length;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * Mã hóa trạng thái sao lưu sang chuỗi Base64 hỗ trợ đầy đủ tiếng Việt UTF-8
 * để đồng bộ thủ công giữa điện thoại và máy tính trên trang web tĩnh.
 */
export function encodeSyncCode(payload: AppBackupPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return `HNCD1:${base64}`;
}

/**
 * Giải mã chuỗi đồng bộ hóa, trả về null nếu chuỗi không hợp lệ hoặc bị hỏng.
 */
export function decodeSyncCode(code: string): AppBackupPayload | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith('HNCD1:')) return null;
  const rawBase64 = trimmed.slice(6).trim();
  if (!rawBase64) return null;

  try {
    let bytes: Uint8Array;
    if (typeof atob === 'function') {
      const binary = atob(rawBase64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
    } else {
      bytes = new Uint8Array(Buffer.from(rawBase64, 'base64'));
    }

    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<AppBackupPayload>;

    if (
      !parsed ||
      typeof parsed.version !== 'number' ||
      !parsed.profile ||
      !parsed.settings ||
      !Array.isArray(parsed.favorites)
    ) {
      return null;
    }

    return {
      version: parsed.version,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      profile: parsed.profile,
      settings: parsed.settings,
      progress: parsed.progress ?? null,
      readHistory: Array.isArray(parsed.readHistory) ? parsed.readHistory : [],
      favorites: parsed.favorites,
      offlineChapters: Array.isArray(parsed.offlineChapters)
        ? parsed.offlineChapters
        : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return null;
  }
}

/**
 * Lọc danh sách merch theo danh mục, trạng thái kho và từ khóa tìm kiếm.
 */
export function filterMerchItems(
  items: MerchItem[],
  category: MerchCategory | 'all',
  status: MerchStatus | 'all',
  query = ''
): MerchItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (q) {
      const haystack = `${item.name} ${item.categoryLabel} ${item.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Sắp xếp chương theo thứ tự chương, lượt xem hoặc lượt yêu thích.
 */
export function sortChapters(
  chapters: Chapter[],
  sortBy: 'order' | 'views' | 'likes',
  favoriteIds: string[]
): Chapter[] {
  const favSet = new Set(favoriteIds);
  return [...chapters].sort((a, b) => {
    if (sortBy === 'views') {
      return b.views - a.views;
    }
    if (sortBy === 'likes') {
      const aLikes = a.likes + (favSet.has(a.id) ? 1 : 0);
      const bLikes = b.likes + (favSet.has(b.id) ? 1 : 0);
      return bLikes - aLikes;
    }
    return a.number - b.number;
  });
}

/**
 * Gợi ý truyện/ngoại truyện dựa trên lịch sử đọc và các chương yêu thích của người dùng.
 */
export function getPersonalizedRecommendations(
  series: RecommendedStory[],
  readHistory: string[],
  favorites: string[],
  chapters: Chapter[]
): Array<RecommendedStory & {matchReason: string}> {
  const tagWeights = new Map<string, number>();

  for (const id of readHistory) {
    const ch = chapters.find((c) => c.id === id);
    if (!ch) continue;
    for (const tag of ch.tags) {
      tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + 1);
    }
  }

  for (const id of favorites) {
    const ch = chapters.find((c) => c.id === id);
    if (!ch) continue;
    for (const tag of ch.tags) {
      tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + 2);
    }
  }

  return [...series]
    .map((item) => {
      let score = 0;
      const matchedTags: string[] = [];
      for (const tag of item.tags) {
        const w = tagWeights.get(tag) ?? 0;
        if (w > 0) {
          score += w;
          matchedTags.push(tag);
        }
      }
      const matchReason =
        matchedTags.length > 0
          ? `Phù hợp vì bạn quan tâm: ${matchedTags.slice(0, 2).join(', ')}`
          : 'Nổi bật tuần này trong vũ trụ Thạch Uyên';
      return {
        ...item,
        score,
        matchReason,
      };
    })
    .sort((a, b) => b.score - a.score || b.weeklyReads - a.weeklyReads)
    .map(({score: _score, ...rest}) => rest);
}

/**
 * Kiểm tra dữ liệu bình luận trước khi lưu (không bỏ qua validation).
 */
export function validateCommentInput(
  author: string,
  content: string
): {valid: boolean; error?: string} {
  const cleanAuthor = author.trim();
  const cleanContent = content.trim();
  if (cleanAuthor.length < 2) {
    return {valid: false, error: 'Vui lòng nhập tên hiển thị từ 2 ký tự trở lên.'};
  }
  if (cleanContent.length < 4) {
    return {valid: false, error: 'Nội dung bình luận cần tối thiểu 4 ký tự.'};
  }
  if (cleanContent.length > 600) {
    return {valid: false, error: 'Bình luận tối đa 600 ký tự.'};
  }
  return {valid: true};
}

/**
 * Kiểm tra form kích hoạt VIP.
 */
export function validateVipForm(
  fullName: string,
  contact: string
): {valid: boolean; error?: string} {
  const cleanName = fullName.trim();
  const cleanContact = contact.trim();
  if (cleanName.length < 2) {
    return {valid: false, error: 'Vui lòng nhập họ tên độc giả.'};
  }
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
  const phoneLike = /^(0|\+84)[0-9]{8,10}$/.test(cleanContact.replace(/\s+/g, ''));
  if (!emailLike && !phoneLike) {
    return {
      valid: false,
      error: 'Vui lòng nhập Email hoặc Số điện thoại Việt Nam hợp lệ.',
    };
  }
  return {valid: true};
}

/**
 * Ước tính dung lượng KB của chương khi lưu ngoại tuyến.
 */
export function estimateChapterSizeKb(chapter: Chapter): number {
  const textBytes = new TextEncoder().encode(
    `${chapter.title}${chapter.paragraphs.join('')}`
  ).length;
  return Math.max(4, Math.ceil((textBytes + 1200) / 1024));
}

export function getMerchStatusLabel(status: MerchStatus): string {
  switch (status) {
    case 'con-hang':
      return 'Còn hàng';
    case 'pre-order':
      return 'Pre-order';
    case 'het-hang':
      return 'Hết hàng';
  }
}
