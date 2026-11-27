import {useState} from 'react';
import {Menu, X} from 'lucide-react';
import type {ReadingProgress, ViewRoute} from '../types';

interface HeaderProps {
  currentRoute: ViewRoute;
  progress: ReadingProgress | null;
  onNavigate: (route: ViewRoute) => void;
  onPrimaryReadClick: () => void;
}

const NAV_ITEMS: Array<{route: ViewRoute; label: string}> = [
  {route: 'home', label: 'Trang chủ'},
  {route: 'catalog', label: 'Mục lục'},
  {route: 'merch', label: 'Cửa hàng'},
  {route: 'library', label: 'Thư viện'},
];

export function Header({
  currentRoute,
  progress,
  onNavigate,
  onPrimaryReadClick,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: ViewRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  const primaryLabel = progress ? 'Đọc tiếp' : 'Đọc từ đầu';

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0B0D12]/92 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line display wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('home');
          }}
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#F1ECE1] hover:text-[#C69B53] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53] rounded-sm"
        >
          Huyết Nguyệt
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              currentRoute === item.route ||
              (currentRoute === 'reader' && item.route === 'catalog');
            return (
              <a
                key={item.route}
                href={`#/${item.route === 'home' ? '' : item.route}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.route);
                }}
                aria-current={active ? 'page' : undefined}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53] rounded-sm ${
                  active
                    ? 'text-[#F1ECE1]'
                    : 'text-[#9A9892] hover:text-[#E6E3DC]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[21px] h-[2px] bg-[#C69B53]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA (plus mobile menu button on small viewports) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrimaryReadClick}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#0B0D12] bg-[#C69B53] hover:bg-[#D8AE68] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6E3DC]"
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-[#E6E3DC] hover:bg-white/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Điều hướng di động"
          className="md:hidden bg-[#10131C] border-b border-white/[0.09] px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              currentRoute === item.route ||
              (currentRoute === 'reader' && item.route === 'catalog');
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white/[0.07] text-[#C69B53]'
                    : 'text-[#D6D3CC] hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
