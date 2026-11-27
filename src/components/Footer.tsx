import {SITE_CONFIG} from '../data/siteConfig';
import type {ViewRoute} from '../types';

interface FooterProps {
  onNavigate: (route: ViewRoute) => void;
}

export function Footer({onNavigate}: FooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#090B10] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="font-display text-base font-semibold text-[#E6E3DC]">
            {SITE_CONFIG.siteName}
          </p>
          <p className="text-xs text-[#8C8A84] mt-1">
            Tác giả {SITE_CONFIG.authorName} · {SITE_CONFIG.updateSchedule}
          </p>
        </div>

        <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center gap-6 text-xs text-[#9A9892]">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-[#E6E3DC] transition-colors cursor-pointer whitespace-nowrap"
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="hover:text-[#E6E3DC] transition-colors cursor-pointer whitespace-nowrap"
          >
            Mục lục chương
          </button>
          <button
            type="button"
            onClick={() => onNavigate('merch')}
            className="hover:text-[#E6E3DC] transition-colors cursor-pointer whitespace-nowrap"
          >
            Cửa hàng Merch
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="hover:text-[#E6E3DC] transition-colors cursor-pointer whitespace-nowrap"
          >
            Thư viện &amp; Đồng bộ
          </button>
        </nav>

        <p className="text-xs text-[#6E6D68]">
          © 2026 {SITE_CONFIG.authorName}. Bản quyền nội dung &amp; minh họa.
        </p>
      </div>
    </footer>
  );
}
