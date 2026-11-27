import {useEffect, useState} from 'react';
import {ArrowUp} from 'lucide-react';

interface BackToTopButtonProps {
  /** Dịch nhẹ nút lên trên khi có thông báo Toast góc phải dưới để tránh che nhau */
  offsetForToast?: boolean;
  /** Ngưỡng cuộn dọc (px) để hiện nút */
  thresholdPx?: number;
}

export function BackToTopButton({
  offsetForToast = false,
  thresholdPx = 500,
}: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > thresholdPx);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, {passive: true});
    return () => window.removeEventListener('scroll', updateVisibility);
  }, [thresholdPx]);

  const handleScrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <button
      type="button"
      data-testid="back-to-top-button"
      onClick={handleScrollToTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`group fixed right-6 z-40 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#13161F]/92 backdrop-blur-md border border-[#C69B53]/50 hover:border-[#C69B53] hover:bg-[#1A1F2B] text-[#C69B53] hover:text-[#D8AE68] shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C69B53]/70 ${
        offsetForToast ? 'bottom-20' : 'bottom-6'
      } ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp
        className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5"
        strokeWidth={1.85}
        aria-hidden="true"
      />
    </button>
  );
}
