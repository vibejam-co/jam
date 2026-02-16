import React, { useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, type PanInfo } from 'framer-motion';
import { Heart, Monitor, Music, Plus, ShoppingBag, User } from 'lucide-react';

type IsometricLoftAppProps = {
  forcedViewport?: 'mobile' | 'desktop';
};

type LoftObject = {
  id: string;
  x: number;
  y: number;
  w: number;
  l: number;
  h: number;
  color: string;
  label: string;
  icon: React.ReactNode;
};

const WALL_COLOR = '#DAE8D9';
const FLOOR_COLOR = '#C4A484';
const ACCENT_BLUE = '#AEC6CF';
const ACCENT_PINK = '#FFB7B2';

const OBJECTS: LoftObject[] = [
  { id: 'music', x: 100, y: 80, w: 80, l: 80, h: 30, color: ACCENT_BLUE, label: 'My Playlist', icon: <Music size={20} /> },
  { id: 'social', x: 250, y: 50, w: 100, l: 60, h: 40, color: ACCENT_PINK, label: 'Dev Desktop', icon: <Monitor size={20} /> },
  { id: 'shop', x: 150, y: 220, w: 120, l: 120, h: 20, color: '#FDFD96', label: 'Merch Rack', icon: <ShoppingBag size={20} /> },
];

const IsoBlock: React.FC<LoftObject> = ({ x, y, w, l, h, color, label, icon }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="absolute"
      style={{ transformStyle: 'preserve-3d', left: x, top: y }}
      animate={{ y: hovered ? -10 : 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="relative" style={{ width: w, height: l, transformStyle: 'preserve-3d' }}>
        <div
          className="absolute inset-0 border-[2px] border-black/10 rounded-sm flex items-center justify-center"
          style={{ backgroundColor: color, transform: `translateZ(${h}px)` }}
        >
          <div className="text-white drop-shadow-md">{icon}</div>
        </div>
        <div
          className="absolute border-[2px] border-black/5"
          style={{ backgroundColor: color, width: w, height: h, bottom: -h, transformOrigin: 'top', transform: 'rotateX(-90deg)', filter: 'brightness(0.85)' }}
        />
        <div
          className="absolute border-[2px] border-black/5"
          style={{ backgroundColor: color, width: l, height: h, left: w, top: 0, transformOrigin: 'left', transform: 'rotateY(90deg)', filter: 'brightness(0.7)' }}
        />
        <div className="absolute inset-0 bg-black/20 blur-md translate-y-2" />
        {hovered && (
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-14">
            <div className="bg-white text-slate-800 px-3 py-1.5 rounded-full font-bold shadow-lg border border-slate-800 whitespace-nowrap text-[10px]">
              {label}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const IsometricLoftApp: React.FC<IsometricLoftAppProps> = ({ forcedViewport = 'desktop' }) => {
  const roomSize = forcedViewport === 'mobile' ? 240 : 380;
  const titleClass = forcedViewport === 'mobile' ? 'text-lg' : 'text-3xl';
  const subtitleClass = forcedViewport === 'mobile' ? 'text-[10px]' : 'text-sm';

  const rotateX = useMotionValue(60);
  const rotateZ = useMotionValue(45);
  const springX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const springZ = useSpring(rotateZ, { stiffness: 100, damping: 20 });

  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    rotateZ.set(rotateZ.get() - info.delta.x * 0.5);
    rotateX.set(Math.min(Math.max(rotateX.get() + info.delta.y * 0.45, 30), 85));
  };

  const scene = useMemo(
    () => (
      <div className="relative" style={{ perspective: '1200px', width: roomSize, height: roomSize }}>
        <motion.div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', rotateX: springX, rotateZ: springZ }}>
          <div className="absolute inset-0 shadow-inner border-4 border-black/5" style={{ backgroundColor: FLOOR_COLOR }} />
          <div
            className="absolute border-r-2 border-black/5"
            style={{
              backgroundColor: WALL_COLOR,
              width: roomSize,
              height: roomSize / 1.5,
              bottom: roomSize,
              transformOrigin: 'bottom',
              transform: 'rotateX(-90deg)',
            }}
          />
          <div
            className="absolute border-l-2 border-black/5"
            style={{
              backgroundColor: WALL_COLOR,
              width: roomSize / 1.5,
              height: roomSize,
              left: roomSize,
              transformOrigin: 'left',
              transform: 'rotateY(90deg)',
            }}
          />
          {OBJECTS.map((obj) => (
            <IsoBlock key={obj.id} {...obj} />
          ))}
          <IsoBlock id="avatar" x={200} y={120} w={40} l={40} h={80} color="#E6E6FA" label="Pixel Me" icon={<User size={16} />} />
          <div className="absolute w-28 h-28 bg-black/5 rounded-full blur-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </motion.div>
      </div>
    ),
    [roomSize, springX, springZ],
  );

  return (
    <div className="relative w-full h-full bg-[#f8f1e5] flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start pointer-events-none z-20">
        <div>
          <h1 className={`${titleClass} font-bold text-slate-800 drop-shadow-sm`}>Isometric Loft</h1>
          <p className={`${subtitleClass} text-slate-500 font-medium`}>@creative_pixel_loft</p>
        </div>
        <div className="flex gap-2 md:gap-3 pointer-events-auto">
          <button className="bg-white border border-slate-800 w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center">
            <Heart className="text-pink-400" size={16} fill="currentColor" />
          </button>
          <button className="bg-slate-800 text-white px-3 md:px-4 h-9 md:h-11 rounded-xl flex items-center gap-1.5 md:gap-2">
            <Plus size={16} />
            <span className="font-bold text-xs md:text-sm">Follow</span>
          </button>
        </div>
      </div>

      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onDrag={handleDrag}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      />

      {scene}

      <div className="absolute bottom-5 md:bottom-8 flex flex-col items-center gap-2 md:gap-3 z-20 pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {isDragging ? 'Spinning...' : 'Drag to spin loft'}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_160px_rgba(0,0,0,0.08)]" />
    </div>
  );
};

export default IsometricLoftApp;
