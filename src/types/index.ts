export type ViewRoute = 'home' | 'catalog' | 'reader' | 'merch' | 'library';

export type ReaderTheme = 'dark' | 'soft-dark' | 'light' | 'sepia';

export type ReaderFontFamily = 'lora' | 'sans' | 'playfair' | 'system';

export type ReadingMode = 'scroll' | 'paged';

export type MerchStatus = 'con-hang' | 'pre-order' | 'het-hang';

export type MerchCategory = 'standee' | 'moc-khoa' | 'tranh-in' | 'phu-kien';

export interface NovelInfo {
  title: string;
  subtitle: string;
  author: string;
  genres: string[];
  statusText: string;
  updateSchedule: string;
  coverImage: string;
  bannerImage: string;
  synopsis: string[];
  tagline: string;
}

export interface Arc {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
}

export interface Chapter {
  id: string;
  arcId: string;
  number: number;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  tags: string[];
  isVipEarlyAccess?: boolean;
  vipUnlockDate?: string;
  /** Thời điểm ISO tự động mở miễn phí (đồng bộ cột public_date trong Supabase) */
  publicDate?: string;
  /** Số đoạn văn đọc thử công khai (15-20% đầu chương) */
  previewParagraphCount?: number;
  authorNote?: string;
  illustration?: string;
  illustrationCaption?: string;
  paragraphs: string[];
}

export interface RecommendedStory {
  id: string;
  title: string;
  arcHint: string;
  genre: string;
  tags: string[];
  weeklyReads: number;
  favorites: number;
  blurb: string;
  defaultReason: string;
  linkedChapterId: string;
  coverImage: string;
}

export interface AuthorAnnouncement {
  title: string;
  updatedAt: string;
  nextReleaseLabel: string;
  nextReleaseTitle: string;
  progressNote: string;
  message: string;
}

export interface CartItem {
  merchId: string;
  quantity: number;
}

export interface MerchOrderLinks {
  shopee?: string;
  zalo?: string;
  googleForm?: string;
}

export interface MerchItem {
  id: string;
  name: string;
  category: MerchCategory;
  categoryLabel: string;
  priceVnd: number;
  priceDisplay?: string;
  status: MerchStatus;
  stockStatusLabel?: string;
  featured?: boolean;
  image: string;
  dimensions: string;
  material: string;
  releaseNote: string;
  description: string;
  orderLinks: MerchOrderLinks;
}

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number;
  lineHeight: number;
  fontFamily: ReaderFontFamily;
  readingMode: ReadingMode;
}

export interface ReadingProgress {
  chapterId: string;
  scrollPercent: number;
  pageIndex: number;
  updatedAt: string;
}

export interface ChapterComment {
  id: string;
  chapterId: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
  isVipBadge?: boolean;
}

export interface ReaderProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
  isVip: boolean;
  vipPlan?: string;
  vipActivatedAt?: string;
  /** Thời điểm ISO hết hạn VIP; null/undefined khi isVip=true nghĩa là VIP Vĩnh viễn */
  vipExpiresAt?: string | null;
  notificationsEnabled: boolean;
  autoBackupEnabled: boolean;
  lastBackupAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'mock';
}

export interface ChapterContentAccessResult {
  paragraphs: string[];
  hasFullAccess: boolean;
  isVipChapter: boolean;
  publicDate?: string;
  source: 'supabase' | 'local';
}

export interface VipRedeemResult {
  success: boolean;
  message: string;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  durationDays?: number | null;
}

export interface OfflineChapterRecord {
  chapterId: string;
  savedAt: string;
  sizeKb: number;
}

export interface AppBackupPayload {
  version: number;
  exportedAt: string;
  profile: ReaderProfile;
  settings: ReaderSettings;
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  offlineChapters: OfflineChapterRecord[];
  comments: ChapterComment[];
}
