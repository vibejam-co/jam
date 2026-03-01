import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, HelpCircle, Users } from 'lucide-react';

export interface AssetTrafficDraft {
  monthlyUniqueVisitors: string;
  monthlyUniqueVisitorsCount: number;
  analyticsProofUrl: string;
  hasChanges: boolean;
}

interface AssetTrafficFormProps {
  initialMonthlyUniqueVisitors?: number;
  initialAnalyticsProofUrl?: string;
  disabled?: boolean;
  onDraftChange?: (draft: AssetTrafficDraft) => void;
}

const sanitizeVisitorsInput = (value: string): string =>
  value.replace(/[^\d,]/g, '');

const parseVisitors = (value: string): number => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.round(parsed));
};

const formatVisitorsInput = (value: number): string => {
  const count = Math.max(0, Math.round(Number(value ?? 0)));
  return count > 0 ? count.toLocaleString('en-US') : '';
};

const AssetTrafficForm: React.FC<AssetTrafficFormProps> = ({
  initialMonthlyUniqueVisitors = 0,
  initialAnalyticsProofUrl = '',
  disabled = false,
  onDraftChange,
}) => {
  const [monthlyUniqueVisitors, setMonthlyUniqueVisitors] = useState(
    formatVisitorsInput(initialMonthlyUniqueVisitors),
  );
  const [analyticsProofUrl, setAnalyticsProofUrl] = useState(initialAnalyticsProofUrl);

  useEffect(() => {
    setMonthlyUniqueVisitors(formatVisitorsInput(initialMonthlyUniqueVisitors));
  }, [initialMonthlyUniqueVisitors]);

  useEffect(() => {
    setAnalyticsProofUrl(initialAnalyticsProofUrl);
  }, [initialAnalyticsProofUrl]);

  const draft = useMemo<AssetTrafficDraft>(() => {
    const monthlyUniqueVisitorsCount = parseVisitors(monthlyUniqueVisitors);
    const normalizedProof = String(analyticsProofUrl || '').trim();
    const normalizedInitialProof = String(initialAnalyticsProofUrl || '').trim();

    return {
      monthlyUniqueVisitors,
      monthlyUniqueVisitorsCount,
      analyticsProofUrl,
      hasChanges:
        monthlyUniqueVisitorsCount !== Math.max(0, Math.round(Number(initialMonthlyUniqueVisitors ?? 0)))
        || normalizedProof !== normalizedInitialProof,
    };
  }, [analyticsProofUrl, initialAnalyticsProofUrl, initialMonthlyUniqueVisitors, monthlyUniqueVisitors]);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-zinc-300" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Traffic Layer</p>
      </div>

      <label className="space-y-2 block">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Last 30 Days Unique Visitors</span>
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={monthlyUniqueVisitors}
            onChange={(event) => setMonthlyUniqueVisitors(sanitizeVisitorsInput(event.target.value))}
            placeholder="e.g. 12,500"
            disabled={disabled}
            className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-white font-mono-data focus:outline-none focus:border-white/30 disabled:opacity-50"
          />
        </div>
      </label>

      <label className="space-y-2 block">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Analytics Proof Link</span>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            <div className="pointer-events-none absolute left-1/2 top-5 z-50 hidden w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-[10px] font-medium leading-relaxed text-zinc-300 shadow-2xl group-hover:block">
              Buyers use verified traffic proof to estimate conversion rates and validate acquisition upside.
            </div>
          </div>
        </div>
        <input
          value={analyticsProofUrl}
          onChange={(event) => setAnalyticsProofUrl(event.target.value)}
          placeholder="https://plausible.io/... or https://loom.com/..."
          disabled={disabled}
          className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
        />
      </label>
    </div>
  );
};

export default AssetTrafficForm;

