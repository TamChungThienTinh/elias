import type {
  Arc,
  AuthorAnnouncement,
  Chapter,
  ChapterComment,
  NovelInfo,
  RecommendedStory,
} from '../types';

/**
 * ============================================================================
 * HƯỚNG DẪN TỰ CẬP NHẬT TRUYỆN & HÌNH ẢNH MINH HỌA (DÀNH CHO TÁC GIẢ)
 * ============================================================================
 *
 * 1. THAY ẢNH BÌA & BANNER:
 *    - Chép file tranh vẽ của bạn vào thư mục `src/assets/images/`
 *      (ví dụ: `src/assets/images/bia-truyen-moi.jpg`).
 *    - Đổi đường dẫn `coverImage` và `bannerImage` bên dưới thành:
 *      `/src/assets/images/bia-truyen-moi.jpg` (bắt đầu bằng `/` để hiển thị đúng ở mọi đường dẫn con).
 *
 * 2. THÊM ARC MỚI:
 *    - Thêm một phần tử mới vào mảng `ARCS` (ví dụ: id: 'arc-3', number: 3, title: '...').
 *
 * 3. ĐĂNG CHƯƠNG MỚI:
 *    - Sao chép một đối tượng mẫu trong mảng `CHAPTERS` và dán xuống cuối mảng.
 *    - Đặt `id` duy nhất (ví dụ: 'arc-1-chuong-3'), `arcId` khớp với Arc tương ứng.
 *    - Dán nội dung văn bản vào mảng `paragraphs` (mỗi phần tử là một đoạn văn).
 *    - Nếu muốn chương mới ở chế độ đọc trước VIP, thêm `isVipEarlyAccess: true`.
 *    - Lưu file, push lên nhánh `main` — GitHub Actions sẽ tự động build và cập nhật web!
 * ============================================================================
 */

export const NOVEL_INFO: NovelInfo = {
  title: 'Huyết Án Đa Diện',
  subtitle: 'Biên Niên Sử Tro Tàn',
  author: 'Mặc Lâm',
  genres: ['Dark Fantasy', 'Kỳ Ảo Cổ Điển', 'Huyền Bí'],
  statusText: 'Đang ra chương mới',
  updateSchedule: 'Cập nhật Thứ Tư & Chủ Nhật hàng tuần',
  // >>> THAY ĐƯỜNG DẪN ẢNH BÌA TRUYỆN TẠI ĐÂY <<<
  coverImage: '/src/assets/images/novel_cover_huyet_nguyet_1795755469511.jpg',
  // >>> THAY ĐƯỜNG DẪN ẢNH BANNER TRANG CHỦ TẠI ĐÂY <<<
  bannerImage: '/src/assets/images/hero_blood_moon_citadel_1795755470351.jpg',
  tagline: 'Khi nhật thực phủ kín thành quách cổ, chỉ ngọn đèn đồng của kẻ gác đêm còn giữ lại ký ức của người sống.',
  synopsis: [
    'Mười hai năm sau đêm Nhật Thực Đen nhấn chìm kinh thành Thạch Uyên vào màn sương xám, vương triều xưa chỉ còn là những tháp đá câm lặng và lời thì thầm của tàn tro. Kẻ nào bước qua cổng thành khi chuông đồng điểm canh ba đều bị sương mù xóa mất tên tuổi.',
    'Trần Khắc — một người gác đèn mang theo chiếc lồng đồng khắc cổ tự — quay trở lại cố đô để tìm mảnh di thư thất lạc của vị sư phụ đã hóa đá. Giữa những hiệp sĩ vong hồn, các học giả lưu đày và bí mật bị chôn vùi dưới nền tháp chuông, ngọn lửa nhỏ trong tay hắn là ranh giới mong manh duy nhất giữa sự tỉnh táo và bóng tối vĩnh hằng.',
  ],
};

/**
 * DANH SÁCH CÁC ARC (HỒI TRUYỆN)
 * Thêm Arc mới bằng cách bổ sung đối tượng vào mảng bên dưới.
 */
