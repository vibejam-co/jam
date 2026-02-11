
import React, { useState, useEffect } from 'react';
import { INITIAL_CREATOR } from '../constants';
import { SignalCard } from './SignalCard';

export const JamPage: React.FC = () => {
  const [data] = useState(INITIAL_CREATOR);
  const [refinedNarrative, setRefinedNarrative] = useState(data.narrative);
  const [isRefining, setIsRefining] = useState(false);

  const refineWithGemini = async () => {
    setIsRefining(true);
    // Keep preview self-contained and deterministic in the Canvas modal.
    window.setTimeout(() => {
      setRefinedNarrative(
        'I build interfaces that breathe in silence. My practice fuses brutalist digital ethics with soft interaction hardware, shaping experiences that return agency to people navigating saturated ecosystems.',
      );
      setIsRefining(false);
    }, 450);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-32 pb-48 animate-in fade-in duration-1000">
      {/* Identity Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-32">
        <div className="md:col-span-8">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-6">Identity</h2>
          <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter leading-none mb-8">
            {data.name}
          </h1>
          <p className="font-mono text-xs tracking-widest uppercase text-neutral-400">
            {data.role} &mdash; {data.location}
          </p>
        </div>
      </section>

      {/* Hero Visual */}
      <section className="mb-48 relative">
        <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-neutral-900 group">
          <img 
            src={data.heroImage} 
            alt="Hero Visual" 
            className="w-full h-full object-cover grayscale opacity-90 transition-transform duration-1000 group-hover:scale-105 group-hover:grayscale-0"
          />
        </div>
        <div className="absolute -bottom-12 -right-6 md:right-12 bg-[#0A0A0A] p-8 max-w-sm border border-neutral-800 shadow-2xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-4">Current Focus</p>
          <p className="text-lg leading-relaxed font-serif italic">
            "Redefining silence through architectural digital design."
          </p>
        </div>
      </section>

      {/* Narrative & Proof Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-24 items-start">
        {/* Narrative */}
        <div className="md:col-span-7">
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">Narrative</h2>
            <button 
              onClick={refineWithGemini}
              disabled={isRefining}
              className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
            >
              {isRefining ? 'Curating...' : 'Curate via Gemini'}
            </button>
          </div>
          <div className="text-3xl md:text-4xl leading-[1.3] font-light text-neutral-200">
            {refinedNarrative}
          </div>
          <div className="mt-12 h-px w-24 bg-neutral-800"></div>
        </div>

        {/* Proof / Signals */}
        <div className="md:col-span-5 space-y-8">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-10">Signals</h2>
          <div className="grid grid-cols-1 gap-1">
            {data.signals.map((signal, idx) => (
              <SignalCard key={idx} signal={signal} />
            ))}
          </div>
          
          <div className="pt-12">
             <a href="#" className="inline-flex items-center group">
               <span className="font-mono text-[10px] uppercase tracking-[0.2em] group-hover:mr-4 transition-all duration-300">Initiate Contact</span>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="ml-2 group-hover:translate-x-2 transition-transform">
                 <path d="M5 12h14m-7-7l7 7-7 7" />
               </svg>
             </a>
          </div>
        </div>
      </section>

      {/* Silence Section */}
      <section className="py-64 text-center">
        <div className="inline-block relative">
          <div className="w-1 h-1 bg-neutral-500 rounded-full mx-auto mb-8 opacity-40"></div>
          <p className="font-mono text-[9px] uppercase tracking-[1em] text-neutral-600">This space is intentional</p>
        </div>
      </section>
    </div>
  );
};
