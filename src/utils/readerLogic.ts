import type {
  AppBackupPayload,
  CartItem,
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
 * Tốc độ đọc trung bình tiếng Việt (~220 từ/phút cho tiểu thuyết).
 */
export const AVERAGE_READING_WORDS_PER_MINUTE = 220;

/**
 * Đếm chính xác số từ trong các đoạn văn (loại bỏ ký tự dấu câu đứng riêng lẻ như "—").
 */
export function countParagraphWords(paragraphs: string[]): number {
  return paragraphs.reduce((acc, p) => {
    const trimmed = p.trim();
    if (!trimmed) return acc;
    const tokens = trimmed
      .split(/\s+/)
      .filter((token) => /[\p{L}\p{N}]/u.test(token));
    return acc + tokens.length;
  }, 0);
}

/**
 * Ước tính thời gian đọc (phút) dựa trên tốc độ đọc tiếng Việt ~220 từ/phút.
 */
export function calculateReadingTimeMinutes(
  paragraphs: string[],
  wordsPerMinute = AVERAGE_READING_WORDS_PER_MINUTE
): number {
  const totalWords = countParagraphWords(paragraphs);
  const safeWpm = Math.max(60, wordsPerMinute);
  return Math.max(1, Math.ceil(totalWords / safeWpm));
}

/**
 * Trả về số từ thực tế của nội dung chương, thời gian đọc (phút) và nhãn định dạng "X phút đọc".
 */
export function getChapterReadingStats(
  paragraphs: string[],
  wordsPerMinute = AVERAGE_READING_WORDS_PER_MINUTE
): {wordCount: number; minutes: number; label: string} {
  const wordCount = countParagraphWords(paragraphs);
  const minutes = calculateReadingTimeMinutes(paragraphs, wordsPerMinute);
  return {
    wordCount,
    minutes,
    label: `${minutes} phút đọc`,
  };
}

/**
 * Tạo bảng tra cứu số từ thực tế và thời gian đọc cho danh sách chương (tối ưu memo hóa ở Mục lục).
 */
export function buildChapterReadingStatsMap(
  chapters: Array<Pick<Chapter, 'id' | 'paragraphs'>>,
  wordsPerMinute = AVERAGE_READING_WORDS_PER_MINUTE
): Record<string, {wordCount: number; minutes: number; label: string}> {
  const map: Record<string, {wordCount: number; minutes: number; label: string}> = {};
  for (const ch of chapters) {
    map[ch.id] = getChapterReadingStats(ch.paragraphs, wordsPerMinute);
  }
  return map;
}

/**
 * Tính tổng thời gian đọc (phút) dựa trên tổng số từ thực tế của danh sách chương.
 */
export function calculateTotalReadingMinutes(
  chapters: Array<Pick<Chapter, 'paragraphs'>>,
  wordsPerMinute = AVERAGE_READING_WORDS_PER_MINUTE
): number {
  return chapters.reduce(
    (sum, ch) => sum + calculateReadingTimeMinutes(ch.paragraphs, wordsPerMinute),
    0
  );
}

/**
 * Tính số phút đọc còn lại dựa trên số từ thực tế của chương và phần trăm vị trí cuộn hiện tại.
 */
export function calculateRemainingReadingTime(
  wordCount: number,
  progressPercent: number,
  wordsPerMinute = AVERAGE_READING_WORDS_PER_MINUTE
): {remainingMinutes: number; label: string} {
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));
  if (clampedProgress >= 98) {
    return {remainingMinutes: 0, label: 'Đã đọc xong'};
  }
  const safeWords = Math.max(0, wordCount);
  const safeWpm = Math.max(60, wordsPerMinute);
  const remainingWords = safeWords * ((100 - clampedProgress) / 100);
  const remainingMinutes = Math.max(1, Math.ceil(remainingWords / safeWpm));
  return {
    remainingMinutes,
    label: `Còn ${remainingMinutes} phút đọc`,
  };
}

/**
 * Tính phần trăm đã đọc (0–100) cho chế độ cuộn dọc (dựa theo vị trí trong phần nội dung chương)
 * hoặc chế độ lật trang.
 */
