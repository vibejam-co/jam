import React from 'react';
import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';

interface ProfitMarginBadgeProps {
  profitMarginBps: number | null | undefined;
}

const formatPercent = (bps: number): string => `${(bps / 100).toFixed(0)}%`;

const ProfitMarginBadge: React.FC<ProfitMarginBadgeProps> = ({ profitMarginBps }) => {
  if (typeof profitMarginBps !== 'number' || !Number.isFinite(profitMarginBps)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
        <CircleDashed className="w-3 h-3" />
        Margin N/A
      </span>
    );
  }

  if (profitMarginBps >= 7500) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-300">
        <CircleCheck className="w-3 h-3" />
        Margin {formatPercent(profitMarginBps)}
      </span>
    );
  }

  if (profitMarginBps >= 4000) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/35 bg-yellow-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-yellow-200">
        <CircleAlert className="w-3 h-3" />
        Margin {formatPercent(profitMarginBps)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-200">
      <CircleAlert className="w-3 h-3" />
      Margin {formatPercent(profitMarginBps)}
    </span>
  );
};

export default ProfitMarginBadge;

