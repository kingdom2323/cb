import { Player, BattleGroup, Alliance, ALLIANCES, SupabasePlayerRow } from '../types/roster';
import { supabase } from './supabaseClient';
import { INITIAL_PLAYERS } from '../data/initialData';
import { formatTcLevel } from '../utils/formatters';

const STORAGE_KEY = 'kvk_roster_players_v3';
const COUNTER_TEAM_STORAGE_KEY = 'kvk_counter_team_player_ids';

let supabaseHasCounterTeamColumn: boolean | null = null;

export function getLocalCounterTeamSet(): Set<string> {
  try {
    const raw = localStorage.getItem(COUNTER_TEAM_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    }
  } catch {}
  return new Set();
}

export function saveLocalCounterTeamSet(set: Set<string>): void {
  try {
    localStorage.setItem(COUNTER_TEAM_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Robust power value parser: handles raw numbers, strings with commas,
 * abbreviated numbers (e.g. 253.2M, 1.5B, 850K), and nulls.
 */
export function parsePowerValue(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') {
    if (isNaN(raw)) return 0;
    return Math.round(raw);
  }
  const str = String(raw).trim().toUpperCase();
  if (!str) return 0;
  if (str.endsWith('B')) {
    return Math.round(parseFloat(str.replace(/[^\d.]/g, '')) * 1_000_000_000);
  }
  if (str.endsWith('M')) {
    return Math.round(parseFloat(str.replace(/[^\d.]/g, '')) * 1_000_000);
  }
  if (str.endsWith('K')) {
    return Math.round(parseFloat(str.replace(/[^\d.]/g, '')) * 1_000);
  }
  const digits = str.replace(/[^\d]/g, '');
  return parseInt(digits, 10) || 0;
}

export function normalizeBattleGroup(group: string | null | undefined): BattleGroup {
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
  const localCounterSet = getLocalCounterTeamSet();
  if (!row || typeof row !== 'object') {
    return {
      id: String(Math.random()),
      name: 'Unknown',
      alliance: 'ERA',
      rank: 'R1',
      currentPower: 0,
      tgLevel: 'TC1',
      battleGroup: 'Unassigned',
      isCounterTeam: false,
    };
  }

  const validAlliances: Alliance[] = ['ERA', 'FFF', 'TEA', 'VIK'];
  const alliance: Alliance = validAlliances.includes(row.alliance)
    ? row.alliance
    : 'ERA';

  const cleanName = String(row.name || 'Unknown').replace(/\u00a0/g, ' ').trim();
  const rowId = String(row.id || `p-${Math.random().toString(36).substring(2, 9)}`);

  const isCounter = row.is_counter_team !== undefined && row.is_counter_team !== null
    ? Boolean(row.is_counter_team)
    : Boolean(row.isCounterTeam || row.counter_team || localCounterSet.has(rowId));

  return {
    id: rowId,
    name: cleanName,
    alliance,
    rank: String(row.rank || 'R1').replace(/\u00a0/g, ' ').trim(),
    currentPower: parsePowerValue(row.current_power ?? row.currentPower),
    tgLevel: formatTcLevel(row.tg_level || row.tgLevel || ''),
    battleGroup: normalizeBattleGroup(row.battle_group ?? row.battleGroup),
    isCounterTeam: isCounter,
  };
}

export function mapPlayerToRow(
  p: Player,
  preserveGroup?: string | null,
  preserveCounter?: boolean | null
): SupabasePlayerRow {
  const bg = preserveGroup !== undefined ? preserveGroup : p.battleGroup;
  const isCounter = preserveCounter !== undefined && preserveCounter !== null ? preserveCounter : Boolean(p.isCounterTeam);
  const row: SupabasePlayerRow = {
    id: String(p.id),
    name: String(p.name || 'Unknown').replace(/\u00a0/g, ' ').trim(),
    alliance: p.alliance || 'ERA',
    rank: String(p.rank || 'R1').replace(/\u00a0/g, ' ').trim(),
    current_power: parsePowerValue(p.currentPower),
    tg_level: formatTcLevel(p.tgLevel || ''),
    battle_group: !bg || bg === 'Unassigned' ? null : bg,
    is_counter_team: isCounter,
  };
  return row;
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
        // Sync local storage counter set with Supabase values
        const counterSet = new Set<string>();
        for (const p of players) {
          if (p.isCounterTeam) {
            counterSet.add(p.id);
          }
        }
        saveLocalCounterTeamSet(counterSet);
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
   * Update is_counter_team in Supabase in real-time
   */
  async updatePlayerCounterTeam(playerId: string, isCounterTeam: boolean): Promise<boolean> {
    const localSet = getLocalCounterTeamSet();
    if (isCounterTeam) {
      localSet.add(String(playerId));
    } else {
      localSet.delete(String(playerId));
    }
    saveLocalCounterTeamSet(localSet);

    try {
      const { error } = await supabase
        .from('players')
        .update({ is_counter_team: isCounterTeam })
        .eq('id', playerId);

      if (error) {
        console.error('Failed to update counter team status on Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase update counter team request failed:', err);
      return false;
    }
  },

  /**
   * Batch update multiple players' is_counter_team in Supabase in real-time
   */
  async batchUpdateCounterTeam(playerIds: string[], isCounterTeam: boolean): Promise<boolean> {
    if (!Array.isArray(playerIds) || playerIds.length === 0) return true;

    const localSet = getLocalCounterTeamSet();
    for (const id of playerIds) {
      if (isCounterTeam) {
        localSet.add(String(id));
      } else {
        localSet.delete(String(id));
      }
    }
    saveLocalCounterTeamSet(localSet);

    try {
      const { error } = await supabase
        .from('players')
        .update({ is_counter_team: isCounterTeam })
        .in('id', playerIds);

      if (error) {
        console.error('Failed to batch update counter team status on Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase batch update counter team request failed:', err);
      return false;
    }
  },

  /**
   * Dedicated synchronization for live MightPulse data:
   * 1. Preserves existing Supabase battle group allocations
   * 2. Upserts all incoming live players to Supabase
   * 3. Prunes stale alliance players who left ERA, FFF, TEA, VIK
   * 4. Updates local cache exclusively with live players
   * 5. Returns strictly the live synced player list (no CSV merge)
   */
  async syncMightPulsePlayersToSupabase(
    incomingPlayers: Player[],
    preserveExistingGroups = true
  ): Promise<Player[]> {
    if (!Array.isArray(incomingPlayers) || incomingPlayers.length === 0) {
      throw new Error('No live players provided to sync');
    }

    const existingGroupMap = new Map<string, string | null>();
    const existingCounterMap = new Map<string, boolean>();

    if (preserveExistingGroups) {
      try {
        const { data: existingRows, error: fetchErr } = await supabase
          .from('players')
          .select('id, battle_group, is_counter_team');

        if (Array.isArray(existingRows)) {
          supabaseHasCounterTeamColumn = true;
          for (const row of existingRows) {
            if (row) {
              if (row.battle_group) existingGroupMap.set(String(row.id), row.battle_group);
              if (row.is_counter_team !== undefined && row.is_counter_team !== null) {
                existingCounterMap.set(String(row.id), Boolean(row.is_counter_team));
              }
            }
          }
        } else if (fetchErr) {
          supabaseHasCounterTeamColumn = false;
          const { data: fallbackRows } = await supabase
            .from('players')
            .select('id, battle_group');
          if (Array.isArray(fallbackRows)) {
            for (const row of fallbackRows) {
              if (row && row.battle_group) existingGroupMap.set(String(row.id), row.battle_group);
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch existing groups for merge:', e);
      }
    }

    // Merge preserved battle groups and counter team status directly into incoming player objects
    const localCounterSet = getLocalCounterTeamSet();
    const syncedPlayers: Player[] = incomingPlayers.map((p) => {
      const preservedGroup = existingGroupMap.get(p.id);
      const groupToUse = preservedGroup !== undefined && preservedGroup !== null
        ? normalizeBattleGroup(preservedGroup)
        : p.battleGroup;
      const preservedCounter = existingCounterMap.has(p.id)
        ? Boolean(existingCounterMap.get(p.id))
        : localCounterSet.has(p.id) || Boolean(p.isCounterTeam);
      return {
        ...p,
        battleGroup: groupToUse,
        isCounterTeam: preservedCounter,
      };
    });

    // Format incoming into database rows
    const rows: SupabasePlayerRow[] = syncedPlayers.map((p) =>
      mapPlayerToRow(p, p.battleGroup, p.isCounterTeam)
    );

    // Upsert in batches of 100 with fallback if column is not yet present in Supabase
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('players')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('is_counter_team')) {
          supabaseHasCounterTeamColumn = false;
          const fallbackChunk = chunk.map(({ is_counter_team, ...rest }) => rest);
          const { error: fallbackError } = await supabase
            .from('players')
            .upsert(fallbackChunk, { onConflict: 'id' });
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      } else {
        supabaseHasCounterTeamColumn = true;
      }
    }

    // Prune stale players from ERA, FFF, TEA, VIK who are no longer in the live roster
    try {
      const liveIdSet = new Set(incomingPlayers.map((p) => String(p.id)));
      const { data: allDbRows } = await supabase
        .from('players')
        .select('id, alliance');

      if (Array.isArray(allDbRows)) {
        const staleIds = allDbRows
          .filter((row) => ALLIANCES.includes(row.alliance as Alliance) && !liveIdSet.has(String(row.id)))
          .map((row) => String(row.id));

        if (staleIds.length > 0) {
          console.info(`Pruning ${staleIds.length} stale alliance member(s) from Supabase:`, staleIds);
          for (let i = 0; i < staleIds.length; i += 50) {
            await supabase.from('players').delete().in('id', staleIds.slice(i, i + 50));
          }
        }
      }
    } catch (cleanErr) {
      console.warn('Error while cleaning stale players:', cleanErr);
    }

    // Sort players by power descending
    syncedPlayers.sort((a, b) => b.currentPower - a.currentPower);

    // Sync local storage counter set
    const updatedCounterSet = new Set<string>();
    for (const p of syncedPlayers) {
      if (p.isCounterTeam) updatedCounterSet.add(p.id);
    }
    saveLocalCounterTeamSet(updatedCounterSet);

    // Cache ONLY the live MightPulse synced players
    this.cachePlayers(syncedPlayers);

    return syncedPlayers;
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
      let existingCounterMap = new Map<string, boolean>();

      if (preserveExistingGroups) {
        try {
          const { data: existingRows, error: fetchErr } = await supabase
            .from('players')
            .select('id, battle_group, is_counter_team');

          if (Array.isArray(existingRows)) {
            supabaseHasCounterTeamColumn = true;
            for (const row of existingRows) {
              if (row) {
                if (row.battle_group) existingGroupMap.set(String(row.id), row.battle_group);
                if (row.is_counter_team !== undefined && row.is_counter_team !== null) {
                  existingCounterMap.set(String(row.id), Boolean(row.is_counter_team));
                }
              }
            }
          } else if (fetchErr) {
            supabaseHasCounterTeamColumn = false;
            const { data: fallbackRows } = await supabase
              .from('players')
              .select('id, battle_group');
            if (Array.isArray(fallbackRows)) {
              for (const row of fallbackRows) {
                if (row && row.battle_group) existingGroupMap.set(String(row.id), row.battle_group);
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch existing groups for merge:', e);
        }
      }

      // Format incoming into database rows
      const localCounterSet = getLocalCounterTeamSet();
      const syncedPlayers: Player[] = incomingPlayers.map((p) => {
        const preservedGroup = existingGroupMap.get(p.id);
        const groupToUse = preservedGroup !== undefined && preservedGroup !== null
          ? normalizeBattleGroup(preservedGroup)
          : p.battleGroup;
        const preservedCounter = existingCounterMap.has(p.id)
          ? Boolean(existingCounterMap.get(p.id))
          : localCounterSet.has(p.id) || Boolean(p.isCounterTeam);
        return {
          ...p,
          battleGroup: groupToUse,
          isCounterTeam: preservedCounter,
        };
      });

      const rows: SupabasePlayerRow[] = syncedPlayers.map((p) =>
        mapPlayerToRow(p, p.battleGroup, p.isCounterTeam)
      );

      // Upsert in batches of 100 with fallback
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('players')
          .upsert(chunk, { onConflict: 'id' });

        if (error) {
          if (error.code === 'PGRST204' || error.message?.includes('is_counter_team')) {
            supabaseHasCounterTeamColumn = false;
            const fallbackChunk = chunk.map(({ is_counter_team, ...rest }) => rest);
            const { error: fallbackError } = await supabase
              .from('players')
              .upsert(fallbackChunk, { onConflict: 'id' });
            if (fallbackError) throw fallbackError;
          } else {
            throw error;
          }
        } else {
          supabaseHasCounterTeamColumn = true;
        }
      }

      syncedPlayers.sort((a, b) => b.currentPower - a.currentPower);

      // Sync local storage counter set
      const updatedCounterSet = new Set<string>();
      for (const p of syncedPlayers) {
        if (p.isCounterTeam) updatedCounterSet.add(p.id);
      }
      saveLocalCounterTeamSet(updatedCounterSet);

      this.cachePlayers(syncedPlayers);

      return syncedPlayers;
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
