import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateReadingProgressPercent,
  calculateReadingTimeMinutes,
  decodeSyncCode,
  encodeSyncCode,
  filterChaptersByQuery,
  filterMerchItems,
  formatVnd,
  getPersonalizedRecommendations,
  paginateParagraphs,
  sortChapters,
  validateCommentInput,
  validateVipForm,
} from './readerLogic';
import {CHAPTERS} from '../data/chapters';
import {MERCH_ITEMS} from '../data/merch';
import {SITE_CONFIG} from '../data/siteConfig';
import type {
  AppBackupPayload,
  Chapter,
  MerchItem,
  RecommendedStory,
} from '../types';

const SAMPLE_CHAPTERS_FIXTURE: Chapter[] = [
  {
    id: 'arc-1-chuong-1',
    arcId: 'arc-1',
    number: 1,
    title: 'Bình Minh Trên Bến Cảng',
    publishedAt: '01/11/2026',
    views: 1500,
    likes: 120,
    tags: ['Giả tưởng', 'Phiêu lưu'],
    paragraphs: [
      'Đoạn văn mở đầu dài vừa đủ để kiểm thử chia trang và tính số từ chính xác cho độc giả trên mọi thiết bị đọc truyện trực tuyến hiện đại.',
      'Đoạn văn thứ hai tiếp nối câu chuyện với những chi tiết miêu tả không gian, thời tiết và tâm trạng của nhân vật khi bắt đầu hành trình.',
      'Đoạn văn thứ ba hoàn thiện phân đoạn mở màn để đảm bảo hàm phân trang luôn giữ nguyên toàn bộ nội dung không thất lạc bất kỳ câu chữ nào.',
    ],
  },
  {
    id: 'arc-1-chuong-2',
    arcId: 'arc-1',
    number: 2,
    title: 'Bí Ẩn Thư Viện Cổ',
    publishedAt: '08/11/2026',
    views: 2100,
    likes: 185,
    tags: ['Bí ẩn', 'Giả tưởng'],
    paragraphs: ['Nội dung chương hai dành cho kiểm thử sắp xếp và tìm kiếm.'],
  },
  {
    id: 'arc-2-chuong-3',
    arcId: 'arc-2',
    number: 3,
    title: 'Lời Hứa Dưới Trăng',
    publishedAt: '15/11/2026',
    views: 950,
    likes: 90,
    tags: ['Bí ẩn', 'Kịch tính'],
    isVipEarlyAccess: true,
    paragraphs: ['Nội dung chương ba dành cho kiểm thử đề xuất theo thẻ.'],
  },
];

const SAMPLE_MERCH_FIXTURE: MerchItem[] = [
  {
    id: 'fixture-standee-1',
    name: 'Standee Mẫu A',
    category: 'standee',
    categoryLabel: 'Standee',
    priceVnd: 185000,
    status: 'con-hang',
    featured: true,
    image: '',
    dimensions: '16cm',
    material: 'Acrylic',
    releaseNote: 'Đợt 1',
    description: 'Mô tả mẫu A',
    orderLinks: {shopee: 'https://shopee.vn', zalo: 'https://zalo.me', googleForm: 'https://docs.google.com'},
  },
  {
    id: 'fixture-keychain-2',
    name: 'Móc khóa Mẫu B',
    category: 'moc-khoa',
    categoryLabel: 'Móc khóa',
    priceVnd: 125000,
    status: 'pre-order',
    featured: true,
    image: '',
    dimensions: '6cm',
    material: 'Kim loại',
    releaseNote: 'Đặt trước',
    description: 'Mô tả mẫu B',
    orderLinks: {shopee: 'https://shopee.vn', zalo: 'https://zalo.me', googleForm: 'https://docs.google.com'},
  },
  {
    id: 'fixture-print-3',
    name: 'Tranh in Mẫu C',
    category: 'tranh-in',
    categoryLabel: 'Tranh in',
    priceVnd: 240000,
    status: 'con-hang',
    featured: false,
    image: '',
    dimensions: 'A3',
    material: 'Giấy mỹ thuật',
    releaseNote: 'Đợt 1',
    description: 'Mô tả mẫu C',
    orderLinks: {shopee: 'https://shopee.vn', zalo: 'https://zalo.me', googleForm: 'https://docs.google.com'},
  },
  {
    id: 'fixture-soldout-4',
    name: 'Ấn bản Giới hạn D',
    category: 'tranh-in',
    categoryLabel: 'Tranh in',
    priceVnd: 450000,
    status: 'het-hang',
    featured: false,
    image: '',
    dimensions: 'Boxset',
    material: 'Bìa cứng',
    releaseNote: 'Hết hàng',
    description: 'Mô tả mẫu D',
    orderLinks: {shopee: 'https://shopee.vn', zalo: 'https://zalo.me', googleForm: 'https://docs.google.com'},
  },
];

