import React, { useEffect, useMemo, useState } from 'react';
import { motion, useMotionTemplate, useSpring, useTransform } from 'framer-motion';

type KineticVariableAppProps = {
  forcedViewport?: 'mobile' | 'desktop';
};

type KineticLinkProps = {
  label: string;
  progress: ReturnType<typeof useSpring>;
  isActive: boolean;
  isMobile: boolean;
  isLast?: boolean;
};

const Header: React.FC<{ progress: ReturnType<typeof useSpring>; isMobile: boolean }> = ({ progress, isMobile }) => {
  const weight = useTransform(progress, [0, 1], [820, 240]);
  const width = useTransform(progress, [0, 1], [102, 78]);
  const skew = useTransform(progress, [0, 1], [-2, 2]);
  const scaleX = useTransform(progress, [0, 1], [0.94, 1.08]);
  const hueShift = useTransform(progress, [0, 1], [0, 24]);
  const fontVariation = useMotionTemplate`'wght' ${weight}, 'wdth' ${width}`;
  const sizeClass = isMobile ? 'text-[clamp(2.1rem,8.2vh,3.5rem)]' : 'text-[12vw]';

  return (
    <header className={`px-4 ${isMobile ? 'pt-6 pb-5' : 'pt-8 pb-6'} flex flex-col gap-3 bg-black text-white overflow-hidden`}>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.2,
          filter: useMotionTemplate`hue-rotate(${hueShift}deg)`,
          background:
            'radial-gradient(circle at 8% 10%, rgba(57,255,20,0.25), transparent 36%), radial-gradient(circle at 92% 8%, rgba(255,255,255,0.11), transparent 30%)',
        }}
      />
      <motion.h1
        className={`${sizeClass} relative leading-[0.82] font-black tracking-tighter uppercase`}
        style={{
          letterSpacing: useTransform(weight, [240, 820], ['-0.005em', '-0.06em']),
          fontVariationSettings: fontVariation,
          skewX: skew,
          scaleX,
        }}
      >
        KINETIC
        <br />
        VARIABLE
      </motion.h1>

      <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} relative uppercase tracking-tight text-zinc-300 max-w-[38ch]`}>
        The typography reacts to cursor movement and shifts structure in real time.
      </p>
    </header>
  );
};

const KineticLink: React.FC<KineticLinkProps> = ({ label, progress, isActive, isMobile, isLast = false }) => {
  const weight = useTransform(progress, [0, 1], [260, 820]);
  const width = useTransform(progress, [0, 1], [78, 102]);
  const xShift = useTransform(progress, [0, 1], [-24, 24]);
  const textSpacing = useTransform(progress, [0, 1], ['-0.012em', '-0.07em']);
  const fontVariation = useMotionTemplate`'wght' ${weight}, 'wdth' ${width}`;
  const marqueeDuration = isMobile ? 5.2 : 5.6;
  const rowSize = isMobile ? 'text-[clamp(1.95rem,6.4vh,3.25rem)]' : 'text-[10vw] md:text-[6.6vw]';

  return (
    <motion.div
      className={`relative w-full px-4 ${isMobile ? 'py-3 min-h-[68px]' : 'py-4 md:py-6'} overflow-hidden transition-colors duration-150 ease-out ${
        isLast ? '' : 'border-b border-white'
      } ${isActive ? 'bg-[#39FF14] text-black' : 'bg-black text-white'
      }`}
    >
      <motion.div className="pointer-events-none" style={{ x: isActive ? xShift : 0 }}>
        {isActive ? (
          <motion.div
            className="flex items-center whitespace-nowrap gap-8"
            animate={{ x: ['0%', '-40%'] }}
            transition={{ duration: marqueeDuration, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: isMobile ? 10 : 8 }).map((_, idx) => (
              <motion.span
                key={`${label}-${idx}`}
                className={`${rowSize} font-black uppercase leading-none`}
                style={{ letterSpacing: textSpacing, fontVariationSettings: fontVariation }}
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        ) : (
          <motion.span
            className={`block ${rowSize} font-black uppercase leading-none`}
            animate={isMobile ? { x: [0, 6, 0, -6, 0] } : undefined}
            transition={isMobile ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
            style={{ letterSpacing: textSpacing, fontVariationSettings: fontVariation }}
          >
            {label}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
};

const KineticVariableApp: React.FC<KineticVariableAppProps> = ({ forcedViewport = 'desktop' }) => {
  const [pointerProgress, setPointerProgress] = useState(0.5);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const progressSpring = useSpring(0.5, { stiffness: 110, damping: 28 });
  const isMobile = forcedViewport === 'mobile';

  useEffect(() => {
    progressSpring.set(pointerProgress);
  }, [pointerProgress, progressSpring]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const interval = window.setInterval(() => {
      setMobileActiveIndex((prev) => (prev + 1) % 6);
      setPointerProgress((prev) => (prev >= 0.84 ? 0.2 : prev + 0.14));
    }, 1300);

    return () => window.clearInterval(interval);
  }, [isMobile]);

  const labels = ['SPOTIFY', 'INSTAGRAM', 'TWITTER', 'YOUTUBE', 'BEHANCE', 'WEBSITE'];
  const activeRowIndex = isMobile ? mobileActiveIndex : hoveredIndex;
  const wrapperClass = useMemo(
    () => `min-h-full bg-black text-white selection:bg-[#39FF14] selection:text-black ${isMobile ? 'touch-pan-y' : ''}`,
    [isMobile],
  );

  return (
    <div
      className={wrapperClass}
      onMouseMove={(event) => {
        if (isMobile) {
          return;
        }
        const width = event.currentTarget.clientWidth || 1;
        setPointerProgress(Math.max(0, Math.min(1, event.nativeEvent.offsetX / width)));
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width || 1;
        setPointerProgress(Math.max(0, Math.min(1, (touch.clientX - rect.left) / width)));
      }}
    >
      <Header progress={progressSpring} isMobile={isMobile} />

      <main className="flex flex-col border-t border-white">
        {labels.map((label, index) => (
          <div
            key={label}
            onMouseEnter={() => !isMobile && setHoveredIndex(index)}
            onMouseLeave={() => !isMobile && setHoveredIndex(null)}
            onTouchStart={(event) => {
              if (!isMobile) {
                return;
              }
              const touch = event.touches[0];
              const rect = event.currentTarget.getBoundingClientRect();
              const width = rect.width || 1;
              setMobileActiveIndex(index);
              setPointerProgress(Math.max(0, Math.min(1, (touch.clientX - rect.left) / width)));
            }}
          >
            <KineticLink
              label={label}
              progress={progressSpring}
              isActive={activeRowIndex === index}
              isMobile={isMobile}
              isLast={index === labels.length - 1}
            />
          </div>
        ))}
      </main>

      <footer className={`px-4 ${isMobile ? 'py-4' : 'py-6'} border-t border-white flex flex-col md:flex-row justify-between gap-2`}>
        <div className="text-[11px] md:text-xs uppercase font-bold tracking-tight">VIBEJAM // KINETIC VARIABLE THEME</div>
        <div className="text-[10px] md:text-xs opacity-60 uppercase">Swiss Brutalist Motion Layout</div>
      </footer>
    </div>
  );
};

export default KineticVariableApp;
