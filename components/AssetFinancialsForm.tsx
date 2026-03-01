import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, LineChart } from 'lucide-react';

export interface AssetFinancialsDraft {
  operatingExpenses: string;
  operatingExpensesCents: number;
  expenseBreakdown: string;
  netProfitCents: number;
  profitMarginBps: number;
  profitMarginPercent: number;
  hasChanges: boolean;
}

interface AssetFinancialsFormProps {
  mrrCents: number;
  initialOperatingExpensesCents?: number;
  initialExpenseBreakdown?: string;
  disabled?: boolean;
  onDraftChange?: (draft: AssetFinancialsDraft) => void;
}

const centsToDollarInput = (cents: number): string => {
  const dollars = Number(cents ?? 0) / 100;
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return '';
  }
  return dollars.toFixed(2).replace(/\.00$/, '');
};

const parseExpenseInputToCents = (input: string): number => {
  const normalized = input.replace(/[$,\s]/g, '').trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.round(parsed * 100));
};

const formatCents = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format((Number(value) || 0) / 100);

const formatPercent = (bps: number): string => `${(bps / 100).toFixed(2)}%`;

const AssetFinancialsForm: React.FC<AssetFinancialsFormProps> = ({
  mrrCents,
  initialOperatingExpensesCents = 0,
  initialExpenseBreakdown = '',
  disabled = false,
  onDraftChange,
}) => {
  const [operatingExpenses, setOperatingExpenses] = useState(centsToDollarInput(initialOperatingExpensesCents));
  const [expenseBreakdown, setExpenseBreakdown] = useState(initialExpenseBreakdown);

  useEffect(() => {
    setOperatingExpenses(centsToDollarInput(initialOperatingExpensesCents));
  }, [initialOperatingExpensesCents]);

  useEffect(() => {
    setExpenseBreakdown(initialExpenseBreakdown);
  }, [initialExpenseBreakdown]);

  const draft = useMemo<AssetFinancialsDraft>(() => {
    const operatingExpensesCents = parseExpenseInputToCents(operatingExpenses);
    const netProfitCents = Math.round(Number(mrrCents ?? 0)) - operatingExpensesCents;
    const profitMarginBps = mrrCents > 0
      ? Math.round((netProfitCents / mrrCents) * 10_000)
      : 0;

    const initialBreakdown = String(initialExpenseBreakdown || '').trim();
    const nextBreakdown = String(expenseBreakdown || '').trim();

    return {
      operatingExpenses,
      operatingExpensesCents,
      expenseBreakdown: expenseBreakdown,
      netProfitCents,
      profitMarginBps,
      profitMarginPercent: profitMarginBps / 100,
      hasChanges:
        operatingExpensesCents !== Math.max(0, Math.round(Number(initialOperatingExpensesCents ?? 0)))
        || nextBreakdown !== initialBreakdown,
    };
  }, [expenseBreakdown, initialExpenseBreakdown, initialOperatingExpensesCents, mrrCents, operatingExpenses]);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-cyan-300" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Profitability Layer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Monthly Operating Expenses (USD)</span>
          <input
            value={operatingExpenses}
            onChange={(event) => setOperatingExpenses(event.target.value)}
            placeholder="e.g. 3200"
            disabled={disabled}
            className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white font-mono-data focus:outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
            <LineChart className="w-3 h-3 text-cyan-300" /> Live Margin Preview
          </p>
          <p className="text-xl font-mono-data font-bold text-white">{formatPercent(draft.profitMarginBps)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Net Profit: {formatCents(draft.netProfitCents)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Using verified MRR: {formatCents(mrrCents)}</p>
        </div>
      </div>

      <label className="space-y-2 block">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Expense Breakdown</span>
        <textarea
          value={expenseBreakdown}
          onChange={(event) => setExpenseBreakdown(event.target.value)}
          placeholder="Hosting $800, payroll $1,500, tools $300..."
          rows={3}
          disabled={disabled}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
        />
      </label>
    </div>
  );
};

export default AssetFinancialsForm;

