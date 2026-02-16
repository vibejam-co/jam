import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type VaporOsAppProps = {
  forcedViewport?: 'mobile' | 'desktop';
};

type AppId = 'music' | 'notepad' | 'paint';

type WindowState = {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  x: number;
  y: number;
};

type DesktopIconDef = {
  id: AppId;
  title: string;
  icon: string;
};

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'music', title: 'My Music.wav', icon: '🎵' },
  { id: 'notepad', title: 'Thoughts.txt', icon: '📝' },
  { id: 'paint', title: 'Lookbook.bmp', icon: '🎨' },
];

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [track] = useState('Vapor_Dreams_feat_Home.mp3');

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const bars = 20;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#05ffa1';
      for (let i = 0; i < bars; i += 1) {
        const height = Math.random() * canvas.height;
        ctx.fillRect(i * (canvas.width / bars), canvas.height - height, canvas.width / bars - 2, height);
      }
      raf = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div className="bg-[#1a1a1a] text-[#05ffa1] p-3 md:p-4 flex flex-col gap-3 h-full font-mono">
      <div className="flex items-center justify-between">
        <div className="text-[10px] md:text-xs uppercase tracking-tighter opacity-80">Winamp 2.91</div>
        <div className="text-[10px] md:text-xs">128kbps / 44khz</div>
      </div>
      <div className="flex gap-3 md:gap-4">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-black border border-[#05ffa1]/30 flex items-center justify-center text-3xl md:text-4xl">📼</div>
        <div className="flex-1">
          <div className="bg-black/50 p-2 border border-[#05ffa1]/20 mb-2">
            <div className="text-[10px] md:text-xs text-[#ff71ce] overflow-hidden whitespace-nowrap">{isPlaying ? <marquee>{track}</marquee> : track}</div>
          </div>
          <canvas ref={canvasRef} width={180} height={40} className="w-full h-10 md:h-12 bg-black border border-[#05ffa1]/20" />
        </div>
      </div>
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="w-7 h-7 md:w-8 md:h-8 border-2 border-[#05ffa1] text-[#05ffa1] flex items-center justify-center hover:bg-[#05ffa1] hover:text-black transition-colors"
          >
            {isPlaying ? '||' : '▶'}
          </button>
          <button type="button" className="w-7 h-7 md:w-8 md:h-8 border-2 border-[#05ffa1] text-[#05ffa1] flex items-center justify-center hover:bg-[#05ffa1] hover:text-black">
            ■
          </button>
        </div>
        <div className="flex-1 h-2 bg-black border border-[#05ffa1]/20 relative">
          <div className="absolute top-0 left-0 h-full bg-[#ff71ce]" style={{ width: isPlaying ? '45%' : '0%' }} />
        </div>
        <div className="text-[10px] md:text-xs">02:45</div>
      </div>
      <div className="mt-1 text-[9px] md:text-[10px] opacity-40 text-center">EST. 1995 // REBORN 2024</div>
    </div>
  );
};

const Notepad: React.FC = () => {
  const [content, setContent] = useState(
    "DATE: 08-25-1995\nLOCATION: CYBER-SPACE\n--------------------\nThe sunset here doesn't end. It just loops.\nI've been staring at the dithering pattern for hours.\nFound a new playlist in the cache.\nEverything is glass. Everything is light.\n\n> _",
  );

  return (
    <div className="h-full bg-white text-black font-mono p-3 md:p-4 flex flex-col outline-none">
      <textarea
        className="flex-1 resize-none bg-transparent border-none outline-none leading-relaxed text-[11px] md:text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
      />
      <div className="text-[9px] md:text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-1">Ln 12, Col 8 | UTF-8 | Monospaced</div>
    </div>
  );
};

