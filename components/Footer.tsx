
import React from 'react';

interface FooterProps {
  onOpenLegal: (tab: 'Terms' | 'Privacy' | 'Support') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="mt-40 border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-lg font-extrabold tracking-tighter text-white">VibeJam</h2>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">© 2026 Midnight Zenith Intelligence</p>
        </div>

        <div className="flex items-center gap-8">
          <button 
            onClick={() => onOpenLegal('Terms')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => onOpenLegal('Privacy')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => onOpenLegal('Support')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            Support
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Network Secure</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
