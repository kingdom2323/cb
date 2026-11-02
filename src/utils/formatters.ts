import { Alliance, BattleGroup } from '../types/roster';

/**
 * Format a power number compactly, e.g. 253,230,044 -> "253.2M" or "253,230,044"
 */
export function formatPower(power: number): string {
  if (power == null || isNaN(power)) return '0';
  if (power >= 1_000_000_000) {
    return (power / 1_000_000_000).toFixed(2) + 'B';
  }
  if (power >= 1_000_000) {
    return (power / 1_000_000).toFixed(1) + 'M';
  }
  if (power >= 1_000) {
    return (power / 1_000).toFixed(0) + 'K';
  }
  return power.toLocaleString();
}

/**
 * Format with commas for full exact count
 */
export function formatFullNumber(num: number): string {
  if (num == null || isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Format TC Level strictly according to requirements:
 * - If string contains TG: strictly "TG1", "TG2", or "TG3"
 * - If string does not contain TG: standard levels e.g. "TC1" through "TC30"
 */
export function formatTcLevel(rawLevel: string): string {
  if (!rawLevel) return 'TC1';
  const str = String(rawLevel).trim();
  const upper = str.toUpperCase();

  if (upper.includes('TG3')) return 'TG3';
  if (upper.includes('TG2')) return 'TG2';
  if (upper.includes('TG1')) return 'TG1';

  const numMatch = str.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    return `TC${num}`;
  }

  if (upper.startsWith('TC')) return upper;
  return `TC${str}`;
}

/**
 * Style for TC Level badges
 */
export function getTcLevelBadgeStyle(formattedLevel: string): string {
  if (formattedLevel === 'TG3') {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
  }
  if (formattedLevel === 'TG2') {
    return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold';
  }
  if (formattedLevel === 'TG1') {
    return 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold';
  }
  return 'bg-slate-800 text-slate-300 border border-slate-700 font-medium';
}

/**
 * Alliance badge styling configuration
 */
export const ALLIANCE_STYLES: Record<Alliance, {
  badge: string;
  pill: string;
  border: string;
  text: string;
  bgLight: string;
}> = {
  ERA: {
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold',
    pill: 'bg-emerald-500 text-white',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bgLight: 'bg-emerald-950/20',
  },
  FFF: {
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold',
    pill: 'bg-amber-500 text-slate-950',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    bgLight: 'bg-amber-950/20',
  },
  TEA: {
    badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold',
    pill: 'bg-sky-500 text-white',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    bgLight: 'bg-sky-950/20',
  },
  VIK: {
    badge: 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold',
    pill: 'bg-purple-500 text-white',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    bgLight: 'bg-purple-950/20',
  },
};

/**
 * Battle Group styling configuration for all 6 groups
 */
export const GROUP_STYLES: Record<BattleGroup, {
  badge: string;
  cardBorder: string;
  headerBg: string;
  accent: string;
  tagColor: string;
}> = {
  'Castle': {
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    cardBorder: 'border-rose-500/40 hover:border-rose-500/60',
    headerBg: 'bg-rose-950/30 text-rose-300 border-rose-500/30',
    accent: 'text-rose-400',
    tagColor: 'bg-rose-500',
  },
  'Turret 1': {
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    cardBorder: 'border-blue-500/40 hover:border-blue-500/60',
    headerBg: 'bg-blue-950/30 text-blue-300 border-blue-500/30',
    accent: 'text-blue-400',
    tagColor: 'bg-blue-500',
  },
  'Turret 2': {
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    cardBorder: 'border-violet-500/40 hover:border-violet-500/60',
    headerBg: 'bg-violet-950/30 text-violet-300 border-violet-500/30',
    accent: 'text-violet-400',
    tagColor: 'bg-violet-500',
  },
  'Turret 3': {
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    cardBorder: 'border-amber-500/40 hover:border-amber-500/60',
    headerBg: 'bg-amber-950/30 text-amber-300 border-amber-500/30',
    accent: 'text-amber-400',
    tagColor: 'bg-amber-500',
  },
  'Inactive': {
    badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    cardBorder: 'border-zinc-800 hover:border-zinc-700',
    headerBg: 'bg-zinc-950 text-zinc-400 border-zinc-800',
    accent: 'text-zinc-400',
    tagColor: 'bg-zinc-600',
  },
  'Unassigned': {
    badge: 'bg-slate-700/40 text-slate-400 border border-slate-700/60',
    cardBorder: 'border-slate-800 hover:border-slate-700',
    headerBg: 'bg-slate-900/60 text-slate-300 border-slate-800',
    accent: 'text-slate-400',
    tagColor: 'bg-slate-500',
  },
};

/**
 * Rank display & color coding
 */
export function getRankBadgeStyle(rank: string): string {
  const r = (rank || '').toUpperCase();
  if (r === 'LEADER' || r === 'R5') {
    return 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold';
  }
  if (r === 'R4') {
    return 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 font-semibold';
  }
  if (r === 'R3') {
    return 'bg-blue-400/20 text-blue-300 border border-blue-400/25';
  }
  if (r === 'R2') {
    return 'bg-slate-600/30 text-slate-300 border border-slate-600/30';
  }
  return 'bg-slate-700/25 text-slate-400 border border-slate-700/30';
}