const Paint: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#05ffa1');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 400;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const drawPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col h-full bg-[#dfdfdf] overflow-hidden">
      <div className="flex items-center gap-2 p-1 border-b border-gray-400 bg-gray-200">
        <button type="button" onClick={clear} className="px-2 py-1 bg-white border border-gray-400 text-[10px] uppercase font-bold active:bg-gray-300">
          New
        </button>
        <div className="h-4 border-l border-gray-400 mx-1" />
        {['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'].map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`w-5 h-5 border-2 ${color === c ? 'border-white' : 'border-gray-500'} shadow-sm`}
          />
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider hidden sm:block">Canvas Layer Active</span>
      </div>
      <div className="relative flex-1 bg-black overflow-hidden group">
        <img src="https://picsum.photos/id/10/800/600" alt="Gallery" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            setIsDrawing(true);
            drawPoint(e.clientX, e.clientY);
          }}
          onMouseUp={() => {
            setIsDrawing(false);
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.beginPath();
          }}
          onMouseMove={(e) => drawPoint(e.clientX, e.clientY)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={(e) => {
            setIsDrawing(true);
            const t = e.touches[0];
            drawPoint(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            drawPoint(t.clientX, t.clientY);
          }}
          onTouchEnd={() => {
            setIsDrawing(false);
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.beginPath();
          }}
          className="absolute inset-0 z-10 cursor-crosshair touch-none"
        />
        <div className="absolute bottom-3 right-3 z-20 bg-black/50 backdrop-blur p-2 text-[10px] text-white border border-white/20">DRAW NEON LINES ON TOP</div>
      </div>
    </div>
  );
};

