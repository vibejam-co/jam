
import React, { useState } from 'react';
import { JamPage } from './components/JamPage';
import { BriefOverlay } from './components/BriefOverlay';

const App: React.FC = () => {
  const [showBrief, setShowBrief] = useState(false);

  return (
    <div className="relative min-h-screen">
      <nav className="fixed top-0 left-0 w-full z-40 p-6 md:p-10 flex justify-between items-center mix-blend-difference pointer-events-none">
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
        {showBrief ? <BriefOverlay /> : <JamPage />}
      </main>

      <footer className="py-20 text-center border-t border-neutral-900 bg-[#0A0A0A]">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-500">
          Built for the silent majority. &copy; 2024 VibeJam
        </p>
      </footer>
    </div>
  );
};

export default App;
