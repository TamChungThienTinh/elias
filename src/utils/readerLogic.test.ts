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
import {CHAPTERS, RECOMMENDED_SERIES} from '../data/chapters';
import {MERCH_ITEMS} from '../data/merch';
import type {AppBackupPayload} from '../types';

test('formatVnd formats Vietnamese currency with dot separators', () => {
  assert.equal(formatVnd(185000), '185.000 ₫');
  assert.equal(formatVnd(1250000), '1.250.000 ₫');
  assert.equal(formatVnd(0), '0 ₫');
});

test('paginateParagraphs preserves every paragraph without loss', () => {
  const sample = CHAPTERS[0].paragraphs;
  const pages = paginateParagraphs(sample, 650);
  assert.ok(pages.length >= 2, 'Expected chapter 1 to split into multiple pages');
  const flattened = pages.flat();
  assert.deepEqual(flattened, sample);
});

test('calculateReadingTimeMinutes computes positive reading time', () => {
  const mins = calculateReadingTimeMinutes(CHAPTERS[0].paragraphs);
  assert.ok(mins >= 2 && mins <= 10);
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
      displayName: 'Nguyễn Minh Quân',
      email: 'quan@example.vn',
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
      chapterId: 'arc-1-chuong-2',
      scrollPercent: 64,
      pageIndex: 2,
      updatedAt: '2026-11-26T10:00:00.000Z',
    },
    readHistory: ['arc-1-chuong-1', 'arc-1-chuong-2'],
    favorites: ['arc-1-chuong-1'],
    offlineChapters: [{chapterId: 'arc-1-chuong-1', savedAt: '26/11/2026', sizeKb: 8}],
    comments: [
      {
        id: 'c1',
        chapterId: 'arc-1-chuong-1',
        author: 'Trần Thảo',
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
  const inStock = filterMerchItems(MERCH_ITEMS, 'all', 'con-hang');
  assert.ok(inStock.length >= 2);
  assert.ok(inStock.every((m) => m.status === 'con-hang'));

  const preOrderKeychain = filterMerchItems(MERCH_ITEMS, 'moc-khoa', 'pre-order');
  assert.equal(preOrderKeychain.length, 1);
  assert.equal(preOrderKeychain[0].id, 'merch-moc-khoa-den-long');

  const outOfStock = filterMerchItems(MERCH_ITEMS, 'all', 'het-hang');
  assert.equal(outOfStock.length, 1);
});

test('sortChapters orders by views and likes accurately', () => {
  const byViews = sortChapters(CHAPTERS, 'views', []);
  assert.ok(byViews[0].views >= byViews[1].views);

  const byOrder = sortChapters(CHAPTERS, 'order', []);
  assert.equal(byOrder[0].number, 1);
  assert.equal(byOrder[1].number, 2);
});

test('getPersonalizedRecommendations ranks series matching favorite chapter tags and uses distinct default reasons', () => {
  const defaultRecs = getPersonalizedRecommendations(
    RECOMMENDED_SERIES,
    [],
    [],
    CHAPTERS
  );
  assert.equal(defaultRecs.length, 3);
  const uniqueReasons = new Set(defaultRecs.map((r) => r.matchReason));
  assert.equal(uniqueReasons.size, 3);
  assert.ok(!defaultRecs.some((r) => r.title === 'Huyết Nguyệt Cố Đô'));

  const recs = getPersonalizedRecommendations(
    RECOMMENDED_SERIES,
    ['arc-2-chuong-3'],
    ['arc-2-chuong-3'],
    CHAPTERS
  );
  assert.equal(recs[0].id, 'series-hoi-luu-tru');
  assert.ok(recs[0].matchReason.includes('Khớp gu'));
});

test('filterChaptersByQuery matches chapter numbers and Vietnamese titles without diacritics', () => {
  assert.equal(filterChaptersByQuery(CHAPTERS, '').length, CHAPTERS.length);
  assert.equal(filterChaptersByQuery(CHAPTERS, '2').length, 2); // Chương 2 + Arc 2 tag
  const byTitleNoAccent = filterChaptersByQuery(CHAPTERS, 'thap nhat thuc');
  assert.equal(byTitleNoAccent.length, 1);
  assert.equal(byTitleNoAccent[0].id, 'arc-1-chuong-2');
});

test('calculateCartTotals computes total quantity and VND price excluding out-of-stock items', () => {
  const totals = calculateCartTotals(
    [
      {merchId: 'merch-standee-ke-gac-den', quantity: 2},
      {merchId: 'merch-moc-khoa-den-long', quantity: 1},
      {merchId: 'merch-tranh-vai-thanh-quach', quantity: 3}, // het-hang -> ignored
    ],
    MERCH_ITEMS
  );
  assert.equal(totals.totalQuantity, 3);
  assert.equal(totals.totalPriceVnd, 185000 * 2 + 125000);
});

test('validateCommentInput and validateVipForm reject empty or invalid inputs', () => {
  assert.equal(validateCommentInput('', 'Hay quá').valid, false);
  assert.equal(validateCommentInput('An', 'Ok').valid, false);
  assert.equal(validateCommentInput('Minh Anh', 'Cốt truyện rất lôi cuốn!').valid, true);

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

  // User VIP active / expired / lifetime
  assert.equal(isUserVipActive(false, null, now), false);
  assert.equal(isUserVipActive(true, null, now), true);
  assert.equal(isUserVipActive(true, futureDate, now), true);
  assert.equal(isUserVipActive(true, pastDate, now), false);

  // Chapter VIP label & lock auto-unlock when now >= public_date
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
    accountName: 'NGUYEN MAC LAM',
    amount: 79000,
    transferNote: 'VIP 3THANG docgia@gmail.com',
  });
  assert.equal(
    url,
    'https://img.vietqr.io/image/MB-0123456789-qr_only.png?amount=79000&addInfo=VIP%203THANG%20docgia%40gmail.com&accountName=NGUYEN%20MAC%20LAM'
  );
});

