import { Player, BattleGroup, Alliance, SupabasePlayerRow } from '../types/roster';
import { supabase } from './supabaseClient';
import { INITIAL_PLAYERS } from '../data/initialData';
import { formatTcLevel } from '../utils/formatters';

const STORAGE_KEY = 'kvk_roster_players_v3';

function normalizeBattleGroup(group: string | null | undefined): BattleGroup {
  if (!group) return 'Unassigned';
  if (group === 'Castle' || group === 'Castle Roster') return 'Castle';
  if (group === 'Turret 1') return 'Turret 1';
  if (group === 'Turret 2') return 'Turret 2';
  if (group === 'Turret 3') return 'Turret 3';
  if (group === 'Inactive') return 'Inactive';
  return 'Unassigned';
}

export function mapRowToPlayer(row: any): Player {
  return {
    id: String(row.id),
    name: String(row.name || 'Unknown'),
    alliance: (row.alliance as Alliance) || 'ERA',
    rank: String(row.rank || 'R1'),
    currentPower: Number(row.current_power || 0),
    tgLevel: formatTcLevel(row.tg_level || ''),
    battleGroup: normalizeBattleGroup(row.battle_group),
  };
}

export function mapPlayerToRow(p: Player, preserveGroup?: string | null): SupabasePlayerRow {
  const bg = preserveGroup !== undefined ? preserveGroup : p.battleGroup;
  return {
    id: p.id,
    name: p.name,
    alliance: p.alliance,
    rank: p.rank,
    current_power: p.currentPower,
    tg_level: formatTcLevel(p.tgLevel),
    battle_group: !bg || bg === 'Unassigned' ? null : bg,
  };
}

export const rosterService = {
  /**
   * Load all player records directly from Supabase
   */
  async fetchPlayersFromSupabase(): Promise<Player[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('current_power', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        return this.loadCachedPlayers();
      }

      if (data && data.length > 0) {
        const players = data.map(mapRowToPlayer);
        this.cachePlayers(players);
        return players;
      }
    } catch (err) {
      console.warn('Network error connecting to Supabase:', err);
    }

    return this.loadCachedPlayers();
  },

  /**
   * Update battle_group in Supabase in real-time
   */
  async updatePlayerBattleGroup(playerId: string, group: BattleGroup): Promise<boolean> {
    const dbValue = group === 'Unassigned' ? null : group;
    try {
      const { error } = await supabase
        .from('players')
        .update({ battle_group: dbValue })
        .eq('id', playerId);

      if (error) {
        console.error('Failed to update battle group on Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase update request failed:', err);
      return false;
    }
  },

  /**
   * Batch update multiple players' battle_group in Supabase in real-time
   */
  async batchUpdateBattleGroup(playerIds: string[], group: BattleGroup): Promise<boolean> {
    if (playerIds.length === 0) return true;
    const dbValue = group === 'Unassigned' ? null : group;
    try {
      const { error } = await supabase
        .from('players')
        .update({ battle_group: dbValue })
        .in('id', playerIds);

      if (error) {
        console.error('Failed to batch update battle groups on Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase batch update request failed:', err);
      return false;
    }
  },

  /**
   * Reset all battle allocations in Supabase back to null / unassigned
   */
  async resetAllAllocationsInSupabase(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ battle_group: null })
        .neq('id', '');

      if (error) {
        console.error('Failed to reset allocations in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase reset request failed:', err);
      return false;
    }
  },

  /**
   * Batch upsert players to Supabase directly, preserving existing assignments
   */
  async upsertPlayersToSupabase(
    incomingPlayers: Player[],
    preserveExistingGroups = true
  ): Promise<Player[]> {
    try {
      let existingGroupMap = new Map<string, string | null>();

      if (preserveExistingGroups) {
        const { data: existingRows } = await supabase
          .from('players')
          .select('id, battle_group');

        if (existingRows) {
          for (const row of existingRows) {
            if (row.battle_group) {
              existingGroupMap.set(row.id, row.battle_group);
            }
          }
        }
      }

      // Format incoming into database rows
      const rows: SupabasePlayerRow[] = incomingPlayers.map((p) => {
        const preservedGroup = existingGroupMap.get(p.id);
        const groupToUse = preservedGroup !== undefined ? preservedGroup : p.battleGroup;
        return mapPlayerToRow(p, groupToUse);
      });

      // Upsert in batches of 100
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('players')
          .upsert(chunk, { onConflict: 'id' });

        if (error) {
          throw error;
        }
      }

      // Refetch latest from Supabase
      return await this.fetchPlayersFromSupabase();
    } catch (err) {
      console.error('Error during Supabase batch upsert:', err);
      throw err;
    }
  },

  /**
   * Local storage cache fallback
   */
  cachePlayers(players: Player[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  loadCachedPlayers(): Player[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
    return INITIAL_PLAYERS.map((p) => ({
      ...p,
      tgLevel: formatTcLevel(p.tgLevel),
      battleGroup: normalizeBattleGroup(p.battleGroup),
    }));
  },
};
