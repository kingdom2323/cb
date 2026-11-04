import { Player } from './roster';

export type TroopTier = 'T10' | 'TG1' | 'TG2' | 'TG3';

export type CbParticipationStatus = 'FULL' | 'PARTIAL' | 'NONE';

export type MigrationDestination = 'ACTIVE_TEA' | 'VIK' | 'ONX';

export interface PlayerTroopTiers {
  infantry: TroopTier;
  cavalry: TroopTier;
  archers: TroopTier;
}

export interface TeaMigrationRecord {
  playerId: string;
  destination: MigrationDestination;
  cbStatus: CbParticipationStatus;
  troopTiers: PlayerTroopTiers;
  notes?: string;
  updatedAt: string;
}

export interface TeaMigrationPlayer extends Player {
  destination: MigrationDestination;
  cbStatus: CbParticipationStatus;
  troopTiers: PlayerTroopTiers;
  notes?: string;
}

export const TROOP_TIERS: TroopTier[] = ['T10', 'TG1', 'TG2', 'TG3'];

export const CB_STATUS_CONFIG: Record<
  CbParticipationStatus,
  { label: string; shortLabel: string; badge: string; border: string; bg: string }
> = {
  FULL: {
    label: 'Fully Participating',
    shortLabel: 'Full CB',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/40',
  },
  PARTIAL: {
    label: 'Partially Participating',
    shortLabel: 'Partial CB',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/40',
  },
  NONE: {
    label: 'Not Participating',
    shortLabel: 'No CB',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/40',
  },
};

export const DESTINATION_CONFIG: Record<
  MigrationDestination,
  { label: string; shortLabel: string; badge: string; color: string; cardBorder: string }
> = {
  ACTIVE_TEA: {
    label: 'Active TEA (Staying)',
    shortLabel: 'TEA Active',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    color: 'text-sky-400',
    cardBorder: 'border-slate-800 hover:border-sky-500/40',
  },
  VIK: {
    label: 'Migrate to VIK',
    shortLabel: 'To VIK',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    color: 'text-purple-400',
    cardBorder: 'border-purple-500/50 bg-purple-950/15',
  },
  ONX: {
    label: 'Migrate to ONX',
    shortLabel: 'To ONX',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    color: 'text-amber-400',
    cardBorder: 'border-amber-500/50 bg-amber-950/15',
  },
};