const SAMPLE_SERIES_FIXTURE: RecommendedStory[] = [
  {
    id: 'series-1',
    title: 'Ngoại Truyện A',
    arcHint: 'Ngoại truyện',
    genre: 'Giả tưởng',
    tags: ['Giả tưởng'],
    weeklyReads: 100,
    favorites: 20,
    blurb: 'Mô tả ngắn A',
    defaultReason: 'Gợi ý 1',
    linkedChapterId: 'arc-1-chuong-1',
    coverImage: '',
  },
  {
    id: 'series-2',
    title: 'Hồ Sơ Thế Giới B',
    arcHint: 'Hồ sơ',
    genre: 'Bí ẩn',
    tags: ['Bí ẩn', 'Kịch tính'],
    weeklyReads: 120,
    favorites: 30,
    blurb: 'Mô tả ngắn B',
    defaultReason: 'Gợi ý 2',
    linkedChapterId: 'arc-1-chuong-2',
    coverImage: '',
  },
  {
    id: 'series-3',
    title: 'Tiền Truyện C',
    arcHint: 'Tiền truyện',
    genre: 'Phiêu lưu',
    tags: ['Phiêu lưu'],
    weeklyReads: 90,
    favorites: 15,
    blurb: 'Mô tả ngắn C',
    defaultReason: 'Gợi ý 3',
    linkedChapterId: 'arc-1-chuong-1',
    coverImage: '',
  },
];

test('SITE_CONFIG provides clean template defaults with 1 arc, 1 chapter, 3 merch slots, and empty placeholder images', () => {
  assert.equal(SITE_CONFIG.siteName, '[Tên web / Thương hiệu]');
  assert.equal(SITE_CONFIG.storyTitle, '[Tên tác phẩm của bạn]');
  assert.equal(SITE_CONFIG.coverImage, '');
  assert.equal(SITE_CONFIG.arcs.length, 1);
  assert.equal(CHAPTERS.length, 1);
  assert.equal(CHAPTERS[0].id, 'arc-1-chuong-1');
  assert.equal(MERCH_ITEMS.length, 3);
  assert.ok(MERCH_ITEMS.every((m) => m.image === '' && m.priceDisplay === '0 đ'));
  assert.equal(typeof SITE_CONFIG.showRelatedSection, 'boolean');
  assert.equal(SITE_CONFIG.authorNoticeTitle, 'Thông báo của tác giả');
});

test('formatVnd formats Vietnamese currency with dot separators', () => {
  assert.equal(formatVnd(185000), '185.000 ₫');
  assert.equal(formatVnd(1250000), '1.250.000 ₫');
  assert.equal(formatVnd(0), '0 ₫');
});

test('paginateParagraphs preserves every paragraph without loss', () => {
  const sample = SAMPLE_CHAPTERS_FIXTURE[0].paragraphs;
  const pages = paginateParagraphs(sample, 140);
  assert.ok(pages.length >= 2, 'Expected long sample paragraphs to split into multiple pages');
  const flattened = pages.flat();
  assert.deepEqual(flattened, sample);
});

test('calculateReadingTimeMinutes computes positive reading time', () => {
  const mins = calculateReadingTimeMinutes(SAMPLE_CHAPTERS_FIXTURE[0].paragraphs);
  assert.ok(mins >= 1 && mins <= 10);
});

test('calculateReadingProgressPercent computes scroll and paged percentages accurately', () => {
  assert.equal(
    calculateReadingProgressPercent({
      mode: 'scroll',
      scrollOffset: 0,
      scrollableDistance: 1000,
      pageIndex: 0,
      totalPages: 4,
    }),
    0
  );
  assert.equal(
    calculateReadingProgressPercent({
      mode: 'scroll',
      scrollOffset: 500,
      scrollableDistance: 1000,
      pageIndex: 0,
      totalPages: 4,
    }),
    50
  );
  assert.equal(
    calculateReadingProgressPercent({
      mode: 'scroll',
      scrollOffset: 1300,
      scrollableDistance: 1000,
      pageIndex: 0,
      totalPages: 4,
    }),
    100
  );
  assert.equal(
    calculateReadingProgressPercent({
      mode: 'paged',
      scrollOffset: 0,
      scrollableDistance: 0,
      pageIndex: 1,
      totalPages: 4,
    }),
    50
  );
});

