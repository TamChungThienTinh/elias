import type {
  Arc,
  Chapter,
  ChapterComment,
  MerchItem,
  RecommendedStory,
} from '../types';

/**
 * ============================================================================
 * CẤU HÌNH NỘI DUNG TRANG WEB (FILE CHỈNH SỬA DUY NHẤT DÀNH CHO TÁC GIẢ)
 * ============================================================================
 * Bạn chỉ cần điền thông tin tác phẩm, đường dẫn ảnh, chương dự phòng,
 * sản phẩm Merch và thông tin tài khoản VietQR tại file này.
 *
 * HƯỚNG DẪN THÊM ẢNH:
 * - Chép ảnh của bạn vào thư mục `src/assets/images/` (hoặc dùng link ảnh online).
 * - Điền đường dẫn dạng `/src/assets/images/ten-anh.jpg` vào các trường `image` / `coverImage`.
 * - Khi để trống `""`, trang web sẽ tự động hiển thị khung ảnh chờ viền vàng đồng gợi ý tỷ lệ.
 * ============================================================================
 */

export interface SiteConfig {
  /** Tên thương hiệu hiển thị trên Header, Footer và tiêu đề tab trình duyệt */
  siteName: string;
  /** Tên tác phẩm chính hiển thị lớn ở Hero Trang chủ */
  storyTitle: string;
  /** Tên bộ truyện hoặc dòng phụ đề ngắn dưới tên tác phẩm */
  subtitle: string;
  /** Tên tác giả / bút danh */
  authorName: string;
  /** Danh sách thể loại truyện (tối đa 3–4 thể loại cho gọn gàng) */
  genres: string[];
  /** Trạng thái phát hành (vd: "Đang ra chương mới", "Đã hoàn thành") */
  status: string;
  /** Lịch ra chương dự kiến */
  updateSchedule: string;
  /** Đường dẫn ảnh bìa truyện (tỷ lệ 3:4). Để "" để hiện khung ảnh chờ */
  coverImage: string;
  /** Đường dẫn ảnh nền Hero (tùy chọn). Để "" để dùng nền tối chuyển sắc mặc định */
  bannerImage: string;
  /** Các đoạn văn tóm tắt cốt truyện ở Hero Trang chủ */
  synopsis: string[];

  /** Tiêu đề khung Thông báo của tác giả trên Trang chủ */
  authorNoticeTitle: string;
  /** Ngày cập nhật thông báo (định dạng DD/MM/YYYY) */
  authorNoticeDate: string;
  /** Nội dung thông báo lịch ra chương, ghi chú sự kiện hoặc lời nhắn gửi độc giả */
  authorNoticeContent: string;

  /** Bật/tắt khu vực Vũ trụ / Tác phẩm liên quan trên Trang chủ (đổi thành false để ẩn đi) */
  showRelatedSection: boolean;
  /** Tiêu đề khu vực tác phẩm liên quan */
  relatedSectionTitle: string;
  /** Danh sách thẻ tác phẩm liên quan / ngoại truyện / hồ sơ thế giới */
  relatedWorks: RecommendedStory[];

  /** Danh sách Arc mẫu (dữ liệu dự phòng khi chưa tải từ Supabase) */
  arcs: Arc[];
  /** Danh sách Chương mẫu (dữ liệu dự phòng khi chưa tải từ Supabase) */
  chapters: Chapter[];
  /** Bình luận mẫu khởi tạo (để mảng rỗng [] cho sạch) */
  initialComments: ChapterComment[];

  /** Danh sách sản phẩm Merch nổi bật & trưng bày trong Cửa hàng */
  merchItems: MerchItem[];

