export type RankTier =
  | 'zenith'
  | 'star'
  | 'trophy'
  | 'top100'
  | 'top1k'
  | 'top10k'
  | 'top100k';

export const parseRankValue = (rank: string | number | null | undefined): number | null => {
  if (typeof rank === 'number' && Number.isFinite(rank) && rank > 0) {
    return Math.floor(rank);
  }

  if (typeof rank === 'string') {
    const parsed = Number.parseInt(rank, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

export const formatRank = (rankValue: number): string => {
  if (rankValue < 100) {
    return String(rankValue).padStart(2, '0');
  }

  return String(rankValue);
};

export const getRankTier = (rankValue: number): RankTier => {
  if (rankValue <= 3) return 'zenith';
  if (rankValue <= 10) return 'star';
  if (rankValue <= 50) return 'trophy';
  if (rankValue <= 100) return 'top100';
  if (rankValue <= 1000) return 'top1k';
  if (rankValue <= 10000) return 'top10k';
  return 'top100k';
};
