import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadingTimeMinutes,
  decodeSyncCode,
  encodeSyncCode,
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

test('getPersonalizedRecommendations ranks series matching favorite chapter tags', () => {
  const recs = getPersonalizedRecommendations(
    RECOMMENDED_SERIES,
    ['arc-2-chuong-3'],
    ['arc-2-chuong-3'],
    CHAPTERS
  );
  assert.equal(recs.length, RECOMMENDED_SERIES.length);
  assert.equal(recs[0].id, 'series-hoi-luu-tru');
  assert.ok(recs[0].matchReason.includes('Phù hợp'));
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
