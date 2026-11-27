-- ============================================================================
-- HUYẾT NGUYỆT CỐ ĐÔ — SUPABASE BACKEND SCHEMA (VIP ĐỌC TRƯỚC BẢO MẬT)
-- ============================================================================
-- Hướng dẫn sử dụng:
-- 1. Mở Supabase Dashboard -> SQL Editor -> New Query.
-- 2. Dán toàn bộ nội dung file này và bấm "Run".
-- 3. Bật Email/Password và Google OAuth tại Authentication -> Providers.
-- 4. Cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong GitHub Secrets
--    (hoặc file .env cục bộ khi chạy dev).
-- ============================================================================

-- Bật extension sinh UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. BẢNG PROFILES (Liên kết 1-1 với auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'Độc giả Thạch Uyên',
  avatar_url TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  -- NULL khi is_vip = true nghĩa là VIP Vĩnh viễn
  vip_expires_at TIMESTAMPTZ,
  read_history TEXT[] NOT NULL DEFAULT '{}',
  favorites TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Hồ sơ độc giả, trạng thái Thành viên VIP và dữ liệu thư viện đồng bộ.';
COMMENT ON COLUMN public.profiles.vip_expires_at IS 'Thời điểm hết hạn VIP. Để NULL nếu là VIP vĩnh viễn.';

-- Tự động tạo profile khi người dùng mới đăng ký (Email hoặc Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
      SPLIT_PART(COALESCE(NEW.email, 'Độc giả'), '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ngăn client tự chỉnh sửa trực tiếp cột is_vip / vip_expires_at qua PostgREST
CREATE OR REPLACE FUNCTION public.protect_profile_vip_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.is_vip IS DISTINCT FROM OLD.is_vip
       OR NEW.vip_expires_at IS DISTINCT FROM OLD.vip_expires_at THEN
      RAISE EXCEPTION 'Không được phép tự chỉnh sửa quyền VIP từ phía client.';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_vip_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_vip_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_vip_fields();

-- ----------------------------------------------------------------------------
-- 2. BẢNG CHAPTERS (Tách riêng preview_content công khai & full_content bảo mật)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  arc_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  published_at TEXT,
  -- 15-20% đầu chương, luôn công khai để hiển thị bản đọc thử
  preview_content TEXT NOT NULL,
  -- 100% nội dung chương, được khóa ở mức cột & chỉ trả qua RPC get_chapter_content
  full_content TEXT NOT NULL,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  -- Ngày giờ tự động mở miễn phí công khai (nếu NOW() >= public_date thì mở toàn bộ)
  public_date TIMESTAMPTZ,
  author_note TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chapters IS 'Nội dung chương truyện với full_content được bảo vệ bằng RLS và RPC.';

-- ----------------------------------------------------------------------------
-- 3. BẢNG VIP_CODES (Mã kích hoạt dùng 1 lần)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vip_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  -- Số ngày VIP (ví dụ: 30, 90). Để NULL nếu là mã VIP Vĩnh viễn.
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_codes_code_upper ON public.vip_codes (UPPER(code));
COMMENT ON TABLE public.vip_codes IS 'Kho mã kích hoạt VIP dùng 1 lần. Không mở quyền SELECT cho client.';

-- ----------------------------------------------------------------------------
-- 4. THIẾT LẬP ROW LEVEL SECURITY (RLS) & PHÂN QUYỀN CỘT CHỐNG XEM LÉN F12
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_codes ENABLE ROW LEVEL SECURITY;

-- Policy cho PROFILES: mỗi user chỉ đọc và cập nhật hồ sơ của chính mình
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy cho CHAPTERS:
-- Thu hồi quyền SELECT trực tiếp cột full_content từ anon và authenticated
-- để người dùng KHÔNG THỂ dùng F12 hoặc REST API truy vấn lén full_content.
REVOKE ALL ON TABLE public.chapters FROM anon, authenticated;
GRANT SELECT (
  id,
  arc_id,
  chapter_number,
  title,
  published_at,
  preview_content,
  is_vip,
  public_date,
  author_note,
  views,
  likes,
  tags,
  created_at,
  updated_at
) ON TABLE public.chapters TO anon, authenticated;

DROP POLICY IF EXISTS "chapters_public_metadata_select" ON public.chapters;
CREATE POLICY "chapters_public_metadata_select"
  ON public.chapters
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Policy cho VIP_CODES: khóa hoàn toàn truy cập trực tiếp từ anon và authenticated
REVOKE ALL ON TABLE public.vip_codes FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. RPC: get_chapter_content(chapter_id)
--    Luôn trả preview_content. Chỉ trả full_content khi:
--      - Chương không phải VIP (is_vip = false), HOẶC
--      - Thời gian hiện tại >= public_date, HOẶC
--      - Người dùng đã đăng nhập có is_vip = true và chưa hết hạn.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_chapter_content(chapter_id TEXT)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  is_vip BOOLEAN,
  public_date TIMESTAMPTZ,
  preview_content TEXT,
  full_content TEXT,
  has_access BOOLEAN,
  author_note TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_is_vip BOOLEAN := FALSE;
  v_chapter public.chapters%ROWTYPE;
  v_can_read_full BOOLEAN := FALSE;
BEGIN
  SELECT *
  INTO v_chapter
  FROM public.chapters c
  WHERE c.id = chapter_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Kiểm tra quyền VIP của tài khoản hiện tại (nếu đã đăng nhập)
  IF v_user_id IS NOT NULL THEN
    SELECT (
      p.is_vip = TRUE
      AND (p.vip_expires_at IS NULL OR p.vip_expires_at > NOW())
    )
    INTO v_user_is_vip
    FROM public.profiles p
    WHERE p.id = v_user_id;
  END IF;

  v_can_read_full := (
    v_chapter.is_vip = FALSE
    OR (v_chapter.public_date IS NOT NULL AND NOW() >= v_chapter.public_date)
    OR COALESCE(v_user_is_vip, FALSE) = TRUE
  );

  RETURN QUERY
  SELECT
    v_chapter.id,
    v_chapter.title,
    v_chapter.is_vip,
    v_chapter.public_date,
    v_chapter.preview_content,
    CASE WHEN v_can_read_full THEN v_chapter.full_content ELSE NULL END,
    v_can_read_full,
    CASE WHEN v_can_read_full THEN v_chapter.author_note ELSE NULL END;
END;
$$;

REVOKE ALL ON FUNCTION public.get_chapter_content(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chapter_content(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. RPC: redeem_vip_code(input_code)
--    Kiểm tra mã dùng 1 lần, khóa dòng FOR UPDATE chống dùng trùng song song,
--    cập nhật is_used = true và cộng duration_days vào vip_expires_at.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_vip_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_clean_code TEXT := UPPER(TRIM(COALESCE(input_code, '')));
  v_code_row public.vip_codes%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Vui lòng đăng nhập tài khoản trước khi kích hoạt mã VIP.'
    );
  END IF;

  IF LENGTH(v_clean_code) < 4 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Mã kích hoạt VIP không hợp lệ.'
    );
  END IF;

  -- Khóa dòng mã VIP để chống race condition nếu bấm kích hoạt nhiều lần cùng lúc
  SELECT *
  INTO v_code_row
  FROM public.vip_codes
  WHERE UPPER(code) = v_clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Mã kích hoạt không tồn tại. Vui lòng kiểm tra lại.'
    );
  END IF;

  IF v_code_row.is_used THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Mã kích hoạt này đã được sử dụng trước đó.'
    );
  END IF;

  -- Đảm bảo user đã có dòng profile
  INSERT INTO public.profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  -- Tính ngày hết hạn mới:
  -- - Nếu mã là VIP vĩnh viễn (duration_days IS NULL) hoặc user đã là VIP vĩnh viễn -> giữ NULL
  -- - Ngược lại: cộng dồn vào hạn cũ (nếu còn hạn) hoặc cộng từ NOW()
  IF v_code_row.duration_days IS NULL THEN
    v_new_expires_at := NULL;
  ELSIF v_profile.is_vip = TRUE AND v_profile.vip_expires_at IS NULL THEN
    v_new_expires_at := NULL;
  ELSE
    v_new_expires_at := GREATEST(COALESCE(v_profile.vip_expires_at, NOW()), NOW())
      + make_interval(days => v_code_row.duration_days);
  END IF;

  -- Đánh dấu mã đã sử dụng
  UPDATE public.vip_codes
  SET is_used = TRUE,
      used_by = v_user_id,
      used_at = NOW()
  WHERE id = v_code_row.id;

  -- Nâng cấp / gia hạn hồ sơ VIP
  UPDATE public.profiles
  SET is_vip = TRUE,
      vip_expires_at = v_new_expires_at,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE
      WHEN v_new_expires_at IS NULL THEN 'Kích hoạt thành công Thành viên VIP Vĩnh viễn!'
      ELSE format('Kích hoạt thành công! Đã cộng thêm %s ngày Thành viên VIP.', v_code_row.duration_days)
    END,
    'is_vip', TRUE,
    'vip_expires_at', v_new_expires_at,
    'duration_days', v_code_row.duration_days
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_vip_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_vip_code(TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. DỮ LIỆU MẪU THAM KHẢO (Chạy tùy chọn để kiểm thử nhanh trên Supabase)
-- ----------------------------------------------------------------------------
INSERT INTO public.chapters (
  id, arc_id, chapter_number, title, published_at,
  preview_content, full_content, is_vip, public_date, author_note
)
VALUES (
  'arc-2-chuong-3',
  'arc-2',
  3,
  'Lời Thề Của Kẻ Gác Mộ',
  '26/11/2026',
  E'Cầu thang xoắn ốc dẫn xuống lòng đất dưới chân Tháp Nhật Thực lạnh hơn mặt cầu bên ngoài rất nhiều. Không khí ở đây khô khốc, thoang thoảng mùi giấy cũ, đồng oxy hóa và hương trầm cháy dở đã lắng đọng qua hàng chục năm không có gió lùa.\n\nTô Vãn — nữ học giả của Hội Lưu Trữ — bước sát phía sau Trần Khắc, một tay ôm chặt hộp gỗ sơn mài, tay kia lướt nhẹ qua những bức phù điêu khắc chìm dọc tường đá. Ánh sáng vàng ấm từ chiếc đèn đồng vẽ nên những bóng đổ dài chập chờn, khiến hình ảnh các hiệp sĩ quỳ gối dâng kiếm trên vách đá như đang khẽ cử động.',
  E'Cầu thang xoắn ốc dẫn xuống lòng đất dưới chân Tháp Nhật Thực lạnh hơn mặt cầu bên ngoài rất nhiều. Không khí ở đây khô khốc, thoang thoảng mùi giấy cũ, đồng oxy hóa và hương trầm cháy dở đã lắng đọng qua hàng chục năm không có gió lùa.\n\nTô Vãn — nữ học giả của Hội Lưu Trữ — bước sát phía sau Trần Khắc, một tay ôm chặt hộp gỗ sơn mài, tay kia lướt nhẹ qua những bức phù điêu khắc chìm dọc tường đá. Ánh sáng vàng ấm từ chiếc đèn đồng vẽ nên những bóng đổ dài chập chờn, khiến hình ảnh các hiệp sĩ quỳ gối dâng kiếm trên vách đá như đang khẽ cử động.\n\n“Nhìn hàng chữ dưới bệ phù điêu thứ tư kìa,” Tô Vãn đột ngột dừng lại, chỉ vào dòng khắc cổ chạy ngang tầm mắt. “Đó không phải văn bia tưởng niệm chiến thắng. Đó là danh sách những người tự nguyện ở lại giữ cửa phong ấn vào đêm nhật thực.”\n\nTrần Khắc đưa ngọn đèn lại gần. Giữa hàng chục cái tên đã bị rêu khô phủ mờ, dòng chữ khắc sâu nhất ở cuối cột khiến đồng tử hắn co lại. Nét chữ ấy cứng cáp, góc cạnh — chính là tên của sư phụ hắn, nằm ngay bên cạnh huy hiệu đầu sói của vị kỵ sĩ áo đen hắn vừa gặp ở cổng ngoài.\n\nPhía cuối hành lang, cánh cửa hầm mộ bằng đá huyền vũ khép hờ. Từ khe cửa tối thẳm vọng ra tiếng hát trầm thấp không rõ lời, tựa như bản cầu siêu cổ xưa vẫn chưa bao giờ dứt từ mười hai năm trước.\n\n“Họ không bỏ rơi cố đô,” Trần Khắc hạ giọng, bước thẳng tới trước cánh cửa đá nặng nề. “Họ đang giữ cho thứ bên dưới không bước ra ngoài. Và đêm nay, phong ấn ấy đã bắt đầu nứt.”',
  TRUE,
  '2026-12-03T13:00:00Z',
  'Chương mở đầu Arc 2 dành riêng cho độc giả Thành viên VIP đọc trước 7 ngày trước khi mở công khai.'
)
ON CONFLICT (id) DO NOTHING;

-- Mã VIP mẫu dùng 1 lần (tác giả có thể tự sinh thêm các mã mới trong bảng vip_codes)
INSERT INTO public.vip_codes (code, duration_days, note)
VALUES
  ('VIP30-HUYETNGUYET', 30, 'Gói 1 tháng (30 ngày)'),
  ('VIP90-THACHUYEN', 90, 'Gói 3 tháng (90 ngày)'),
  ('VIPFULL-MACLAM', NULL, 'Gói Vĩnh viễn / Ủng hộ tác giả')
ON CONFLICT (code) DO NOTHING;