export function calculateReadingProgressPercent(params: {
  mode: 'scroll' | 'paged';
  scrollOffset: number;
  scrollableDistance: number;
  pageIndex: number;
  totalPages: number;
}): number {
  if (params.mode === 'paged') {
    const safeTotal = Math.max(1, params.totalPages);
    const clampedPage = Math.min(safeTotal - 1, Math.max(0, params.pageIndex));
    return Math.round(((clampedPage + 1) / safeTotal) * 100);
  }

  if (params.scrollableDistance <= 0) {
    return params.scrollOffset > 0 ? 100 : 0;
  }

  const ratio = params.scrollOffset / params.scrollableDistance;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
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
          ? `${item.defaultReason} · Khớp gu: ${matchedTags.slice(0, 2).join(', ')}`
          : item.defaultReason;
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
 * Chuẩn hóa chuỗi tiếng Việt bỏ dấu để tìm kiếm chương linh hoạt.
 */
function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Tìm kiếm chương theo tên chương, số chương hoặc từ khóa (hỗ trợ cả có dấu và không dấu).
 */
export function filterChaptersByQuery(chapters: Chapter[], query: string): Chapter[] {
  const clean = normalizeVietnamese(query);
  if (!clean) return chapters;

  return chapters.filter((ch) => {
    const haystack = normalizeVietnamese(
      `chuong ${ch.number} ${ch.number} ${ch.title} ${ch.tags.join(' ')}`
    );
    return haystack.includes(clean);
  });
}

/**
 * Tính tổng số lượng sản phẩm và tổng giá trị VNĐ của giỏ hàng merch.
 */
export function calculateCartTotals(
  cart: CartItem[],
  merchItems: MerchItem[]
): {totalQuantity: number; totalPriceVnd: number} {
  let totalQuantity = 0;
  let totalPriceVnd = 0;

  for (const entry of cart) {
    if (entry.quantity <= 0) continue;
    const product = merchItems.find((m) => m.id === entry.merchId);
    if (!product || product.status === 'het-hang') continue;
    totalQuantity += entry.quantity;
    totalPriceVnd += product.priceVnd * entry.quantity;
  }

  return {totalQuantity, totalPriceVnd};
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

/**
 * Kiểm tra xem trạng thái VIP của tài khoản có đang còn hiệu lực hay không.
 * - isVip = false -> false
 * - isVip = true và vipExpiresAt == null -> true (VIP Vĩnh viễn)
 * - isVip = true và vipExpiresAt > now -> true
 */
export function isUserVipActive(
  isVip: boolean,
  vipExpiresAt?: string | null,
  now: Date = new Date()
): boolean {
  if (!isVip) return false;
  if (!vipExpiresAt) return true;
  const expiryTime = Date.parse(vipExpiresAt);
  if (Number.isNaN(expiryTime)) return true;
  return expiryTime > now.getTime();
}

/**
 * Kiểm tra chương có còn trong giai đoạn VIP đọc trước hay đã đến thời điểm mở miễn phí (public_date).
 */
export function isChapterShowingVipLabel(
  chapter: Pick<Chapter, 'isVipEarlyAccess' | 'publicDate'>,
  now: Date = new Date()
): boolean {
  if (!chapter.isVipEarlyAccess) return false;
  if (!chapter.publicDate) return true;
  const publicTime = Date.parse(chapter.publicDate);
  if (Number.isNaN(publicTime)) return true;
  return now.getTime() < publicTime;
}

/**
 * Kiểm tra chương có đang bị khóa đối với độc giả hiện tại hay không.
 * Tự động mở khóa nếu: chương không phải VIP, HOẶC now >= public_date, HOẶC user có VIP còn hạn.
 */
export function isChapterVipCurrentlyLocked(
  chapter: Pick<Chapter, 'isVipEarlyAccess' | 'publicDate'>,
  isVipActive: boolean,
  now: Date = new Date()
): boolean {
  if (!isChapterShowingVipLabel(chapter, now)) return false;
  return !isVipActive;
}

/**
 * Định dạng ngày chuẩn Việt Nam DD/MM/YYYY từ chuỗi ISO timestamp.
 */
export function formatViDate(isoDate?: string | null): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Tạo dòng thông báo đếm ngược ngày tự động mở miễn phí từ `public_date`.
 */
export function getPublicUnlockCountdownText(
  publicDate?: string,
  fallbackDateLabel?: string,
  now: Date = new Date()
): string {
  if (!publicDate) {
    return fallbackDateLabel
      ? `Tự động mở miễn phí vào ngày ${fallbackDateLabel}`
      : 'Chương đọc trước dành riêng cho Thành viên VIP';
  }
  const targetMs = Date.parse(publicDate);
  if (Number.isNaN(targetMs)) {
    return fallbackDateLabel
      ? `Tự động mở miễn phí vào ngày ${fallbackDateLabel}`
      : 'Chương đọc trước dành riêng cho Thành viên VIP';
  }

  const diffMs = targetMs - now.getTime();
  const formattedDate = formatViDate(publicDate) || fallbackDateLabel || '';
  if (diffMs <= 0) {
    return `Đã mở miễn phí công khai từ ${formattedDate}`;
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    return `Tự động mở miễn phí sau ${Math.max(1, totalHours)} giờ nữa - ${formattedDate}`;
  }
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Tự động mở miễn phí sau ${days} ngày nữa - ${formattedDate}`;
}

/**
 * Định dạng mô tả hạng thành viên & ngày hết hạn cho tab Thành viên VIP.
 */
export function formatVipMembershipSummary(
  isVip: boolean,
  vipExpiresAt?: string | null,
  now: Date = new Date()
): {tierLabel: string; expiryLabel: string; active: boolean} {
  const active = isUserVipActive(isVip, vipExpiresAt, now);
  if (!active) {
    if (isVip && vipExpiresAt) {
      return {
        tierLabel: 'Độc giả tiêu chuẩn',
        expiryLabel: `Gói VIP đã hết hạn ngày ${formatViDate(vipExpiresAt)}`,
        active: false,
      };
    }
    return {
      tierLabel: 'Độc giả tiêu chuẩn',
      expiryLabel: 'Chưa kích hoạt quyền lợi đọc trước VIP',
      active: false,
    };
  }

  if (!vipExpiresAt) {
    return {
      tierLabel: 'Thành viên VIP',
      expiryLabel: 'Hiệu lực: Vĩnh viễn (Ủng hộ tác giả)',
      active: true,
    };
  }

  return {
    tierLabel: 'Thành viên VIP',
    expiryLabel: `Hết hạn ngày ${formatViDate(vipExpiresAt)}`,
    active: true,
  };
}

/**
 * Tạo nội dung chuyển khoản VietQR tự động theo cú pháp:
 * `VIP [ten-goi] [email hoặc username]` (nếu chưa đăng nhập: `VIP [ten-goi]`).
 */
export function buildVipTransferNote(
  packageCode: string,
  userIdentifier?: string | null
): string {
  const cleanPkg = packageCode.trim().toUpperCase();
  const cleanUser = (userIdentifier || '')
    .trim()
    .replace(/\s+/g, '');
  if (!cleanUser) {
    return `VIP ${cleanPkg}`;
  }
  return `VIP ${cleanPkg} ${cleanUser}`;
}

/**
 * Tạo đường dẫn ảnh QR động theo chuẩn VietQR Quick Link.
 */
export function buildVietQrUrl(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferNote: string;
}): string {
  const safeBank = encodeURIComponent(params.bankCode.trim());
  const safeAcc = encodeURIComponent(params.accountNumber.trim());
  const safeAmount = Math.max(0, Math.round(params.amount));
  const addInfo = encodeURIComponent(params.transferNote.trim());
  const accountName = encodeURIComponent(params.accountName.trim());
  return `https://img.vietqr.io/image/${safeBank}-${safeAcc}-qr_only.png?amount=${safeAmount}&addInfo=${addInfo}&accountName=${accountName}`;
}

/**
 * Kiểm tra quyền sử dụng tính năng tải đọc ngoại tuyến ở tầng dữ liệu:
 * Bắt buộc `isVip === true` và `vipExpiresAt` chưa hết hạn (hoặc null với VIP vĩnh viễn).
 */
export function canUseOfflineDownload(
  isVip: boolean,
  vipExpiresAt?: string | null,
  now: Date = new Date()
): boolean {
  return isUserVipActive(isVip, vipExpiresAt, now);
}

/**
 * Xác định khi nào cần tự động dọn bộ nhớ ngoại tuyến (khi không còn quyền VIP mà vẫn còn dữ liệu lưu).
 */
export function shouldPurgeOfflineStorage(
  isVip: boolean,
  vipExpiresAt: string | null | undefined,
  offlineRecordCount: number,
  now: Date = new Date()
): boolean {
  if (offlineRecordCount <= 0) return false;
  return !isUserVipActive(isVip, vipExpiresAt, now);
}


