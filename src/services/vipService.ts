import {isSupabaseConfigured, supabase} from '../lib/supabase';
import type {
  AuthUser,
  Chapter,
  ChapterContentAccessResult,
  VipRedeemResult,
} from '../types';
import {isChapterVipCurrentlyLocked} from '../utils/readerLogic';

/**
 * Danh sách mã VIP mẫu chỉ dùng khi chạy ở chế độ cục bộ (chưa gắn Supabase thật).
 * Khi đã cấu hình VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, mọi xác thực đều
 * gọi trực tiếp RPC `redeem_vip_code` trên PostgreSQL Supabase.
 */
export const MOCK_DEMO_VIP_CODES: Record<
  string,
  {durationDays: number | null; label: string}
> = {
  'VIP30-HUYETNGUYET': {durationDays: 30, label: 'Gói 1 tháng (30 ngày)'},
  'VIP90-THACHUYEN': {durationDays: 90, label: 'Gói 3 tháng (90 ngày)'},
  'VIPFULL-MACLAM': {durationDays: null, label: 'Gói Vĩnh viễn'},
};

export interface SupabaseProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_vip: boolean;
  vip_expires_at: string | null;
  read_history: string[] | null;
  favorites: string[] | null;
}

export function splitContentToParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Tải nội dung chương bảo mật thông qua RPC `get_chapter_content(chapter_id)`.
 * Ở Mock Mode (chưa cấu hình Supabase), áp dụng đúng quy tắc phân quyền 15-20% preview / 100% full.
 */
export async function fetchChapterAccessContent(
  chapter: Chapter,
  isVipActive: boolean
): Promise<ChapterContentAccessResult> {
  const previewCount = Math.max(
    1,
    chapter.previewParagraphCount ?? Math.max(1, Math.ceil(chapter.paragraphs.length * 0.2))
  );

  if (isSupabaseConfigured && supabase) {
    try {
      const {data, error} = await supabase.rpc('get_chapter_content', {
        chapter_id: chapter.id,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0] as {
          preview_content?: string | null;
          full_content?: string | null;
          has_access?: boolean;
          is_vip?: boolean;
          public_date?: string | null;
        };

        const hasFull = Boolean(row.has_access && row.full_content);
        const rawText = hasFull
          ? row.full_content || ''
          : row.preview_content || '';
        const paragraphs = splitContentToParagraphs(rawText);

        if (paragraphs.length > 0) {
          return {
            paragraphs,
            hasFullAccess: hasFull,
            isVipChapter: Boolean(row.is_vip),
            publicDate: row.public_date ?? chapter.publicDate,
            source: 'supabase',
          };
        }
      }
    } catch {
      // Nếu chương chưa được seed vào Supabase hoặc mạng chập chờn, giữ nguyên kiểm soát quyền phía local
    }
  }

  const locked = isChapterVipCurrentlyLocked(chapter, isVipActive);
  return {
    paragraphs: locked
      ? chapter.paragraphs.slice(0, previewCount)
      : chapter.paragraphs,
    hasFullAccess: !locked,
    isVipChapter: Boolean(chapter.isVipEarlyAccess),
    publicDate: chapter.publicDate,
    source: 'local',
  };
}

/**
 * Kích hoạt mã VIP dùng 1 lần qua RPC `redeem_vip_code(input_code)`.
 */