export const ARCS: Arc[] = [
  {
    id: 'arc-1',
    number: 1,
    title: 'Arc 1: Đêm Tro Tàn',
    subtitle: 'Bước chân trở lại kinh thành Thạch Uyên',
    summary:
      'Khởi đầu hành trình của Trần Khắc trước Cổng Sương Mù, nơi ngọn đèn đồng lần đầu thức tỉnh ký ức cổ xưa dưới chân Tháp Nhật Thực.',
  },
  {
    id: 'arc-2',
    number: 2,
    title: 'Arc 2: Khúc Hát Vực Sâu',
    subtitle: 'Bí mật hầm mộ và lời thề của Kỵ Sĩ Bóng Đêm',
    summary:
      'Tiến sâu vào tầng hầm cổ dưới nội thành, đối mặt với tàn dư của Hội Gác Mộ và sự thật đằng sau đêm nhật thực mười hai năm trước.',
  },
];

/**
 * DANH SÁCH CÁC CHƯƠNG TRUYỆN
 * Dán chương mới của bạn vào mảng `CHAPTERS` bên dưới.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 'arc-1-chuong-1',
    arcId: 'arc-1',
    number: 1,
    title: 'Ngọn Đèn Đồng Trước Cổng Cố Đô',
    publishedAt: '18/11/2026',
    views: 14820,
    likes: 1246,
    tags: ['Khởi đầu', 'Cố đô', 'Kỳ ảo'],
    // Ảnh minh họa tùy chọn cho chương (có thể xóa dòng này nếu chương không có tranh)
    illustration: '/src/assets/images/novel_cover_huyet_nguyet_1795755469511.jpg',
    illustrationCaption: 'Minh họa Chương 1 — Người gác đèn đứng trước Cổng Sương Cố Đô.',
    authorNote: 'Cảm ơn độc giả đã đồng hành cùng chương mở đầu của Huyết Nguyệt Cố Đô. Hãy thử chuyển sang chế độ Giấy vàng hoặc Lật trang để trải nghiệm đọc thoải mái nhất.',
    paragraphs: [
      'Gió thổi qua hẻm núi đá phiến mang theo mùi tro lạnh và hơi ẩm của rêu xanh lâu năm. Phía trước Trần Khắc, vòm cổng Thạch Uyên sừng sững giữa biển sương bạc như bộ xương đá của một con thú khổng lồ đã ngủ quên qua nhiều thế kỷ. Những đường cổ tự khắc dọc thân trụ đã mòn vẹt vì mưa gió, nhưng mỗi khi ánh lửa từ chiếc đèn đồng trong tay hắn lướt qua, từng nét chữ lại ánh lên một vệt sáng vàng sẫm tựa đồng nung.',
      'Hắn dừng bước ở bậc đá cuối cùng trước ngưỡng cổng, cúi xuống nhìn những cánh hoa trắng nhỏ bé rơi rải rác dọc lối đi. Không phải hoa thật. Khi chạm mũi giày vào, chúng vỡ tan thành bụi phấn xám — tàn tích của thứ sương muối chỉ xuất hiện khi vầng trăng bị che khuất bởi bóng nhật thực.',
      '“Mười hai năm rồi,” Trần Khắc khẽ lẩm bẩm, giọng nói chìm nghỉm trong tiếng gió rít qua kẽ đá. Hắn nâng chiếc đèn đồng lên ngang tầm mắt. Ngọn bấc bên trong không cháy bằng dầu thông thường mà bằng thứ sáp xám chiết xuất từ nhựa cây tuyết tùng cổ thụ, thứ duy nhất giữ được lửa khi không khí trong cố đô trở nên đặc quánh như nước đọng.',
      'Từ bên trong vòm cổng tối om, một tiếng kim loại va chạm vang lên khô khốc. Không nhanh, không vội, đều đặn như nhịp bước của một kẻ tuần tra vô hình. Trần Khắc không rút thanh đoản kiếm bên hông. Hắn biết rõ quy tắc đầu tiên mà sư phụ từng dặn trước khi biến mất: trong Thạch Uyên, lưỡi thép chỉ khiến bóng tối hung hãn hơn; thứ duy nhất khiến chúng lùi bước là ánh sáng biết gọi đúng tên chủ nhân.',
      'Một bóng người cao lớn dần hiện ra từ màn sương. Tấm áo choàng rách tả tơi khoác ngoài bộ giáp đen phủ đầy dấu kiếm chém, trên cánh tay trái mang chiếc khiên khắc đầu sói bằng đồng cổ. Dưới mũ trùm tối sẫm, không có đôi mắt nào sáng lên — chỉ có hơi thở lạnh lẽo phả ra từng làn khói trắng mỏng tang.',
      '“Kẻ ngoại lai,” giọng nói khàn đặc cất lên, nghe như tiếng đá mài vào nhau. “Cổng Thạch Uyên đã đóng từ đêm trăng mất bóng. Ngươi mang lửa vào đây để tìm ai?”',
      'Trần Khắc giữ vững cổ tay để ngọn lửa không chao đảo. Ánh sáng ấm áp rọi thẳng lên huy hiệu đầu sói trên tấm khiên của người đối diện, làm lộ rõ vết nứt dài vắt ngang mặt kim loại. Hắn nhớ vết nứt ấy. Chính nó đã nằm trong bức phác họa cuối cùng mà sư phụ để lại trong cuốn sổ bọc vải đen.',
      '“Ta không tìm người sống,” Trần Khắc đáp chậm rãi, từng chữ rõ ràng vang vọng dưới vòm đá cổ. “Ta đến để trả lại chìa khóa tháp chuông cho Đội Cận Vệ Tro Tàn — và lấy lại bản ghi chép bị bỏ quên ở hành lang phía Đông.”',
      'Kỵ sĩ áo đen bất động trong vài nhịp thở dài đằng đẵng. Gió núi đột ngột lặng xuống. Bụi tro trên nền đá xoay nhẹ thành một vòng tròn nhỏ quanh mũi giày của cả hai người, rồi từ từ hạ xuống khi thanh trường kiếm trong tay kỵ sĩ khẽ hạ mũi xuống đất.',
      '“Vậy thì giữ cho ngọn đèn ấy đừng tắt trước canh tư,” bóng giáp đen lùi nửa bước vào màn sương, nhường lại con đường đá hẹp dẫn sâu vào lòng cố đô. “Bởi vì đêm nay, tiếng chuông dưới Tháp Nhật Thực đã bắt đầu rung trở lại.”',
    ],
  },
  {
    id: 'arc-1-chuong-2',
    arcId: 'arc-1',
    number: 2,
    title: 'Tiếng Chuông Dưới Tháp Nhật Thực',
    publishedAt: '23/11/2026',
    views: 12390,
    likes: 1094,
    tags: ['Tháp chuông', 'Bí ẩn', 'Hành động'],
    illustration: '/src/assets/images/hero_blood_moon_citadel_1795755470351.jpg',
    illustrationCaption: 'Minh họa Chương 2 — Cây cầu đá dẫn lên Tháp Nhật Thực giữa màn sương.',
    authorNote: 'Chương 2 mở ra bối cảnh bên trong cầu đá Thạch Uyên. Đừng quên để lại bình luận dự đoán danh tính người gõ chuông nhé!',
    paragraphs: [
      'Cây cầu đá bắc qua vực sương nối liền cổng ngoài với khu nội thành dài hơn hai trăm bước chân. Hai bên lan can, những chiếc lồng đèn cổ bằng sắt rèn vốn đã tắt ngấm suốt hơn một thập kỷ nay bỗng le lói những đốm lửa vàng cam yếu ớt, nối thành một dải sáng đứt quãng uốn lượn lên tận chân tòa tháp nhọn cao nhất.',
      'Mỗi bước chân Trần Khắc đặt lên phiến đá ướt sương đều phát ra âm thanh trầm đục. Phía dưới vực sâu, tầng mây đặc cuộn trào như mặt biển đen không đáy. Thỉnh thoảng, một luồng gió lạnh từ dưới đáy vực thốc ngược lên, mang theo dư âm trầm vang của một hồi chuông đồng cổ kính.',
      'Boong... boong...',
      'Âm thanh không vọng ra từ trên đỉnh tháp như lẽ thường, mà rung lên từ sâu bên dưới móng đá, truyền qua đế giày da lên tận lồng ngực. Trần Khắc khẽ cau mày. Ngọn lửa trong chiếc đèn đồng của hắn bỗng thu nhỏ lại thành một hạt đậu xanh biếc rồi lại bùng lên sắc vàng ấm, như thể đang phản ứng trước một nguồn cổ thuật mạnh mẽ đang thức dậy.',
      'Ở giữa cầu, bên cạnh bệ đá đổ nát của một pho tượng không đầu, có một người phụ nữ khoác áo choàng xanh thẫm đang ngồi bó gối, trước mặt đặt một hộp gỗ sơn mài nhỏ và vài tờ giấy da ố vàng. Thấy ánh đèn của Trần Khắc tiến lại gần, nàng không hề tỏ ra kinh ngạc mà chỉ ngẩng đầu lên, để lộ đôi mắt sáng tỉnh táo lạ thường giữa vùng đất hoang phế này.',
      '“Người giữ đèn cuối cùng của Học Viện Bắc Phố,” nàng nói, giọng nhẹ nhưng sắc nét như lưỡi dao giấy. “Ta đã tưởng các ngươi đều bỏ cuộc từ ba năm trước khi đoàn thám hiểm hoàng gia không một ai quay về.”',
      'Trần Khắc dừng cách nàng năm bước, hơi nghiêng đèn để ánh sáng soi rõ dấu ấn bạc trên vạt áo choàng xanh thẫm — biểu tượng chiếc cân gãy của Hội Lưu Trữ Sương Mù. “Ngươi là người của Hội Lưu Trữ. Sao lại ngồi giữa cầu vào lúc chuông tháp đang đổ?”',
      '“Vì nếu ta bước thêm mười bước nữa về phía tháp, những tờ ghi chép này sẽ cháy thành tro đen,” nàng giơ lên một mảnh giấy da vẽ sơ đồ tầng hầm hình xoắn ốc. “Tháp Nhật Thực không chỉ là đài thiên văn. Mười hai năm trước, thứ rơi xuống giữa đêm nhật thực không phải thiên thạch — mà là một lời giao ước bị phá vỡ.”',
      'Đúng lúc ấy, hồi chuông thứ ba vang lên, trầm và nặng đến mức những viên sỏi nhỏ trên mặt cầu khẽ nhảy lách tách. Trên nền trời đen kịt phía sau ngọn tháp nhọn, vầng trăng tròn bị bao phủ bởi một vòng hào quang màu đồng sẫm, sắc nét như vết cắt của ngọn lửa nguội. Cánh cổng sắt nặng nề dưới chân tháp từ từ hé mở trong tiếng bản lề rỉ sét rên rỉ.',
      'Trần Khắc siết chặt quai đèn đồng, nhìn sang người phụ nữ áo xanh: “Nếu ngươi muốn giữ nguyên những trang giấy đó, hãy đi ngay phía sau vùng sáng của ta. Chúng ta còn chưa đầy hai canh giờ trước khi sương đỏ tràn lên mặt cầu.”',
    ],
  },
  {
    id: 'arc-2-chuong-3',
    arcId: 'arc-2',
    number: 3,
    title: 'Lời Thề Của Kẻ Gác Mộ',
    publishedAt: '26/11/2026',
    views: 8940,
    likes: 912,
    tags: ['Arc 2', 'Hầm mộ', 'VIP Đọc trước'],
    isVipEarlyAccess: true,
    vipUnlockDate: '03/12/2026',
    publicDate: '2026-12-03T13:00:00Z',
    previewParagraphCount: 2,
    authorNote: 'Chương mở đầu Arc 2 dành riêng cho độc giả Thành viên VIP đọc trước 7 ngày trước khi mở công khai. Nhập mã kích hoạt VIP để đọc trọn vẹn chương này.',
    paragraphs: [
      'Cầu thang xoắn ốc dẫn xuống lòng đất dưới chân Tháp Nhật Thực lạnh hơn mặt cầu bên ngoài rất nhiều. Không khí ở đây khô khốc, thoang thoảng mùi giấy cũ, đồng oxy hóa và hương trầm cháy dở đã lắng đọng qua hàng chục năm không có gió lùa.',
      'Tô Vãn — nữ học giả của Hội Lưu Trữ — bước sát phía sau Trần Khắc, một tay ôm chặt hộp gỗ sơn mài, tay kia lướt nhẹ qua những bức phù điêu khắc chìm dọc tường đá. Ánh sáng vàng ấm từ chiếc đèn đồng vẽ nên những bóng đổ dài chập chờn, khiến hình ảnh các hiệp sĩ quỳ gối dâng kiếm trên vách đá như đang khẽ cử động.',
      '“Nhìn hàng chữ dưới bệ phù điêu thứ tư kìa,” Tô Vãn đột ngột dừng lại, chỉ vào dòng khắc cổ chạy ngang tầm mắt. “Đó không phải văn bia tưởng niệm chiến thắng. Đó là danh sách những người tự nguyện ở lại giữ cửa phong ấn vào đêm nhật thực.”',
      'Trần Khắc đưa ngọn đèn lại gần. Giữa hàng chục cái tên đã bị rêu khô phủ mờ, dòng chữ khắc sâu nhất ở cuối cột khiến đồng tử hắn co lại. Nét chữ ấy cứng cáp, góc cạnh — chính là tên của sư phụ hắn, nằm ngay bên cạnh huy hiệu đầu sói của vị kỵ sĩ áo đen hắn vừa gặp ở cổng ngoài.',
      'Phía cuối hành lang, cánh cửa hầm mộ bằng đá huyền vũ khép hờ. Từ khe cửa tối thẳm vọng ra tiếng hát trầm thấp không rõ lời, tựa như bản cầu siêu cổ xưa vẫn chưa bao giờ dứt từ mười hai năm trước.',
      '“Họ không bỏ rơi cố đô,” Trần Khắc hạ giọng, bước thẳng tới trước cánh cửa đá nặng nề. “Họ đang giữ cho thứ bên dưới không bước ra ngoài. Và đêm nay, phong ấn ấy đã bắt đầu nứt.”',
    ],
  },
];

/**
 * THÔNG BÁO TÁC GIẢ & LỊCH RA CHƯƠNG (HIỂN THỊ TRÊN TRANG CHỦ)
 */
