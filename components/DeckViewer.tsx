import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import type { MarketplacePitchDecks } from '../types';

interface DeckViewerProps {
  assetName: string;
  decks: MarketplacePitchDecks;
  onClose: () => void;
}

const DeckViewer: React.FC<DeckViewerProps> = ({ assetName, decks, onClose }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => (Array.isArray(decks.slides) ? decks.slides : []), [decks.slides]);
  const maxSlideIndex = Math.max(0, slides.length - 1);
  const currentSlide = slides[Math.min(slideIndex, maxSlideIndex)] ?? null;
  const currentSlideMetrics = Array.isArray(currentSlide?.metricsToHighlight)
    ? currentSlide.metricsToHighlight
    : [];
  const currentSlideBody = currentSlide?.bodyText ?? currentSlide?.copy ?? '';
  const currentSlideBackgroundStyle = currentSlide?.backgroundImageBase64
    ? {
        backgroundImage: `url(data:image/jpeg;base64,${currentSlide.backgroundImageBase64})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : currentSlide?.imageUrl
      ? {
          backgroundImage: `url(${currentSlide.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[520] bg-black/90 backdrop-blur-md px-4 py-6 md:px-8 md:py-10"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-[32px] border border-white/10 bg-[#050505] shadow-[0_45px_120px_rgba(0,0,0,0.7)]"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">AI Sender Deck</p>
            <h3 className="truncate text-xl font-black tracking-tight text-white">{assetName}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-400 transition-all hover:border-white/30 hover:text-white"
            aria-label="Close deck viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 md:px-6">
          {currentSlide ? (
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070707] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`slide-${currentSlide.slideNumber}`}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="relative aspect-video"
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={currentSlideBackgroundStyle} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_42%)]" />

                  <div className="relative flex h-full items-end p-8 md:p-12">
                    <div className="relative z-10 w-1/2 max-w-[55%] space-y-5">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Slide {currentSlide.slideNumber}
                      </div>

                      <h4 className="text-3xl font-black tracking-tight text-white md:text-5xl">{currentSlide.title}</h4>

                      <p className="whitespace-pre-line text-sm leading-7 text-zinc-100 md:text-base">{currentSlideBody}</p>

                      {currentSlideMetrics.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {currentSlideMetrics.map((metric, index) => (
                            <span
                              key={`metric-${index}-${metric}`}
                              className="inline-flex items-center rounded-full border border-emerald-400/35 bg-emerald-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-400">
              Deck content unavailable.
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={slideIndex <= 0}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-200 transition-all hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {Math.min(slideIndex + 1, Math.max(1, slides.length))} / {Math.max(1, slides.length)}
            </p>

            <button
              type="button"
              onClick={() => setSlideIndex((prev) => Math.min(maxSlideIndex, prev + 1))}
              disabled={slideIndex >= maxSlideIndex}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-200 transition-all hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeckViewer;
