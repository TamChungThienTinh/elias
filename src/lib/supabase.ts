import {createClient, type SupabaseClient} from '@supabase/supabase-js';

/**
 * Khởi tạo Supabase Client từ biến môi trường Vite.
 * - Chỉ sử dụng khóa công khai `VITE_SUPABASE_ANON_KEY` (an toàn cho GitHub Pages).
 * - Nếu chưa cấu hình biến môi trường, ứng dụng tự động chạy chế độ Mock Mode cục bộ
 *   để tác giả và độc giả vẫn có thể trải nghiệm đầy đủ giao diện.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