const WindowFrame: React.FC<{
  win: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  isMobile: boolean;
}> = ({ win, onClose, onMinimize, onFocus, children, isMobile }) => {
  const variants = {
    initial: { scale: 0.1, opacity: 0, y: 100 },
    animate: {
      scale: win.isMinimized ? 0 : 1,
      opacity: win.isMinimized ? 0 : 1,
      y: win.isMinimized ? 500 : 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: { scale: 0.5, opacity: 0, y: 100 },
  };

  return (
    <motion.div
      drag={!isMobile}
      dragMomentum={false}
      onPointerDown={onFocus}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      style={{ zIndex: win.zIndex, position: 'absolute', left: win.x, top: win.y }}
      className={`${isMobile ? 'w-[min(94vw,360px)] h-[min(58vh,280px)]' : 'min-w-[320px] min-h-[200px]'} bg-white/70 backdrop-blur-md border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-400 shadow-[10px_10px_0px_rgba(0,0,0,0.2)] flex flex-col ${
        win.isMinimized ? 'pointer-events-none' : ''
      }`}
    >
      <div
        className="h-8 flex items-center justify-between px-2 bg-gradient-to-r from-purple-800 to-indigo-600 cursor-move text-white font-bold text-xs"
        onPointerDown={(e) => {
          e.stopPropagation();
          onFocus();
        }}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-80">💾</span>
          <span className="font-mono text-base uppercase tracking-wider truncate">{win.title}</span>
        </div>
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="w-5 h-5 bg-gray-200 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 text-black flex items-center justify-center hover:bg-gray-300"
          >
            _
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-5 h-5 bg-gray-200 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 text-black flex items-center justify-center hover:bg-red-300"
          >
            X
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto relative p-1 bg-white/40">
        <div className="border border-gray-400 h-full w-full bg-transparent overflow-auto">{children}</div>
      </div>
    </motion.div>
  );
};

const VaporOsApp: React.FC<VaporOsAppProps> = ({ forcedViewport = 'desktop' }) => {
  const isMobile = forcedViewport === 'mobile';
  const [windows, setWindows] = useState<Record<AppId, WindowState>>({
    music: { id: 'music', title: 'Winamp - My Music', isOpen: false, isMinimized: false, zIndex: 10, x: 24, y: 24 },
    notepad: { id: 'notepad', title: 'Notepad - Thoughts.txt', isOpen: false, isMinimized: false, zIndex: 10, x: isMobile ? 18 : 220, y: isMobile ? 66 : 90 },
    paint: { id: 'paint', title: 'VaporPaint - Lookbook.bmp', isOpen: false, isMinimized: false, zIndex: 10, x: isMobile ? 20 : 120, y: isMobile ? 108 : 180 },
  });
  const [topZ, setTopZ] = useState(10);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const focusWindow = useCallback((id: AppId) => {
    setTopZ((prev) => {
      const nextZ = prev + 1;
      setWindows((prevWindows) => ({
        ...prevWindows,
        [id]: { ...prevWindows[id], zIndex: nextZ, isMinimized: false, isOpen: true },
      }));
      return nextZ;
    });
  }, []);

  const openApp = useCallback(
    (id: AppId) => {
      setWindows((prev) => ({ ...prev, [id]: { ...prev[id], isOpen: true, isMinimized: false } }));
      focusWindow(id);
    },
    [focusWindow],
  );

  const closeWindow = useCallback((id: AppId) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], isOpen: false } }));
  }, []);

  const toggleMinimize = useCallback(
    (id: AppId) => {
      setWindows((prev) => ({ ...prev, [id]: { ...prev[id], isMinimized: !prev[id].isMinimized } }));
      if (windows[id].isMinimized) {
        focusWindow(id);
      }
    },
    [windows, focusWindow],
  );

  const openWindows = useMemo(() => Object.values(windows).filter((w) => w.isOpen), [windows]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #ff71ce 0%, #01cdfe 30%, #b967ff 60%, #05ffa1 100%)',
        backgroundSize: '400% 400%',
        animation: 'vapor-gradient 15s ease infinite',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '3px 3px', opacity: 0.1 }}
      />

      <div className={`${isMobile ? 'p-3 gap-3' : 'p-8 gap-8'} grid grid-cols-1 w-max h-full content-start`}>
        {DESKTOP_ICONS.map((icon) => (
          <motion.div
            key={icon.id}
            drag={!isMobile}
            dragMomentum={false}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            onDoubleClick={() => openApp(icon.id)}
            onClick={() => (isMobile ? openApp(icon.id) : undefined)}
            className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} flex flex-col items-center justify-center cursor-pointer group`}
          >
            <div className={`${isMobile ? 'text-3xl' : 'text-4xl'} drop-shadow-lg mb-1`}>{icon.icon}</div>
            <div className={`px-1 text-center bg-transparent group-hover:bg-blue-600 group-hover:text-white ${isMobile ? 'text-xs' : 'text-sm'} text-white drop-shadow-md font-mono bg-black/20 rounded`}>
              {icon.title}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {openWindows.map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => toggleMinimize(win.id)}
            onFocus={() => focusWindow(win.id)}
            isMobile={isMobile}
          >
            {win.id === 'music' && <MusicPlayer />}
            {win.id === 'notepad' && <Notepad />}
            {win.id === 'paint' && <Paint />}
          </WindowFrame>
        ))}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 z-[9999] gap-2">
        <button type="button" className="h-8 px-2 bg-gray-200 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center gap-1 font-bold text-sm active:bg-gray-400">
          <span className="text-lg">☄️</span>
          <span className="font-mono text-lg">Vapor</span>
        </button>
        <div className="h-full border-l-2 border-gray-400 ml-1 mr-1" />
        <div className="flex-1 flex gap-1 overflow-x-auto h-8">
          {openWindows.map((win) => (
            <button
              type="button"
              key={win.id}
              onClick={() => {
                if (!windows[win.id].isOpen) {
                  openApp(win.id);
                } else {
                  toggleMinimize(win.id);
                }
              }}
              className={`px-2 min-w-[100px] md:min-w-[120px] flex items-center gap-2 text-xs border-2 ${
                !win.isMinimized
                  ? 'bg-gray-300 border-b-white border-r-white border-t-gray-600 border-l-gray-600 font-bold'
                  : 'bg-gray-200 border-t-white border-l-white border-b-gray-600 border-r-gray-600'
              }`}
            >
              <span className="text-base">{win.id === 'music' ? '🎵' : win.id === 'notepad' ? '📝' : '🎨'}</span>
              <span className="truncate font-mono text-sm uppercase">{win.title}</span>
            </button>
          ))}
        </div>
        <div className="h-8 px-3 md:px-4 flex items-center bg-gray-300 border-2 border-b-white border-r-white border-t-gray-600 border-l-gray-600 font-mono text-base text-black font-bold">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <style>{`
        @keyframes vapor-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default VaporOsApp;
