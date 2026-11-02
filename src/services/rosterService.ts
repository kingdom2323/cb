import { Player, BattleGroup, Alliance, SupabasePlayerRow } from '../types/roster';
import { supabase } from './supabaseClient';
import { INITIAL_PLAYERS } from '../data/initialData';
import { formatTcLevel } from '../utils/formatters';

const STORAGE_KEY = 'kvk_roster_players_v3';

function normalizeBattleGroup(group: string | null | undefined): BattleGroup {
  if (!group) return 'Unassigned';
  const clean = String(group).trim();
  if (clean === 'Castle' || clean === 'Castle Roster') return 'Castle';
  if (clean === 'Turret 1') return 'Turret 1';
  if (clean === 'Turret 2') return 'Turret 2';
  if (clean === 'Turret 3') return 'Turret 3';
  if (clean === 'Inactive') return 'Inactive';
  return 'Unassigned';
}

export function mapRowToPlayer(row: any): Player {
  if (!row || typeof row !== 'object') {
    return {
      id: String(Math.random()),
      name: 'Unknown',
      alliance: 'ERA',
      rank: 'R1',
      currentPower: 0,
      tgLevel: 'TC1',
      battleGroup: 'Unassigned',
    };
  }

  const validAlliances: Alliance[] = ['ERA', 'FFF', 'TEA', 'VIK'];
  const alliance: Alliance = validAlliances.includes(row.alliance)
    ? row.alliance
    : 'ERA';

  return {
    id: String(row.id || `p-${Math.random().toString(36).substring(2, 9)}`),
    name: String(row.name || 'Unknown'),
    alliance,
    rank: String(row.rank || 'R1'),
    currentPower: typeof row.current_power === 'number'
      ? row.current_power
      : parseInt(String(row.current_power || '0').replace(/[^\d]/g, ''), 10) || 0,
    tgLevel: formatTcLevel(row.tg_level || ''),
    battleGroup: normalizeBattleGroup(row.battle_group),
  };
}

export function mapPlayerToRow(p: Player, preserveGroup?: string | null): SupabasePlayerRow {
  const bg = preserveGroup !== undefined ? preserveGroup : p.battleGroup;
  return {
    id: String(p.id),
    name: String(p.name || 'Unknown'),
    alliance: p.alliance || 'ERA',
    rank: String(p.rank || 'R1'),
    current_power: Number(p.currentPower) || 0,
    tg_level: formatTcLevel(p.tgLevel || ''),
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

      if (Array.isArray(data) && data.length > 0) {
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
    if (!Array.isArray(playerIds) || playerIds.length === 0) return true;
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
      if (!Array.isArray(incomingPlayers) || incomingPlayers.length === 0) {
        return this.loadCachedPlayers();
      }

      let existingGroupMap = new Map<string, string | null>();

      if (preserveExistingGroups) {
        try {
          const { data: existingRows } = await supabase
            .from('players')
            .select('id, battle_group');

          if (Array.isArray(existingRows)) {
            for (const row of existingRows) {
              if (row && row.battle_group) {
                existingGroupMap.set(row.id, row.battle_group);
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch existing groups for merge:', e);
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
      if (Array.isArray(players)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
      }
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
          return parsed.map(mapRowToPlayer);
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }

    const fallback = Array.isArray(INITIAL_PLAYERS) ? INITIAL_PLAYERS : [];
    return fallback.map((p) => mapRowToPlayer({
      id: p.id,
      name: p.name,
      alliance: p.alliance,
      rank: p.rank,
      current_power: p.currentPower,
      tg_level: p.tgLevel,
      battle_group: p.battleGroup,
    }));
  },
};
