import React from 'react';
import { Heart, ShoppingBag, Target } from 'lucide-react';
import type { CanvasDigitalProduct } from '../../types';

interface ThemeMonetizationOverlayProps {
  tipJarEnabled: boolean;
  tipJarUrl?: string;
  products: CanvasDigitalProduct[];
  brandCollabsEnabled?: boolean;
  compact?: boolean;
  onOpenProducts?: () => void;
  onOpenBrandCollabs?: () => void;
  fixed?: boolean;
}

const normalizeUrl = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('www.') || trimmed.includes('.')) {
    return `https://${trimmed}`;
  }
  return null;
};

const ThemeMonetizationOverlay: React.FC<ThemeMonetizationOverlayProps> = ({
  tipJarEnabled,
  tipJarUrl,
  products,
  brandCollabsEnabled = false,
  compact = false,
  onOpenProducts,
  onOpenBrandCollabs,
  fixed = false,
}) => {
  const normalizedTipJarUrl = normalizeUrl(tipJarUrl);
  const hasProducts = products.length > 0;

  return (
    <div className={`${fixed ? 'fixed' : 'absolute'} z-30 pointer-events-none ${compact ? 'bottom-2 right-2' : 'bottom-4 right-4'}`}>
      <div className={`pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-black/55 backdrop-blur-md ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
        {tipJarEnabled && normalizedTipJarUrl && (
          <a
            href={normalizedTipJarUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/20 text-rose-200 transition-colors hover:bg-rose-500/35 ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
            title="Tip Jar"
          >
            <Heart className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </a>
        )}
        {hasProducts && (
          <button
            type="button"
            onClick={onOpenProducts}
            className={`relative inline-flex items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/20 text-sky-200 transition-colors hover:bg-sky-500/35 ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
            title="Digital Drops"
          >
            <ShoppingBag className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            <span className={`absolute -top-1 -right-1 rounded-full bg-white text-black font-bold ${compact ? 'px-1 text-[8px]' : 'px-1.5 text-[9px]'}`}>
              {products.length}
            </span>
          </button>
        )}
        {brandCollabsEnabled && (
          <button
            type="button"
            onClick={onOpenBrandCollabs}
            className={`inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-200 transition-colors hover:bg-emerald-500/35 ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
            title="Brand Collabs"
          >
            <Target className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ThemeMonetizationOverlay;
