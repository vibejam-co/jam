import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const parseNumber = (value: string | null, fallback: number): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampTitle = (value: string | null): string => {
  const fallback = 'VibeJam Verified Asset';
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    return fallback;
  }
  return normalized.slice(0, 100);
};

const formatUsd = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);

const formatMargin = (value: number): string => `${Math.round(value * 10) / 10}%`;

export default function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = clampTitle(searchParams.get('title'));
    const mrr = Math.max(0, parseNumber(searchParams.get('mrr'), 0));
    const askingPrice = Math.max(0, parseNumber(searchParams.get('askingPrice'), 0));
    const margin = Math.max(0, parseNumber(searchParams.get('margin'), 0));

    return new ImageResponse(
      (
        <div
          tw="flex h-full w-full flex-col bg-[#030507] text-white"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(24, 167, 255, 0.20), transparent 46%), radial-gradient(circle at 88% 84%, rgba(212, 175, 55, 0.24), transparent 42%), linear-gradient(140deg, #030507 0%, #05070d 42%, #020305 100%)',
          }}
        >
          <div tw="flex items-center justify-between px-[68px] pt-[54px]">
            <div tw="text-[34px] font-bold tracking-[-0.02em] text-white">VibeJam</div>
            <div tw="rounded-full border border-white/20 bg-white/8 px-5 py-2 text-[20px] text-zinc-200">Marketplace</div>
          </div>

          <div tw="flex flex-1 flex-col justify-between px-[68px] pb-[58px] pt-[30px]">
            <div>
              <div tw="mb-4 inline-flex rounded-full border border-emerald-300/35 bg-emerald-400/15 px-4 py-2 text-[18px] font-semibold text-emerald-100">
                Verified Revenue
              </div>
              <div tw="max-w-[1020px] text-[66px] font-bold leading-[1.05] tracking-[-0.03em] text-white">{title}</div>
            </div>

            <div tw="grid grid-cols-3 gap-5">
              <div tw="rounded-3xl border border-white/14 bg-black/35 px-6 py-5">
                <div tw="text-[17px] uppercase tracking-[0.14em] text-zinc-300">MRR</div>
                <div tw="mt-2 text-[40px] font-bold text-emerald-200">{formatUsd(mrr)}/mo</div>
              </div>

              <div tw="rounded-3xl border border-white/14 bg-black/35 px-6 py-5">
                <div tw="text-[17px] uppercase tracking-[0.14em] text-zinc-300">Asking Price</div>
                <div tw="mt-2 text-[40px] font-bold text-[#f6d77c]">{formatUsd(askingPrice)}</div>
              </div>

              <div tw="rounded-3xl border border-white/14 bg-black/35 px-6 py-5">
                <div tw="text-[17px] uppercase tracking-[0.14em] text-zinc-300">Profit Margin</div>
                <div tw="mt-2 text-[40px] font-bold text-cyan-200">{formatMargin(margin)}</div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to render OG image.';
    return new Response(message, { status: 500 });
  }
}