  /** Thông tin ngân hàng tạo mã VietQR tự động trong Modal Hướng dẫn nhận mã VIP */
  vietQrBank: {
    /** Mã ngân hàng theo chuẩn VietQR (vd: 'MB', 'VCB', 'TCB', 'ACB', 'BIDV', 'TPB') */
    bankCode: string;
    /** Tên ngân hàng hiển thị cho độc giả */
    bankDisplayName: string;
    /** Số tài khoản nhận chuyển khoản */
    accountNumber: string;
    /** Tên chủ tài khoản viết hoa không dấu */
    accountName: string;
  };

  /** Đường dẫn liên hệ tác giả để gửi biên lai nhận mã VIP */
  authorContacts: {
    /** Link Facebook / Messenger của tác giả */
    facebookUrl: string;
    /** Link Zalo hoặc Discord của tác giả */
    zaloOrDiscordUrl: string;
  };
}

export const SITE_CONFIG: SiteConfig = {
  // 1. THÔNG TIN CƠ BẢN CỦA TRANG WEB & TÁC PHẨM
  siteName: '[Tên web / Thương hiệu]',
  storyTitle: '[Tên tác phẩm của bạn]',
  subtitle: '[Tên bộ / Dòng phụ đề]',
  authorName: '[Tên tác giả]',
  genres: ['Thể loại 1', 'Thể loại 2', 'Thể loại 3'],
  status: 'Đang ra chương mới',
  updateSchedule: '[Lịch ra chương, ví dụ: Thứ Tư & Chủ Nhật]',
  coverImage: '',
  bannerImage: '',
  synopsis: [
    '[Đoạn 1: Viết phần mở đầu giới thiệu bối cảnh tác phẩm tại đây...]',
    '[Đoạn 2: Viết phần giới thiệu nhân vật chính và xung đột cốt truyện tại đây...]',
  ],

  // 2. KHU VỰC THÔNG BÁO CỦA TÁC GIẢ (TRANG CHỦ)
  authorNoticeTitle: 'Thông báo của tác giả',
  authorNoticeDate: 'DD/MM/YYYY',
  authorNoticeContent:
    '[Chỗ viết thông báo lịch ra chương, ghi chú sự kiện hoặc lời nhắn tới độc giả...]',

  // 3. DANH SÁCH ARC & CHƯƠNG MẪU (DỰ PHÒNG KHI CHƯA TẢI TỪ SUPABASE)
  arcs: [
    {
      id: 'arc-1',
      number: 1,
      title: 'Arc 1: [Tên Arc 1]',
      subtitle: '[Phụ đề ngắn cho Arc 1]',
      summary: '[Mô tả ngắn nội dung Arc 1...]',
    },
  ],

  chapters: [
    {
      id: 'arc-1-chuong-1',
      arcId: 'arc-1',
      number: 1,
      title: '[Tên Chương 1]',
      publishedAt: 'DD/MM/YYYY',
      views: 0,
      likes: 0,
      tags: ['Thể loại 1'],
      paragraphs: ['[Chỗ dán nội dung Chương 1 tại đây...]'],
    },
  ],

  initialComments: [],

  // 4. KHU VỰC MERCH NỔI BẬT & CỬA HÀNG (3 KHUNG SẢN PHẨM MẪU)
  merchItems: [
    {
      id: 'merch-1',
      name: '[Tên sản phẩm Merch 1]',
      category: 'standee',
      categoryLabel: '[Loại sản phẩm]',
      priceVnd: 0,
      priceDisplay: '0 đ',
      status: 'pre-order',
      stockStatusLabel: 'Sắp mở bán',
      featured: true,
      image: '',
      dimensions: '[Kích thước sản phẩm, ví dụ: Cao 16 cm × Rộng 11 cm]',
      material: '[Chất liệu sản phẩm, ví dụ: Acrylic / Kim loại / Giấy mỹ thuật]',
      releaseNote: '[Ghi chú đợt phát hành hoặc quà tặng kèm]',
      description: '[Viết mô tả chi tiết cho sản phẩm Merch 1 tại đây...]',
      orderLinks: {
        shopee: 'https://shopee.vn/',
        zalo: 'https://zalo.me/',
        googleForm: 'https://docs.google.com/forms/',
      },
    },
    {
      id: 'merch-2',
      name: '[Tên sản phẩm Merch 2]',
      category: 'tranh-in',
      categoryLabel: '[Loại sản phẩm]',
      priceVnd: 0,
      priceDisplay: '0 đ',
      status: 'pre-order',
      stockStatusLabel: 'Sắp mở bán',
      featured: true,
      image: '',
      dimensions: '[Kích thước sản phẩm, ví dụ: Khổ A3]',
      material: '[Chất liệu sản phẩm]',
      releaseNote: '[Ghi chú đợt phát hành]',
      description: '[Viết mô tả chi tiết cho sản phẩm Merch 2 tại đây...]',
      orderLinks: {
        shopee: 'https://shopee.vn/',
        zalo: 'https://zalo.me/',
        googleForm: 'https://docs.google.com/forms/',
      },
    },
    {
      id: 'merch-3',
      name: '[Tên sản phẩm Merch 3]',
      category: 'moc-khoa',
      categoryLabel: '[Loại sản phẩm]',
      priceVnd: 0,
      priceDisplay: '0 đ',
      status: 'pre-order',
      stockStatusLabel: 'Sắp mở bán',
      featured: true,
      image: '',
      dimensions: '[Kích thước sản phẩm]',
      material: '[Chất liệu sản phẩm]',
      releaseNote: '[Ghi chú đợt phát hành]',
      description: '[Viết mô tả chi tiết cho sản phẩm Merch 3 tại đây...]',
      orderLinks: {
        shopee: 'https://shopee.vn/',
        zalo: 'https://zalo.me/',
        googleForm: 'https://docs.google.com/forms/',
      },
    },
  ],

  // 5. KHU VỰC VŨ TRỤ / TÁC PHẨM LIÊN QUAN (ĐỔI showRelatedSection: false ĐỂ ẨN)
  showRelatedSection: true,
  relatedSectionTitle: 'Vũ trụ & Tác phẩm liên quan',
  relatedWorks: [
    {
      id: 'related-1',
      title: '[Tên ngoại truyện / Hồ sơ thế giới]',
      arcHint: '[Ghi chú ngắn, ví dụ: Ngoại truyện / Hồ sơ thế giới]',
      genre: '[Thể loại]',
      tags: ['Thể loại 1'],
      weeklyReads: 0,
      favorites: 0,
      blurb: '[Viết mô tả ngắn giới thiệu ngoại truyện, tư liệu bối cảnh hoặc hồ sơ nhân vật tại đây...]',
      defaultReason: '[Ghi chú gợi ý đọc]',
      linkedChapterId: 'arc-1-chuong-1',
      coverImage: '',
    },
    {
      id: 'related-2',
      title: '[Tên ngoại truyện / Hồ sơ thế giới]',
      arcHint: '[Ghi chú ngắn, ví dụ: Tiền truyện / Bản đồ thế giới]',
      genre: '[Thể loại]',
      tags: ['Thể loại 2'],
      weeklyReads: 0,
      favorites: 0,
      blurb: '[Viết mô tả ngắn cho tác phẩm mở rộng hoặc tài liệu phụ trợ thứ hai tại đây...]',
      defaultReason: '[Ghi chú gợi ý đọc]',
      linkedChapterId: 'arc-1-chuong-1',
      coverImage: '',
    },
  ],

  // 6. CẤU HÌNH VIETQR & LIÊN HỆ NHẬN MÃ VIP
  vietQrBank: {
    bankCode: 'MB',
    bankDisplayName: '[Tên ngân hàng của bạn]',
    accountNumber: '[SO_TAI_KHOAN]',
    accountName: '[TEN_CHU_TK_KHONG_DAU]',
  },
  authorContacts: {
    facebookUrl: 'https://facebook.com/',
    zaloOrDiscordUrl: 'https://zalo.me/',
  },
};
