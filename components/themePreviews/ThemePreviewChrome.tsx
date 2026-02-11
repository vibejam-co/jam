import React from 'react';
import { ArrowRight, Monitor, Smartphone, X } from 'lucide-react';

interface ThemePreviewChromeProps {
  onClose: () => void;
  onUseTheme: () => void;
  children: React.ReactNode;
  mobileChildren?: React.ReactNode;
  desktopClassName?: string;
  mobileFrameClassName?: string;
  controlsDark?: boolean;
}

const ThemePreviewChrome: React.FC<ThemePreviewChromeProps> = ({
  onClose,
  onUseTheme,
  children,
  mobileChildren,
  desktopClassName = '',
  mobileFrameClassName = '',
  controlsDark = false,
}) => {
  const [isMobileView, setIsMobileView] = React.useState(false);

  const controlBaseClass = controlsDark
    ? 'border-white/20 bg-black/45 text-white hover:bg-black/65'
    : 'border-black/20 bg-white/80 text-black hover:bg-white';

  return (
    <div className={`fixed inset-0 z-[300] h-[100dvh] w-screen overflow-hidden ${isMobileView ? 'bg-black/95' : desktopClassName}`}>
      {isMobileView ? (
        <div className="h-full w-full flex items-center justify-center p-4 sm:p-8">
          <div className={`relative h-[88dvh] w-[390px] max-w-full overflow-hidden rounded-[36px] border border-white/20 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.75)] ${mobileFrameClassName}`}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 h-1.5 w-16 rounded-full bg-white/25" />
            <div className="h-full overflow-y-auto overflow-x-hidden">
              {mobileChildren ?? children}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">{children}</div>
      )}

      <div className="fixed top-3 right-3 md:top-6 md:right-6 z-[10001] flex items-center gap-2 md:gap-3">
        <button
          onClick={() => setIsMobileView((prev) => !prev)}
          className={`h-10 w-10 md:h-11 md:w-11 rounded-full border backdrop-blur-md flex items-center justify-center transition-colors ${controlBaseClass}`}
          aria-label={isMobileView ? 'Switch to desktop preview' : 'Switch to mobile preview'}
          title={isMobileView ? 'Desktop Preview' : 'Mobile Preview'}
        >
          {isMobileView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>
        <button
          onClick={onUseTheme}
          className={`h-10 md:h-11 px-3 md:px-5 rounded-full border backdrop-blur-md text-[10px] md:text-xs font-black uppercase tracking-[0.16em] md:tracking-[0.18em] flex items-center gap-1.5 md:gap-2 transition-colors ${controlBaseClass}`}
        >
          Use This Vibe <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className={`h-10 w-10 md:h-11 md:w-11 rounded-full border backdrop-blur-md flex items-center justify-center transition-colors ${controlBaseClass}`}
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ThemePreviewChrome;