test('encodeSyncCode and decodeSyncCode round-trip Vietnamese Unicode payload', () => {
  const payload: AppBackupPayload = {
    version: 1,
    exportedAt: '2026-11-26T10:00:00.000Z',
    profile: {
      displayName: 'Độc giả mẫu',
      email: 'docgia@example.vn',
      isVip: true,
      vipPlan: 'VIP Quý',
      notificationsEnabled: true,
      autoBackupEnabled: true,
    },
    settings: {
      theme: 'sepia',
      fontSize: 19,
      lineHeight: 1.85,
      fontFamily: 'lora',
      readingMode: 'paged',
    },
    progress: {
      chapterId: 'arc-1-chuong-1',
      scrollPercent: 64,
      pageIndex: 2,
      updatedAt: '2026-11-26T10:00:00.000Z',
    },
    readHistory: ['arc-1-chuong-1'],
    favorites: ['arc-1-chuong-1'],
    offlineChapters: [{chapterId: 'arc-1-chuong-1', savedAt: '26/11/2026', sizeKb: 8}],
    comments: [
      {
        id: 'c1',
        chapterId: 'arc-1-chuong-1',
        author: 'Độc giả A',
        content: 'Chương mở đầu rất ấn tượng!',
        createdAt: '26/11/2026',
        likes: 3,
      },
    ],
  };

  const encoded = encodeSyncCode(payload);
  assert.ok(encoded.startsWith('HNCD1:'));
  const decoded = decodeSyncCode(encoded);
  assert.deepEqual(decoded, payload);
  assert.equal(decodeSyncCode('INVALID_CODE'), null);
});

test('filterMerchItems filters by category, status, and keyword', () => {
  const inStock = filterMerchItems(SAMPLE_MERCH_FIXTURE, 'all', 'con-hang');
  assert.equal(inStock.length, 2);
  assert.ok(inStock.every((m) => m.status === 'con-hang'));

  const preOrderKeychain = filterMerchItems(SAMPLE_MERCH_FIXTURE, 'moc-khoa', 'pre-order');
  assert.equal(preOrderKeychain.length, 1);
  assert.equal(preOrderKeychain[0].id, 'fixture-keychain-2');

  const outOfStock = filterMerchItems(SAMPLE_MERCH_FIXTURE, 'all', 'het-hang');
  assert.equal(outOfStock.length, 1);
});

test('sortChapters orders by views and chapter number accurately', () => {
  const byViews = sortChapters(SAMPLE_CHAPTERS_FIXTURE, 'views', []);
  assert.ok(byViews[0].views >= byViews[1].views);

  const byOrder = sortChapters(SAMPLE_CHAPTERS_FIXTURE, 'order', []);
  assert.equal(byOrder[0].number, 1);
  assert.equal(byOrder[1].number, 2);
});

test('getPersonalizedRecommendations ranks series matching favorite chapter tags and uses distinct default reasons', () => {
  const defaultRecs = getPersonalizedRecommendations(
    SAMPLE_SERIES_FIXTURE,
    [],
    [],
    SAMPLE_CHAPTERS_FIXTURE
  );
  assert.equal(defaultRecs.length, 3);
  const uniqueReasons = new Set(defaultRecs.map((r) => r.matchReason));
  assert.equal(uniqueReasons.size, 3);

  const recs = getPersonalizedRecommendations(
    SAMPLE_SERIES_FIXTURE,
    ['arc-2-chuong-3'],
    ['arc-2-chuong-3'],
    SAMPLE_CHAPTERS_FIXTURE
  );
  assert.equal(recs[0].id, 'series-2');
  assert.ok(recs[0].matchReason.includes('Khớp gu'));
});

test('filterChaptersByQuery matches chapter numbers and Vietnamese titles without diacritics', () => {
  assert.equal(
    filterChaptersByQuery(SAMPLE_CHAPTERS_FIXTURE, '').length,
    SAMPLE_CHAPTERS_FIXTURE.length
  );
  assert.equal(filterChaptersByQuery(SAMPLE_CHAPTERS_FIXTURE, '2').length, 1);
  const byTitleNoAccent = filterChaptersByQuery(SAMPLE_CHAPTERS_FIXTURE, 'thu vien co');
  assert.equal(byTitleNoAccent.length, 1);
  assert.equal(byTitleNoAccent[0].id, 'arc-1-chuong-2');
});

