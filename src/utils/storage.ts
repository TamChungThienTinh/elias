import {INITIAL_COMMENTS} from '../data/chapters';
import {clearOfflineContentCache} from '../services/offlineService';
import type {
  AppBackupPayload,
  AuthUser,
  CartItem,
  ChapterComment,
  OfflineChapterRecord,
  ReaderProfile,
  ReaderSettings,
  ReadingProgress,
} from '../types';
import {isUserVipActive} from './readerLogic';

const STORAGE_KEY = 'huyet_nguyet_co_do_state_v1';

export interface PersistedState {
  authUser: AuthUser | null;
  usedMockVipCodes: string[];
  profile: ReaderProfile;
  settings: ReaderSettings;
  progress: ReadingProgress | null;
  readHistory: string[];
  favorites: string[];
  offlineChapters: OfflineChapterRecord[];
  comments: ChapterComment[];
  likedCommentIds: string[];
  cart: CartItem[];
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  fontSize: 18,
  lineHeight: 1.85,
  fontFamily: 'lora',
  readingMode: 'scroll',
};

export const DEFAULT_PROFILE: ReaderProfile = {
  displayName: 'Độc giả Thạch Uyên',
  email: '',
  isVip: false,
  vipExpiresAt: null,
  notificationsEnabled: false,
  autoBackupEnabled: true,
};

export const DEFAULT_STATE: PersistedState = {
  authUser: null,
  usedMockVipCodes: [],
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  progress: null,
  readHistory: [],
  favorites: [],
  offlineChapters: [],
  comments: INITIAL_COMMENTS,
  likedCommentIds: [],
  cart: [],
};

export function loadPersistedState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const mergedProfile: ReaderProfile = {
      ...DEFAULT_PROFILE,
      ...(parsed.profile ?? {}),
    };
    const vipValid = isUserVipActive(
      mergedProfile.isVip,
      mergedProfile.vipExpiresAt
    );

    if (!vipValid) {
      clearOfflineContentCache();
    }

    return {
      authUser: parsed.authUser ?? null,
      usedMockVipCodes: Array.isArray(parsed.usedMockVipCodes)
        ? parsed.usedMockVipCodes
        : [],
      profile: mergedProfile,
      settings: {...DEFAULT_SETTINGS, ...(parsed.settings ?? {})},
      progress: parsed.progress ?? null,
      readHistory: Array.isArray(parsed.readHistory) ? parsed.readHistory : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      offlineChapters:
        vipValid && Array.isArray(parsed.offlineChapters)
          ? parsed.offlineChapters
          : [],
      comments: Array.isArray(parsed.comments)
        ? parsed.comments
        : INITIAL_COMMENTS,
      likedCommentIds: Array.isArray(parsed.likedCommentIds)
        ? parsed.likedCommentIds
        : [],
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage ở chế độ riêng tư
  }
}

export function createBackupPayload(state: PersistedState): AppBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    settings: state.settings,
    progress: state.progress,
    readHistory: state.readHistory,
    favorites: state.favorites,
    offlineChapters: state.offlineChapters,
    comments: state.comments,
  };
}
