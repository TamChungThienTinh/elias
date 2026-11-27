import {useEffect, useRef, useState} from 'react';
import {
  Crown,
  LogIn,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import type {AuthUser, ViewRoute} from '../types';
import {buildRoutePath} from '../utils/routing';

interface HeaderProps {
  currentRoute: ViewRoute;
  cartCount: number;
  authUser: AuthUser | null;
  isVipActive: boolean;
  onNavigate: (route: ViewRoute) => void;
  onOpenCart: () => void;
  onOpenAuthModal: () => void;
  onOpenVipTab: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: Array<{route: ViewRoute; label: string}> = [
  {route: 'home', label: 'Trang chủ'},
  {route: 'catalog', label: 'Mục lục'},
  {route: 'merch', label: 'Cửa hàng'},
  {route: 'library', label: 'Thư viện'},
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ĐG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Header({
  currentRoute,
  cartCount,
  authUser,
  isVipActive,
  onNavigate,
  onOpenCart,
  onOpenAuthModal,
  onOpenVipTab,
  onSignOut,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [accountMenuOpen]);

  const handleNav = (route: ViewRoute) => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0B0D12]/92 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line display wordmark */}
        <a
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
              return;
            }
            e.preventDefault();
            handleNav('home');
          }}
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#F1ECE1] hover:text-[#C69B53] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53] rounded-sm"
        >
          Huyết Án Đa Diện
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
            const href = buildRoutePath(item.route);
            return (
              <a
                key={item.route}
                href={href}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                    return;
                  }
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

        {/* Zone 3: Cart icon + Auth / VIP user menu + Mobile toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={
              cartCount > 0
                ? `Mở giỏ hàng (${cartCount} sản phẩm)`
                : 'Mở giỏ hàng Merch'
            }
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md border border-white/[0.1] bg-[#13161F] hover:border-[#C69B53] text-xs font-medium text-[#E6E3DC] hover:text-[#C69B53] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
          >
            <ShoppingBag className="w-4 h-4 text-[#C69B53]" aria-hidden="true" />
            <span className="hidden lg:inline">Giỏ hàng</span>
            {cartCount > 0 && (
              <span
                data-testid="header-cart-count"
                className="text-[#C69B53] font-semibold tabular-nums"
              >
                ({cartCount})
              </span>
            )}
          </button>

          {authUser ? (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border border-white/[0.12] bg-[#13161F] hover:border-[#C69B53] text-xs font-medium text-[#F1ECE1] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]"
              >
                {authUser.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={authUser.displayName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-white/[0.15]"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="w-6 h-6 rounded-full bg-[#C69B53]/20 border border-[#C69B53]/50 text-[#D8AE68] text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                  >
                    {getInitials(authUser.displayName)}
                  </span>
                )}
                <span className="max-w-[96px] sm:max-w-[120px] truncate">
                  {authUser.displayName}
                </span>
                {isVipActive && (
                  <span
                    data-testid="header-vip-badge"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C69B53] text-[#0B0D12] text-[10px] font-bold tracking-wide shrink-0"
                  >
                    <Crown className="w-3 h-3" aria-hidden="true" />
                    VIP
                  </span>
                )}
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-[#13161F] border border-white/[0.12] shadow-2xl py-1.5 z-50"
                >
                  <div className="px-3.5 py-2.5 border-b border-white/[0.08]">
                    <p className="text-xs font-semibold text-[#F5F1E8] truncate">
                      {authUser.displayName}
                    </p>
                    <p className="text-[11px] text-[#8E8C86] truncate mt-0.5">
                      {authUser.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('library')}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#E6E3DC] hover:bg-white/[0.05] hover:text-[#C69B53] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    Thư viện cá nhân
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenVipTab();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#D8AE68] hover:bg-white/[0.05] flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                    {isVipActive ? 'Quản lý / Gia hạn VIP' : 'Kích hoạt Thành viên VIP'}
                  </button>
                  <div className="my-1 border-t border-white/[0.08]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#D47A7A] hover:bg-white/[0.05] flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#C69B53] hover:bg-[#D8AE68] text-[#0B0D12] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F1E8]"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              Đăng nhập
            </button>
          )}

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