export const AUTHOR_ANNOUNCEMENT: AuthorAnnouncement = {
  title: 'Thông báo từ Mặc Lâm',
  updatedAt: '26/11/2026',
  nextReleaseLabel: 'Chủ Nhật · 20:00 (29/11/2026)',
  nextReleaseTitle: 'Chương 4 (Arc 2): Hầm Mộ Đá Huyền Vũ',
  progressNote: 'Bản thảo Arc 2 đã hoàn thiện 60% · Đang vẽ minh họa nhân vật Tô Vãn',
  message:
    'Cảm ơn các bạn đã theo dõi những chương đầu tiên của Huyết Nguyệt Cố Đô. Từ Arc 2 trở đi, mỗi chương mới sẽ có thêm minh họa bối cảnh và mở đọc sớm 7 ngày cho Thành viên VIP trước khi phát hành miễn phí.',
};

/**
 * NGOẠI TRUYỆN & TÁC PHẨM MỞ RỘNG CÙNG VŨ TRỤ THẠCH UYÊN
 * (Loại bỏ chính truyện đang xem để tránh lặp lại, mỗi thẻ có dòng gợi ý riêng)
 */
export const RECOMMENDED_SERIES: RecommendedStory[] = [
  {
    id: 'series-ky-si-tro-tan',
    title: 'Ngoại Truyện: Đội Cận Vệ Tro Tàn',
    arcHint: 'Tiền truyện · 12 năm trước',
    genre: 'Kỵ Sĩ Hắc Ám',
    tags: ['Hầm mộ', 'Hành động', 'Cố đô'],
    weeklyReads: 21480,
    favorites: 1890,
    blurb: 'Đêm cuối cùng trước khi cổng Thạch Uyên đóng lại và lời thề của bảy kỵ sĩ khiên đầu sói.',
    defaultReason: 'Nên đọc sau Arc 1',
    linkedChapterId: 'arc-1-chuong-2',
    coverImage: '/src/assets/images/hero_blood_moon_citadel_1795755470351.jpg',
  },
  {
    id: 'series-hoi-luu-tru',
    title: 'Hồ Sơ Hội Lưu Trữ Sương Mù',
    arcHint: 'Ghi chép thế giới quan',
    genre: 'Huyền Bí Cổ Điển',
    tags: ['Bí ẩn', 'Arc 2', 'Tháp chuông', 'VIP Đọc trước'],
    weeklyReads: 16720,
    favorites: 1415,
    blurb: 'Những bản đồ hầm mộ, ký tự cổ và ghi chép mật được Tô Vãn mang theo vào Tháp Nhật Thực.',
    defaultReason: 'Bổ sung bối cảnh thế giới',
    linkedChapterId: 'arc-2-chuong-3',
    coverImage: '/src/assets/images/merch_hardcover_artbook_1795755469745.jpg',
  },
  {
    id: 'series-bien-ban-nhat-thuc',
    title: 'Biên Bản Đêm Nhật Thực Thứ Bảy',
    arcHint: 'Truyện ngắn · Học Viện Bắc Phố',
    genre: 'Kỳ Ảo Cổ Điển',
    tags: ['Khởi đầu', 'Kỳ ảo', 'Cố đô'],
    weeklyReads: 13290,
    favorites: 1120,
    blurb: 'Bức thư cuối cùng vị sư phụ để lại cho Trần Khắc trước khi ngọn đèn đồng đầu tiên được thắp lên.',
    defaultReason: 'Giải mã nguồn gốc chiếc đèn đồng',
    linkedChapterId: 'arc-1-chuong-1',
    coverImage: '/src/assets/images/merch_art_print_1795755469687.jpg',
  },
];

