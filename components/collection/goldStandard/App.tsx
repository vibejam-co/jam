
import React, { useState } from 'react';
import { JamPage } from './components/JamPage';
import { BriefOverlay } from './components/BriefOverlay';

interface GoldStandardAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<GoldStandardAppProps> = ({ forcedViewport }) => {
  const [showBrief, setShowBrief] = useState(false);
  const isCompact = forcedViewport === 'mobile';

  return (
    <div className="relative min-h-screen">
      <nav className={`top-0 left-0 w-full z-40 flex justify-between items-center mix-blend-difference pointer-events-none ${isCompact ? 'absolute p-4' : 'fixed p-6 md:p-10'}`}>
        <div className="pointer-events-auto">
          <span className="font-mono text-xs tracking-widest uppercase opacity-80">VibeJam.01</span>
        </div>
        <div className="pointer-events-auto flex gap-6">
          <button 
            onClick={() => setShowBrief(!showBrief)}
            className="font-mono text-xs tracking-widest uppercase hover:line-through transition-all cursor-pointer"
          >
            {showBrief ? 'Close Design Brief' : 'View Design Brief'}
          </button>
        </div>
      </nav>

      <main className="bg-[#0A0A0A]">
        {showBrief ? <BriefOverlay /> : <JamPage compact={isCompact} />}
      </main>

      <footer className={`${isCompact ? 'py-10' : 'py-20'} text-center border-t border-neutral-900 bg-[#0A0A0A]`}>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-500">
          Built for the silent majority. &copy; 2024 VibeJam
        </p>
      </footer>
    </div>
  );
};

export default App;
