
import React from 'react';

export const BriefOverlay: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0A0A0A] p-6 md:p-24 animate-in slide-in-from-bottom duration-700">
      <div className="max-w-3xl mx-auto pt-24 pb-48">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.4em] mb-12 text-neutral-400">Visual Design Brief</h2>
        
        <div className="space-y-24">
          <section>
            <h3 className="text-4xl font-serif italic mb-6">01. Mood & Tone</h3>
            <p className="text-xl leading-relaxed text-neutral-800">
              The emotional core is <strong>Stoic Architecturalism</strong>. It rejects the frantic "hey-look-at-me" energy of Linktree. This is a digital residency, not a digital business card. It feels expensive, quiet, and decisive.
            </p>
          </section>

          <section>
            <h3 className="text-4xl font-serif italic mb-6">02. Materials</h3>
            <p className="text-xl leading-relaxed text-neutral-800">
              Background is <strong>Obsidian (#0A0A0A)</strong> with a custom SVG noise filter for a paper-like tactile grain. Typography leverages <strong>Playfair Display</strong> for display (editorial heft) and <strong>Inter</strong> for body (Stripe-level clarity).
            </p>
          </section>

          <section>
            <h3 className="text-4xl font-serif italic mb-6">03. Layout Philosophy</h3>
            <p className="text-xl leading-relaxed text-neutral-800">
              The canvas feels <strong>1000px wide</strong> but uses asymmetrical offsets. The hero visual isn't a banner—it's an anchor. Silence (empty space) is treated as a structural element rather than a lack of content.
            </p>
          </section>

          <section>
            <h3 className="text-4xl font-serif italic mb-6">04. Anti-Template Decisions</h3>
            <p className="text-xl leading-relaxed text-neutral-800">
              We deliberately reject:
              <br />&mdash; Rounded corners (everything is sharp/architectural)
              <br />&mdash; Vibrant gradients (colors are muted/monochrome)
              <br />&mdash; Floating buttons (everything is grounded in the grid)
            </p>
          </section>

          <section>
            <h3 className="text-4xl font-serif italic mb-6">05. Proof & Signals</h3>
            <p className="text-xl leading-relaxed text-neutral-800">
              Signals are treated with hairline borders and monospace metadata. No flashy badges. Credibility is whispered, never shouted.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
