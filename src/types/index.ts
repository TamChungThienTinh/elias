export type ViewRoute = 'home' | 'catalog' | 'reader' | 'merch' | 'library';

export type ReaderTheme = 'dark' | 'light' | 'sepia';

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
  linkedChapterId: string;
  coverImage: string;
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
  status: MerchStatus;
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
  isVip: boolean;
  vipPlan?: string;
  vipActivatedAt?: string;
  notificationsEnabled: boolean;
  autoBackupEnabled: boolean;
  lastBackupAt?: string;
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