test('calculateCartTotals computes total quantity and VND price excluding out-of-stock items', () => {
  const totals = calculateCartTotals(
    [
      {merchId: 'fixture-standee-1', quantity: 2},
      {merchId: 'fixture-keychain-2', quantity: 1},
      {merchId: 'fixture-soldout-4', quantity: 3}, // het-hang -> ignored
    ],
    SAMPLE_MERCH_FIXTURE
  );
  assert.equal(totals.totalQuantity, 3);
  assert.equal(totals.totalPriceVnd, 185000 * 2 + 125000);
});

test('validateCommentInput and validateVipForm reject empty or invalid inputs', () => {
  assert.equal(validateCommentInput('', 'Hay quá').valid, false);
  assert.equal(validateCommentInput('An', 'Ok').valid, false);
  assert.equal(validateCommentInput('Độc giả A', 'Cốt truyện rất lôi cuốn!').valid, true);

  assert.equal(validateVipForm('A', 'test@gmail.com').valid, false);
  assert.equal(validateVipForm('Nguyễn An', 'khong-hop-le').valid, false);
  assert.equal(validateVipForm('Nguyễn An', '0912345678').valid, true);
  assert.equal(validateVipForm('Nguyễn An', 'an@example.com').valid, true);
});

test('VIP access checks respect expiry timestamps and automatic public_date unlock', async () => {
  const {
    isUserVipActive,
    isChapterShowingVipLabel,
    isChapterVipCurrentlyLocked,
    getPublicUnlockCountdownText,
    formatVipMembershipSummary,
  } = await import('./readerLogic');

  const now = new Date('2026-11-26T12:00:00Z');
  const futureDate = '2026-12-03T13:00:00Z';
  const pastDate = '2026-11-20T12:00:00Z';

  assert.equal(isUserVipActive(false, null, now), false);
  assert.equal(isUserVipActive(true, null, now), true);
  assert.equal(isUserVipActive(true, futureDate, now), true);
  assert.equal(isUserVipActive(true, pastDate, now), false);

  assert.equal(
    isChapterShowingVipLabel({isVipEarlyAccess: true, publicDate: futureDate}, now),
    true
  );
  assert.equal(
    isChapterShowingVipLabel({isVipEarlyAccess: true, publicDate: pastDate}, now),
    false
  );
  assert.equal(
    isChapterVipCurrentlyLocked({isVipEarlyAccess: true, publicDate: futureDate}, false, now),
    true
  );
  assert.equal(
    isChapterVipCurrentlyLocked({isVipEarlyAccess: true, publicDate: futureDate}, true, now),
    false
  );
  assert.equal(
    isChapterVipCurrentlyLocked({isVipEarlyAccess: true, publicDate: pastDate}, false, now),
    false
  );

  const countdown = getPublicUnlockCountdownText(futureDate, '03/12/2026', now);
  assert.ok(countdown.includes('03/12/2026'));
  assert.ok(countdown.includes('ngày nữa'));

  const lifetimeSummary = formatVipMembershipSummary(true, null, now);
  assert.equal(lifetimeSummary.active, true);
  assert.ok(lifetimeSummary.expiryLabel.includes('Vĩnh viễn'));
});

test('buildVipTransferNote and buildVietQrUrl generate valid encoded VietQR URLs', async () => {
  const {buildVipTransferNote, buildVietQrUrl} = await import('./readerLogic');

  assert.equal(buildVipTransferNote('3THANG', null), 'VIP 3THANG');
  assert.equal(
    buildVipTransferNote('1THANG', 'docgia@gmail.com'),
    'VIP 1THANG docgia@gmail.com'
  );

  const url = buildVietQrUrl({
    bankCode: 'MB',
    accountNumber: '0123456789',
    accountName: 'NGUYEN VAN A',
    amount: 79000,
    transferNote: 'VIP 3THANG docgia@gmail.com',
  });
  assert.equal(
    url,
    'https://img.vietqr.io/image/MB-0123456789-qr_only.png?amount=79000&addInfo=VIP%203THANG%20docgia%40gmail.com&accountName=NGUYEN%20VAN%20A'
  );
});

