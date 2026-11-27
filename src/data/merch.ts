import type {MerchItem} from '../types';

/**
 * ============================================================================
 * HƯỚNG DẪN TỰ CẬP NHẬT SẢN PHẨM MERCH (DÀNH CHO TÁC GIẢ)
 * ============================================================================
 *
 * 1. THAY ẢNH SẢN PHẨM:
 *    - Chép ảnh chụp sản phẩm hoặc tranh vẽ merch vào `src/assets/images/`.
 *    - Đổi trường `image` thành `./src/assets/images/ten-anh-cua-ban.jpg`.
 *
 * 2. CẬP NHẬT TRẠNG THÁI HÀNG:
 *    - 'con-hang'  -> hiển thị nhãn "Còn hàng"
 *    - 'pre-order' -> hiển thị nhãn "Pre-order"
 *    - 'het-hang'  -> hiển thị nhãn "Hết hàng" (tự động khóa nút đặt mua)
 *
 * 3. THAY LINK ĐẶT MUA BÊN NGOÀI (SHOPEE / ZALO / GOOGLE FORM):
 *    - Chỉnh các đường dẫn trong `orderLinks` của từng sản phẩm.
 *    - Nếu sản phẩm chỉ bán trên 1 kênh, bạn có thể xóa các kênh còn lại.
 * ============================================================================
 */

