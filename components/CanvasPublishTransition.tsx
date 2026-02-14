import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import type { CanvasPublishResult } from '../types';

interface CanvasPublishTransitionProps {
  publish: CanvasPublishResult;
  onContinue: () => void;
}

const CanvasPublishTransition: React.FC<CanvasPublishTransitionProps> = ({ publish, onContinue }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onContinue();
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[360] bg-black text-white overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(16,185,129,0.2),transparent_45%)]" />
        <div className="absolute left-1/2 top-1/2 w-[60vw] h-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="w-full max-w-3xl rounded-[36px] border border-emerald-400/30 bg-black/70 backdrop-blur-2xl p-10 md:p-14 text-center"
        >
          <div className="mx-auto mb-7 w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-300" />
          </div>

          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300/90">
            <Sparkles className="w-3.5 h-3.5" /> Canvas is live
          </p>
          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tighter text-white leading-[0.95]">
            Published <span className="text-emerald-300">Successfully</span>
          </h2>
          <p className="mt-5 text-zinc-300 text-base md:text-lg">
            Your page is live. Opening your Canvas Dashboard so you can keep customizing.
          </p>

          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80 font-black">Live URL</p>
            <p className="mt-2 text-white font-mono-data break-all">{publish.url}</p>
          </div>

          <button
            onClick={onContinue}
            className="mt-8 h-12 px-8 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs inline-flex items-center gap-2.5 hover:bg-zinc-200 transition-colors"
          >
            Enter Canvas Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CanvasPublishTransition;
