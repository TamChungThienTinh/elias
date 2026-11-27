import {useState} from 'react';
import {MERCH_ITEMS} from '../data/merch';
import type {MerchCategory, MerchItem, MerchStatus} from '../types';
import {
  filterMerchItems,
  formatVnd,
  getMerchStatusLabel,
} from '../utils/readerLogic';
import {SafeImage} from './SafeImage';

interface MerchViewProps {
  onSelectMerch: (item: MerchItem) => void;
}

const CATEGORY_TABS: Array<{id: MerchCategory | 'all'; label: string}> = [
  {id: 'all', label: 'Tất cả'},
  {id: 'standee', label: 'Standee'},
  {id: 'moc-khoa', label: 'Móc khóa'},
  {id: 'tranh-in', label: 'Tranh in'},
  {id: 'phu-kien', label: 'Phụ kiện'},
];

const STATUS_OPTIONS: Array<{id: MerchStatus | 'all'; label: string}> = [
  {id: 'all', label: 'Mọi trạng thái'},
  {id: 'con-hang', label: 'Còn hàng'},
  {id: 'pre-order', label: 'Pre-order'},
  {id: 'het-hang', label: 'Hết hàng'},
];

export function MerchView({onSelectMerch}: MerchViewProps) {
  const [category, setCategory] = useState<MerchCategory | 'all'>('all');
  const [status, setStatus] = useState<MerchStatus | 'all'>('all');

  const items = filterMerchItems(MERCH_ITEMS, category, status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#C69B53]">Cửa hàng chính hãng</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F5F1E8] mt-1">
            Bộ sưu tập Merch Huyết Nguyệt
          </h1>
          <p className="text-sm text-[#9A9892] mt-2 leading-relaxed">
            Standee acrylic, móc khóa kim loại tráng men, tranh in mỹ thuật và artbook phát hành giới hạn. Bấm vào từng sản phẩm để xem ảnh lớn và đặt mua qua Shopee, Zalo hoặc Google Form.
          </p>
        </div>

        <p className="text-xs text-[#8E8C86] tabular-nums whitespace-nowrap">
          Đang hiển thị {items.length} / {MERCH_ITEMS.length} sản phẩm
        </p>
      </div>

      {/* Category & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Danh mục merch"
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#13161F] border border-white/[0.08]"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              onClick={() => setCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                category === tab.id
                  ? 'bg-[#C69B53] text-[#0B0D12]'
                  : 'text-[#9A9892] hover:text-[#E6E3DC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9A9892]">
          <label htmlFor="merch-status-filter" className="whitespace-nowrap">
            Trạng thái:
          </label>
          <select
            id="merch-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as MerchStatus | 'all')}
            className="px-3 py-1.5 rounded-md bg-[#13161F] border border-white/[0.1] text-[#E6E3DC] text-xs focus:outline-none focus:border-[#C69B53]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {items.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-white/[0.08] bg-[#13161F] space-y-3">
          <p className="text-sm text-[#C9C5BC]">
            Không có sản phẩm nào khớp với bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setStatus('all');
            }}
            className="px-4 py-2 rounded-md border border-white/[0.12] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {items.map((item) => {
            const statusText = getMerchStatusLabel(item.status);
            const statusClass =
              item.status === 'con-hang'
                ? 'text-[#7EC49A]'
                : item.status === 'pre-order'
                ? 'text-[#D8AE68]'
                : 'text-[#D47A7A]';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMerch(item)}
                className="group text-left bg-[#13161F] border border-white/[0.08] hover:border-[#C69B53]/50 rounded-lg overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
              >
                <div className="relative w-full aspect-[4/3] bg-[#0D1017] overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                      item.status === 'het-hang' ? 'opacity-65' : ''
                    }`}
                  />
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#9A9892]">
                      <span>{item.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-medium ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <h2 className="font-ui text-base font-semibold text-[#F1ECE1] group-hover:text-[#C69B53] transition-colors leading-snug">
                      {item.name}
                    </h2>
                    <p className="text-xs text-[#8E8C86] line-clamp-2 leading-relaxed">
                      {item.dimensions}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                    <span className="text-[15px] font-semibold text-[#C69B53] tabular-nums">
                      {formatVnd(item.priceVnd)}
                    </span>
                    <span className="text-xs font-medium text-[#C9C5BC] group-hover:text-[#C69B53] transition-colors">
                      {item.status === 'het-hang' ? 'Xem thông tin' : 'Đặt mua'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
