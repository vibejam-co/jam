import React, { useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Globe, Github, Instagram, Linkedin, Mail, Music, ShoppingBag, Twitter, Youtube } from 'lucide-react';

type OrbitalLensAppProps = {
  forcedViewport?: 'mobile' | 'desktop';
};

type OrbitalLink = {
  id: string;
  label: string;
  url: string;
  icon: React.ReactNode;
  orbitRadius: number;
  speed: number;
  initialAngle: number;
  glowColor: string;
};

const CREATOR = {
  name: 'Julian Vibe',
  handle: '@julianvibe',
  avatarUrl: 'https://picsum.photos/seed/vision/300/300',
};

const buildLinks = (isMobile: boolean): OrbitalLink[] => [
  {
    id: 'spotify',
    label: 'Music',
    url: 'https://open.spotify.com',
    icon: <Music size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 110 : 180,
    speed: 25,
    initialAngle: 0,
    glowColor: 'rgba(30, 215, 96, 0.4)',
  },
  {
    id: 'shop',
    label: 'Merch',
    url: 'https://shop.example.com',
    icon: <ShoppingBag size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 110 : 180,
    speed: 25,
    initialAngle: 120,
    glowColor: 'rgba(255, 255, 255, 0.4)',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com',
    icon: <Instagram size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 110 : 180,
    speed: 25,
    initialAngle: 240,
    glowColor: 'rgba(225, 48, 108, 0.4)',
  },
  {
    id: 'twitter',
    label: 'Twitter',
    url: 'https://x.com',
    icon: <Twitter size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 170 : 300,
    speed: 40,
    initialAngle: 45,
    glowColor: 'rgba(29, 161, 242, 0.4)',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://youtube.com',
    icon: <Youtube size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 170 : 300,
    speed: 40,
    initialAngle: 135,
    glowColor: 'rgba(255, 0, 0, 0.4)',
  },
  {
    id: 'github',
    label: 'Code',
    url: 'https://github.com',
    icon: <Github size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 170 : 300,
    speed: 40,
    initialAngle: 225,
    glowColor: 'rgba(255, 255, 255, 0.4)',
  },
  {
    id: 'web',
    label: 'Portfolio',
    url: 'https://www.vibejam.co',
    icon: <Globe size={isMobile ? 18 : 24} />,
    orbitRadius: isMobile ? 170 : 300,
    speed: 40,
    initialAngle: 315,
    glowColor: 'rgba(0, 255, 255, 0.4)',
  },
  ...(isMobile
    ? []
    : [
        {
          id: 'linkedin',
          label: 'LinkedIn',
          url: 'https://linkedin.com',
          icon: <Linkedin size={24} />,
          orbitRadius: 420,
          speed: 60,
          initialAngle: 90,
          glowColor: 'rgba(0, 119, 181, 0.4)',
        },
        {
          id: 'mail',
          label: 'Contact',
          url: 'mailto:hello@vibejam.co',
          icon: <Mail size={24} />,
          orbitRadius: 420,
          speed: 60,
          initialAngle: 270,
          glowColor: 'rgba(255, 255, 255, 0.4)',
        },
      ]),
];

const OrbitalLensApp: React.FC<OrbitalLensAppProps> = ({ forcedViewport = 'desktop' }) => {
  const isMobile = forcedViewport === 'mobile';
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-500, 500], [15, -15]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-15, 15]), { stiffness: 100, damping: 30 });
  const links = useMemo(() => buildLinks(isMobile), [isMobile]);
  const stars = useMemo(
    () =>
      Array.from({ length: isMobile ? 90 : 150 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        flicker: 2 + Math.random() * 3,
      })),
    [isMobile],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #1E1E3F 0%, #0a0a20 48%, #000000 100%)',
      }}
      onMouseMove={(e) => {
        if (!containerRef.current || isMobile) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      onTouchMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const touch = e.touches[0];
        mouseX.set(touch.clientX - centerX);
        mouseY.set(touch.clientY - centerY);
      }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          x: useTransform(mouseX, [-500, 500], [20, -20]),
          y: useTransform(mouseY, [-500, 500], [20, -20]),
        }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `star-flicker ${star.flicker}s infinite ease-in-out`,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        drag={!isMobile}
        dragConstraints={isMobile ? undefined : { left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: 1000 }}
      >
        <motion.div className="relative pointer-events-auto" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
          <motion.div
            className={`z-50 relative ${isMobile ? 'w-[88px] h-[88px]' : 'w-[120px] h-[120px]'} rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-[0_0_50px_rgba(34,211,238,0.3)]`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-white/20">
              <img src={CREATOR.avatarUrl} alt={CREATOR.name} className="w-full h-full object-cover" />
            </div>
            <div className={`absolute ${isMobile ? '-bottom-12' : '-bottom-14'} left-1/2 -translate-x-1/2 text-center pointer-events-none`}>
              <h1 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-white tracking-tight drop-shadow-md`}>{CREATOR.name}</h1>
              <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-cyan-400 font-medium opacity-80`}>{CREATOR.handle}</p>
            </div>
          </motion.div>

          {links.map((link) => (
            <motion.div
              key={link.id}
              className="absolute top-1/2 left-1/2"
              style={{
                width: link.orbitRadius * 2,
                height: link.orbitRadius * 2,
                marginLeft: -link.orbitRadius,
                marginTop: -link.orbitRadius,
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: link.speed,
                repeat: Infinity,
                ease: 'linear',
                delay: -(link.initialAngle / 360) * link.speed,
              }}
            >
              <div className="absolute pointer-events-auto" style={{ top: '50%', left: '100%', transform: 'translate(-50%, -50%)' }}>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: link.speed,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: -(link.initialAngle / 360) * link.speed,
                  }}
                >
                  <motion.div
                    className={`absolute flex flex-col items-center group ${isMobile ? 'w-14 h-14 -ml-7 -mt-7' : 'w-20 h-20 -ml-10 -mt-10'}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                  >
                    <motion.a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full h-full rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 cursor-pointer"
                      style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.5)' }}
                      whileHover={{ boxShadow: `0 0 30px ${link.glowColor}`, borderColor: 'rgba(255, 255, 255, 0.8)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-white drop-shadow-lg z-10 transition-transform group-hover:rotate-[15deg]">{link.icon}</div>
                      <div className={`absolute ${isMobile ? 'top-1.5 left-2.5 w-4 h-2' : 'top-2 left-4 w-6 h-3'} bg-white/20 rounded-full blur-[2px] rotate-[-25deg]`} />
                    </motion.a>

                    <div className={`absolute ${isMobile ? 'top-[70px] opacity-100' : 'top-[95px] opacity-0 group-hover:opacity-100'} transition-opacity duration-300 pointer-events-none`}>
                      <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 whitespace-nowrap shadow-xl">
                        <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-white/90 tracking-wide`}>{link.label}</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-50">
        <div className="bg-black/40 backdrop-blur-md rounded-full px-5 py-1.5 border border-white/10 text-white/70 text-[10px] tracking-[0.2em] uppercase font-light">
          {isMobile ? 'Touch To Explore' : 'Drag To Explore The Universe'}
        </div>
      </div>

      <style>{`
        @keyframes star-flicker {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default OrbitalLensApp;
