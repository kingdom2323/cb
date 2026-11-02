export type Alliance = 'ERA' | 'FFF' | 'TEA' | 'VIK';

export type BattleGroup =
  | 'Unassigned'
  | 'Castle'
  | 'Turret 1'
  | 'Turret 2'
  | 'Turret 3'
  | 'Inactive';

export const ALLIANCES: Alliance[] = ['ERA', 'FFF', 'TEA', 'VIK'];

export const BATTLE_GROUPS: BattleGroup[] = [
  'Unassigned',
  'Castle',
  'Turret 1',
  'Turret 2',
  'Turret 3',
  'Inactive',
];

// The 5 active groups displayed in Castle Battle view
export const ACTIVE_BATTLE_GROUPS: BattleGroup[] = [
  'Castle',
  'Turret 1',
  'Turret 2',
  'Turret 3',
  'Inactive',
];

export type TabType = 'all-players' | 'castle-battle' | 'kingdom-map';

export interface Player {
  id: string;
  name: string;
  rank: string; // e.g. Leader, R4, R3, R2, R1
  currentPower: number;
  tgLevel: string; // Formatted as TG1, TG2, TG3, or TC1 to TC30
  alliance: Alliance;
  battleGroup: BattleGroup;
  updatedAt?: string;
  notes?: string;
}

export type SortField = 'currentPower' | 'name' | 'rank' | 'tcLevel' | 'alliance' | 'battleGroup';
export type SortDirection = 'asc' | 'desc';

export interface RosterFilters {
  search: string;
  alliance: Alliance | 'ALL';
  rank: string | 'ALL';
  tcLevel: string | 'ALL';
  battleGroup: BattleGroup | 'ALL';
}

export interface GroupStats {
  group: BattleGroup;
  count: number;
  totalPower: number;
  topPower: number;
  allianceBreakdown: Record<Alliance, number>;
}

export interface AllianceStats {
  alliance: Alliance;
  count: number;
  totalPower: number;
  assignedCount: number;
}

// Exact database row structure matching Supabase players table
export interface SupabasePlayerRow {
  id: string;
  name: string;
  alliance: Alliance;
  rank: string;
  current_power: number;
  tg_level: string;
  battle_group: string | null;
}