test('canUseOfflineDownload and shouldPurgeOfflineStorage enforce active VIP and trigger purge on expiry', async () => {
  const {canUseOfflineDownload, shouldPurgeOfflineStorage} = await import('./readerLogic');
  const now = new Date('2026-11-26T12:00:00Z');
  const futureExpiry = '2026-12-26T12:00:00Z';
  const expiredDate = '2026-11-25T12:00:00Z';

  assert.equal(canUseOfflineDownload(false, null, now), false);
  assert.equal(shouldPurgeOfflineStorage(false, null, 2, now), true);
  assert.equal(shouldPurgeOfflineStorage(false, null, 0, now), false);

  assert.equal(canUseOfflineDownload(true, expiredDate, now), false);
  assert.equal(shouldPurgeOfflineStorage(true, expiredDate, 1, now), true);

  assert.equal(canUseOfflineDownload(true, futureExpiry, now), true);
  assert.equal(shouldPurgeOfflineStorage(true, futureExpiry, 3, now), false);
  assert.equal(canUseOfflineDownload(true, null, now), true);
  assert.equal(shouldPurgeOfflineStorage(true, null, 3, now), false);
});

test('History API clean routing builds and parses /muc-luc, /thu-vien, /cua-hang, /chuong/1 and upgrades legacy hashes', async () => {
  const {buildRoutePath, parsePathnameRoute} = await import('./routing');

  assert.equal(buildRoutePath('home'), '/');
  assert.equal(buildRoutePath('catalog'), '/muc-luc');
  assert.equal(buildRoutePath('merch'), '/cua-hang');
  assert.equal(buildRoutePath('library'), '/thu-vien');
  assert.equal(buildRoutePath('reader', 'arc-1-chuong-1'), '/chuong/1');

  assert.deepEqual(parsePathnameRoute('/'), {route: 'home'});
  assert.deepEqual(parsePathnameRoute('/muc-luc'), {route: 'catalog'});
  assert.deepEqual(parsePathnameRoute('/muc-luc/'), {route: 'catalog'});
  assert.deepEqual(parsePathnameRoute('/thu-vien'), {route: 'library'});
  assert.deepEqual(parsePathnameRoute('/cua-hang'), {route: 'merch'});
  assert.deepEqual(parsePathnameRoute('/chuong/1'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-1',
  });
  assert.deepEqual(parsePathnameRoute('/chuong/arc-1-chuong-1'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-1',
  });
  assert.deepEqual(parsePathnameRoute('/khong-ton-tai'), {route: 'home'});

  assert.deepEqual(parsePathnameRoute('/', '#/doc/arc-1-chuong-1'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-1',
    shouldReplaceCleanPath: '/chuong/1',
  });
  assert.deepEqual(parsePathnameRoute('/', '#/thu-vien'), {
    route: 'library',
    shouldReplaceCleanPath: '/thu-vien',
  });
});

test('countParagraphWords, getChapterReadingStats, and buildChapterReadingStatsMap compute exact reading time from actual chapter words', async () => {
  const {
    countParagraphWords,
    getChapterReadingStats,
    buildChapterReadingStatsMap,
    calculateTotalReadingMinutes,
  } = await import('./readerLogic');

  assert.equal(countParagraphWords(['Đoạn mở đầu — kiểm thử đếm từ.', '']), 7);

  const words440 = Array.from({length: 440}, () => 'chương').join(' ');
  const stats = getChapterReadingStats([words440]);
  assert.equal(stats.wordCount, 440);
  assert.equal(stats.minutes, 2);
  assert.equal(stats.label, '2 phút đọc');

  const statsMap = buildChapterReadingStatsMap(SAMPLE_CHAPTERS_FIXTURE);
  for (const ch of SAMPLE_CHAPTERS_FIXTURE) {
    assert.equal(statsMap[ch.id].label, `${statsMap[ch.id].minutes} phút đọc`);
    assert.ok(statsMap[ch.id].wordCount > 0);
  }

  const total = calculateTotalReadingMinutes(SAMPLE_CHAPTERS_FIXTURE);
  const manualSum = SAMPLE_CHAPTERS_FIXTURE.reduce(
    (acc, ch) => acc + statsMap[ch.id].minutes,
    0
  );
  assert.equal(total, manualSum);
});

test('calculateRemainingReadingTime decreases remaining minutes smoothly with scroll progress', async () => {
  const {calculateRemainingReadingTime} = await import('./readerLogic');

  assert.deepEqual(calculateRemainingReadingTime(660, 0), {
    remainingMinutes: 3,
    label: 'Còn 3 phút đọc',
  });
  assert.deepEqual(calculateRemainingReadingTime(660, 40), {
    remainingMinutes: 2,
    label: 'Còn 2 phút đọc',
  });
  assert.deepEqual(calculateRemainingReadingTime(660, 75), {
    remainingMinutes: 1,
    label: 'Còn 1 phút đọc',
  });
  assert.deepEqual(calculateRemainingReadingTime(660, 99), {
    remainingMinutes: 0,
    label: 'Đã đọc xong',
  });
});