export async function redeemVipCodeService(params: {
  inputCode: string;
  authUser: AuthUser | null;
  currentIsVip: boolean;
  currentVipExpiresAt?: string | null;
  usedMockCodes: string[];
}): Promise<VipRedeemResult & {redeemedCode?: string}> {
  const cleanCode = params.inputCode.trim().toUpperCase();

  if (!params.authUser) {
    return {
      success: false,
      message: 'Vui lòng đăng nhập tài khoản trước khi nhập mã kích hoạt VIP.',
    };
  }

  if (cleanCode.length < 4) {
    return {
      success: false,
      message: 'Vui lòng nhập mã kích hoạt VIP hợp lệ (tối thiểu 4 ký tự).',
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const {data, error} = await supabase.rpc('redeem_vip_code', {
        input_code: cleanCode,
      });

      if (error) {
        return {
          success: false,
          message:
            error.message ||
            'Không thể xác thực mã VIP lúc này. Vui lòng thử lại sau.',
        };
      }

      const payload = (data || {}) as {
        success?: boolean;
        message?: string;
        is_vip?: boolean;
        vip_expires_at?: string | null;
        duration_days?: number | null;
      };

      return {
        success: Boolean(payload.success),
        message:
          payload.message ||
          (payload.success
            ? 'Kích hoạt Thành viên VIP thành công!'
            : 'Mã kích hoạt không hợp lệ.'),
        isVip: payload.is_vip,
        vipExpiresAt: payload.vip_expires_at ?? null,
        durationDays: payload.duration_days ?? null,
      };
    } catch {
      return {
        success: false,
        message: 'Lỗi kết nối máy chủ Supabase. Vui lòng kiểm tra mạng và thử lại.',
      };
    }
  }

  // Mock Mode (khi chưa cấu hình biến môi trường Supabase)
  const mockEntry = MOCK_DEMO_VIP_CODES[cleanCode];
  if (!mockEntry) {
    return {
      success: false,
      message:
        'Mã không tồn tại trong chế độ thử nghiệm. Hãy thử mã mẫu: VIP30-HUYETNGUYET, VIP90-THACHUYEN hoặc VIPFULL-MACLAM.',
    };
  }

  if (params.usedMockCodes.includes(cleanCode)) {
    return {
      success: false,
      message: 'Mã kích hoạt này đã được sử dụng trước đó (mỗi mã chỉ dùng 1 lần).',
    };
  }

  let nextExpiresAt: string | null = null;
  if (mockEntry.durationDays === null) {
    nextExpiresAt = null;
  } else if (params.currentIsVip && !params.currentVipExpiresAt) {
    nextExpiresAt = null;
  } else {
    const nowMs = Date.now();
    const existingMs = params.currentVipExpiresAt
      ? Date.parse(params.currentVipExpiresAt)
      : 0;
    const baseMs = Number.isNaN(existingMs) ? nowMs : Math.max(nowMs, existingMs);
    nextExpiresAt = new Date(
      baseMs + mockEntry.durationDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  return {
    success: true,
    message:
      nextExpiresAt === null
        ? 'Kích hoạt thành công Thành viên VIP Vĩnh viễn!'
        : `Kích hoạt thành công! Đã cộng thêm ${mockEntry.durationDays} ngày Thành viên VIP.`,
    isVip: true,
    vipExpiresAt: nextExpiresAt,
    durationDays: mockEntry.durationDays,
    redeemedCode: cleanCode,
  };
}

/**
 * Tải hồ sơ người dùng từ bảng `profiles` trên Supabase.
 */
export async function fetchSupabaseProfile(
  userId: string
): Promise<SupabaseProfileRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const {data, error} = await supabase
      .from('profiles')
      .select(
        'id, email, display_name, avatar_url, is_vip, vip_expires_at, read_history, favorites'
      )
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as SupabaseProfileRow;
  } catch {
    return null;
  }
}

/**
 * Đồng bộ lịch sử đọc, danh sách yêu thích và tên hiển thị lên bảng `profiles` (không chạm cột VIP).
 */
export async function syncLibraryToSupabase(params: {
  userId: string;
  displayName: string;
  readHistory: string[];
  favorites: string[];
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase
      .from('profiles')
      .update({
        display_name: params.displayName,
        read_history: params.readHistory,
        favorites: params.favorites,
      })
      .eq('id', params.userId);
  } catch {
    // Giữ bản lưu cục bộ nếu đang offline
  }
}