/**
 * BÌNH LUẬN MẪU BAN ĐẦU (để giao diện sinh động khi mới mở trang)
 */
export const INITIAL_COMMENTS: ChapterComment[] = [
  {
    id: 'cmt-seed-1',
    chapterId: 'arc-1-chuong-1',
    author: 'Minh Quân',
    content: 'Không khí Dark Fantasy mở đầu rất cuốn, đoạn đối thoại trước cổng Thạch Uyên đọc cực kỳ điện ảnh!',
    createdAt: '20/11/2026',
    likes: 18,
    isVipBadge: true,
  },
  {
    id: 'cmt-seed-2',
    chapterId: 'arc-1-chuong-1',
    author: 'Hạ Vy',
    content: 'Chế độ nền giấy vàng kết hợp cỡ chữ 18px đọc buổi tối êm mắt thật sự. Hóng chương mới của tác giả!',
    createdAt: '22/11/2026',
    likes: 11,
  },
  {
    id: 'cmt-seed-3',
    chapterId: 'arc-1-chuong-2',
    author: 'Khánh Đăng',
    content: 'Nhân vật Tô Vãn xuất hiện ngầu quá, tò mò về lời giao ước bị phá vỡ mười hai năm trước.',
    createdAt: '24/11/2026',
    likes: 14,
    isVipBadge: true,
  },
];
