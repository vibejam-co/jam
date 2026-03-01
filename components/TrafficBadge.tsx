import React from 'react';
import { Globe } from 'lucide-react';

export const formatTrafficCompact = (value: number): string => {
  const count = Math.max(0, Math.round(Number(value ?? 0)));
  if (count >= 1_000_000) {
    const m = Math.round((count / 1_000_000) * 10) / 10;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (count >= 1_000) {
    const k = Math.round((count / 1_000) * 10) / 10;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(count);
};

interface TrafficBadgeProps {
  monthlyUniqueVisitors: number | null | undefined;
}

const TrafficBadge: React.FC<TrafficBadgeProps> = ({ monthlyUniqueVisitors }) => {
  const visitors = Math.max(0, Math.round(Number(monthlyUniqueVisitors ?? 0)));
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-200">
      <Globe className="w-3 h-3" />
      {formatTrafficCompact(visitors)} Visits
    </span>
  );
};

export default TrafficBadge;