export const MERCH_ITEMS: MerchItem[] = [
  {
    id: 'merch-standee-ke-gac-den',
    name: 'Standee Acrylic — Kỵ Sĩ Bóng Đêm & Đèn Đồng',
    category: 'standee',
    categoryLabel: 'Standee',
    priceVnd: 185000,
    status: 'con-hang',
    featured: true,
    // >>> THAY ĐƯỜNG DẪN ẢNH SẢN PHẨM TẠI ĐÂY <<<
    image: './src/assets/images/merch_acrylic_standee_1795755469235.jpg',
    dimensions: 'Cao 16 cm × Rộng 11 cm · Đế tròn dày 5 mm',
    material: 'Acrylic trong suốt 2 mặt chống xước, đế in nhũ vàng đồng',
    releaseNote: 'Đợt in đầu tiên — tặng kèm thẻ nhân vật ép kim',
    description:
      'Standee minh họa nhân vật Kỵ Sĩ Bóng Đêm trong Arc 1 với họa tiết thành quách nền sâu và phần đế tròn khắc cổ tự ánh vàng đồng. In UV sắc nét hai lớp, phù hợp trưng bày bàn làm việc hoặc kệ sách sưu tầm.',
    orderLinks: {
      shopee: 'https://shopee.vn/',
      zalo: 'https://zalo.me/',
      googleForm: 'https://docs.google.com/forms/',
    },
  },
  {
    id: 'merch-tranh-in-nhat-thuc',
    name: 'Tranh In Mỹ Thuật Có Khung — Nhật Thực Cố Đô',
    category: 'tranh-in',
    categoryLabel: 'Tranh in',
    priceVnd: 320000,
    status: 'con-hang',
    featured: true,
    image: './src/assets/images/merch_art_print_1795755469687.jpg',
    dimensions: 'Khổ A3 (29.7 × 42 cm) kèm khung nhôm đen nhám',
    material: 'Giấy mỹ thuật Cotton 300gsm in Giclée bền màu',
    releaseNote: 'Kèm chữ ký tay tác giả ở góc dưới bức tranh',
    description:
      'Bản in mỹ thuật độ phân giải cao tái hiện pháo đài Thạch Uyên dưới vầng trăng khuyết màu đồng. Bề mặt giấy có vân nhẹ tạo chiều sâu như tranh vẽ tay, đi kèm khung nhôm mảnh tối giản sẵn móc treo.',
    orderLinks: {
      shopee: 'https://shopee.vn/',
      zalo: 'https://zalo.me/',
      googleForm: 'https://docs.google.com/forms/',
    },
  },
  {
    id: 'merch-moc-khoa-den-long',
    name: 'Móc Khóa Kim Loại Tráng Men — Đèn Lồng Trăng Khuyết',
    category: 'moc-khoa',
    categoryLabel: 'Móc khóa',
    priceVnd: 125000,
    status: 'pre-order',
    featured: true,
    image: './src/assets/images/merch_enamel_keychain_1795755469930.jpg',
    dimensions: 'Dài 5.8 cm × Rộng 4.5 cm (không tính khoen móc)',
    material: 'Hợp kim đúc mạ đồng cổ, tráng men xanh đêm thủ công',
    releaseNote: 'Dự kiến giao hàng đợt Pre-order sau 14 ngày chốt đơn',
    description:
      'Móc khóa đúc nổi hai mặt lấy cảm hứng từ ngọn đèn đồng của Trần Khắc và vầng trăng khuyết cố đô. Lớp tráng men xanh lam sâu kết hợp viền đồng xước cổ điển, khóa càng cua chắc chắn chống gỉ.',
    orderLinks: {
      shopee: 'https://shopee.vn/',
      zalo: 'https://zalo.me/',
      googleForm: 'https://docs.google.com/forms/',
    },
  },
  {
    id: 'merch-artbook-bien-nien-su',
    name: 'Artbook Bìa Cứng — Biên Niên Sử Tro Tàn (Bản Giới Hạn)',
    category: 'phu-kien',
    categoryLabel: 'Phụ kiện',
    priceVnd: 490000,
    status: 'pre-order',
    featured: false,
    image: './src/assets/images/merch_hardcover_artbook_1795755469745.jpg',
    dimensions: 'Khổ 19 × 26 cm · 128 trang màu',
    material: 'Bìa vải linen đen ép kim vàng đồng, dây ruy-băng lụa xanh đêm',
    releaseNote: 'Tặng kèm 2 postcard minh họa độc quyền khi đặt trước',
    description:
      'Tuyển tập toàn bộ bản phác thảo nhân vật, bản đồ cổ Thạch Uyên, ký tự phong ấn và ghi chú hậu trường từ tác giả. Gáy khâu chỉ mở phẳng 180 độ, bọc vải linen đen sang trọng.',
    orderLinks: {
      shopee: 'https://shopee.vn/',
      googleForm: 'https://docs.google.com/forms/',
    },
  },
  {
    id: 'merch-poster-cong-suong',
    name: 'Poster Bìa Chính Thức — Cổng Sương Thạch Uyên',
    category: 'tranh-in',
    categoryLabel: 'Tranh in',
    priceVnd: 145000,
    status: 'con-hang',
    featured: false,
    image: './src/assets/images/novel_cover_huyet_nguyet_1795755469511.jpg',
    dimensions: 'Khổ A3 (29.7 × 42 cm) · Đóng ống cứng chống gập',
    material: 'Giấy Couche mờ 250gsm cán màng chống lóa',
    releaseNote: 'Sẵn hàng giao ngay toàn quốc',
    description:
      'Tranh bìa chính thức của Huyết Nguyệt Cố Đô được in không chữ để giữ trọn vẹn vẻ đẹp hội họa Dark Fantasy. Cán màng mờ cao cấp không bị chói sáng dưới đèn phòng.',
    orderLinks: {
      shopee: 'https://shopee.vn/',
      zalo: 'https://zalo.me/',
    },
  },
  {
    id: 'merch-tranh-vai-thanh-quach',
    name: 'Tranh Vải Treo Tường — Toàn Cảnh Thành Nhật Thực',
    category: 'phu-kien',
    categoryLabel: 'Phụ kiện',
    priceVnd: 390000,
    status: 'het-hang',
    featured: false,
    image: './src/assets/images/hero_blood_moon_citadel_1795755470351.jpg',
    dimensions: 'Ngang 90 cm × Cao 50 cm · Kèm thanh treo gỗ đen',
    material: 'Vải canvas dệt mịn phủ chống bụi',
    releaseNote: 'Đã bán hết đợt 1 — dự kiến mở lại vào Arc 3',
    description:
      'Bức tranh vải khổ ngang tái hiện toàn cảnh cầu đá và Tháp Nhật Thực giữa tầng mây mù. Phiên bản đánh số giới hạn 100 bản cho đợt ra mắt đầu tiên.',
    orderLinks: {
      googleForm: 'https://docs.google.com/forms/',
    },
  },
];