test('canUseOfflineDownload and shouldPurgeOfflineStorage enforce active VIP and trigger purge on expiry', async () => {
  const {canUseOfflineDownload, shouldPurgeOfflineStorage} = await import('./readerLogic');
  const now = new Date('2026-11-26T12:00:00Z');
  const futureExpiry = '2026-12-26T12:00:00Z';
  const expiredDate = '2026-11-25T12:00:00Z';

  // Non-VIP / Guest
  assert.equal(canUseOfflineDownload(false, null, now), false);
  assert.equal(shouldPurgeOfflineStorage(false, null, 2, now), true);
  assert.equal(shouldPurgeOfflineStorage(false, null, 0, now), false);

  // Expired VIP
  assert.equal(canUseOfflineDownload(true, expiredDate, now), false);
  assert.equal(shouldPurgeOfflineStorage(true, expiredDate, 1, now), true);

  // Active VIP (with future expiry) & Lifetime VIP (null expiry)
  assert.equal(canUseOfflineDownload(true, futureExpiry, now), true);
  assert.equal(shouldPurgeOfflineStorage(true, futureExpiry, 3, now), false);
  assert.equal(canUseOfflineDownload(true, null, now), true);
  assert.equal(shouldPurgeOfflineStorage(true, null, 3, now), false);
});

test('History API clean routing builds and parses /muc-luc, /thu-vien, /cua-hang, /chuong/1 and upgrades legacy hashes', async () => {
  const {buildRoutePath, parsePathnameRoute} = await import('./routing');

  // Clean URL building (no #/ anywhere)
  assert.equal(buildRoutePath('home'), '/');
  assert.equal(buildRoutePath('catalog'), '/muc-luc');
  assert.equal(buildRoutePath('merch'), '/cua-hang');
  assert.equal(buildRoutePath('library'), '/thu-vien');
  assert.equal(buildRoutePath('reader', 'arc-1-chuong-1'), '/chuong/1');
  assert.equal(buildRoutePath('reader', 'arc-1-chuong-2'), '/chuong/2');
  assert.equal(buildRoutePath('reader', 'arc-2-chuong-3'), '/chuong/3');

  // Clean pathname parsing
  assert.deepEqual(parsePathnameRoute('/'), {route: 'home'});
  assert.deepEqual(parsePathnameRoute('/muc-luc'), {route: 'catalog'});
  assert.deepEqual(parsePathnameRoute('/muc-luc/'), {route: 'catalog'});
  assert.deepEqual(parsePathnameRoute('/thu-vien'), {route: 'library'});
  assert.deepEqual(parsePathnameRoute('/cua-hang'), {route: 'merch'});
  assert.deepEqual(parsePathnameRoute('/chuong/1'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-1',
  });
  assert.deepEqual(parsePathnameRoute('/chuong/3'), {
    route: 'reader',
    chapterId: 'arc-2-chuong-3',
  });
  assert.deepEqual(parsePathnameRoute('/chuong/arc-1-chuong-2'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-2',
  });
  assert.deepEqual(parsePathnameRoute('/khong-ton-tai'), {route: 'home'});

  // Legacy hash bookmark auto-upgrade to clean History API URL
  assert.deepEqual(parsePathnameRoute('/', '#/doc/arc-1-chuong-2'), {
    route: 'reader',
    chapterId: 'arc-1-chuong-2',
    shouldReplaceCleanPath: '/chuong/2',
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

  // Punctuation-only tokens like "—" are excluded from word count
  assert.equal(countParagraphWords(['Trần Khắc — người gác đèn cố đô.', '']), 7);

  // 440 words at 220 wpm => exactly 2 minutes with label '2 phút đọc'
  const words440 = Array.from({length: 440}, () => 'chương').join(' ');
  const stats = getChapterReadingStats([words440]);
  assert.equal(stats.wordCount, 440);
  assert.equal(stats.minutes, 2);
  assert.equal(stats.label, '2 phút đọc');

  // Map helper produces matching actual stats for all chapters
  const statsMap = buildChapterReadingStatsMap(CHAPTERS);
  for (const ch of CHAPTERS) {
    assert.equal(statsMap[ch.id].label, `${statsMap[ch.id].minutes} phút đọc`);
    assert.ok(statsMap[ch.id].wordCount > 100);
  }

  // Total reading time across all sample chapters is sum of individual chapters
  const total = calculateTotalReadingMinutes(CHAPTERS);
  const manualSum = CHAPTERS.reduce(
    (acc, ch) => acc + statsMap[ch.id].minutes,
    0
  );
  assert.equal(total, manualSum);
});

test('calculateRemainingReadingTime decreases remaining minutes smoothly with scroll progress', async () => {
  const {calculateRemainingReadingTime} = await import('./readerLogic');

  // 660 words at 220 wpm => 3 minutes total
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


