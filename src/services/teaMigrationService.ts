import {
  TroopTier,
  CbParticipationStatus,
  MigrationDestination,
  PlayerTroopTiers,
  TeaMigrationRecord,
  TeaMigrationPlayer,
} from '../types/migration';
import { Player } from '../types/roster';
import { supabase } from './supabaseClient';
import { formatTcLevel } from '../utils/formatters';

const TEA_MIGRATION_STORAGE_KEY = 'kvk_tea_migration_records_v1';

// DB column value maps (Supabase stores lowercase strings)
const DEST_TO_DB: Record<MigrationDestination, string> = {
  ACTIVE_TEA: 'TEA',
  VIK: 'VIK',
  ONX: 'ONX',
};
const DB_TO_DEST: Record<string, MigrationDestination> = {
  TEA: 'ACTIVE_TEA',
  VIK: 'VIK',
  ONX: 'ONX',
};

const CB_TO_DB: Record<CbParticipationStatus, string> = {
  FULL: 'full',
  PARTIAL: 'partial',
  NONE: 'none',
};
const DB_TO_CB: Record<string, CbParticipationStatus> = {
  full: 'FULL',
  partial: 'PARTIAL',
  none: 'NONE',
};

const TIER_TO_DB: Record<TroopTier, string> = {
  T10: 't10',
  TG1: 'tg1',
  TG2: 'tg2',
  TG3: 'tg3',
};
const DB_TO_TIER: Record<string, TroopTier> = {
  t10: 'T10',
  tg1: 'TG1',
  tg2: 'TG2',
  tg3: 'TG3',
};

/**
 * Infer default troop tiers based on general Town Center / TrueGold level
 */
export function inferDefaultTroopTiers(tgLevel: string | undefined): PlayerTroopTiers {
  const formatted = formatTcLevel(tgLevel || '');
  if (formatted === 'TG3') {
    return { infantry: 'TG3', cavalry: 'TG3', archers: 'TG3' };
  }
  if (formatted === 'TG2') {
    return { infantry: 'TG2', cavalry: 'TG2', archers: 'TG2' };
  }
  if (formatted === 'TG1') {
    return { infantry: 'TG1', cavalry: 'TG1', archers: 'TG1' };
  }
  return { infantry: 'T10', cavalry: 'T10', archers: 'T10' };
}

/** Build a default record for a player who has no DB row yet */
function defaultRecord(playerId: string, tgLevel: string): TeaMigrationRecord {
  return {
    playerId,
    destination: 'ACTIVE_TEA',
    cbStatus: 'FULL',
    troopTiers: inferDefaultTroopTiers(tgLevel),
    updatedAt: new Date().toISOString(),
  };
}

/** Convert a Supabase row's migration fields into a TeaMigrationRecord */
function rowToRecord(row: Record<string, unknown>, playerId: string, tgLevel: string): TeaMigrationRecord {
  const dest = DB_TO_DEST[row.migration_status as string] ?? 'ACTIVE_TEA';
  const cb = DB_TO_CB[row.cb_status as string] ?? 'FULL';
  const infTier = DB_TO_TIER[row.infantry_tier as string] ?? null;
  const cavTier = DB_TO_TIER[row.cavalry_tier as string] ?? null;
  const archTier = DB_TO_TIER[row.archer_tier as string] ?? null;

  const defaultTiers = inferDefaultTroopTiers(tgLevel);
  return {
    playerId,
    destination: dest,
    cbStatus: cb,
    troopTiers: {
      infantry: infTier ?? defaultTiers.infantry,
      cavalry: cavTier ?? defaultTiers.cavalry,
      archers: archTier ?? defaultTiers.archers,
    },
    updatedAt: new Date().toISOString(),
  };
}

export const teaMigrationService = {
  // ---------------------------------------------------------------------------
  // localStorage fallback (used as optimistic cache while Supabase loads)
  // ---------------------------------------------------------------------------
  loadMigrationRecords(): Record<string, TeaMigrationRecord> {
    try {
      const raw = localStorage.getItem(TEA_MIGRATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, TeaMigrationRecord>;
        }
      }
    } catch (e) {
      console.warn('Failed to load TEA migration records from localStorage:', e);
    }
    return {};
  },

  saveMigrationRecords(records: Record<string, TeaMigrationRecord>): void {
    try {
      localStorage.setItem(TEA_MIGRATION_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save TEA migration records to localStorage:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // Supabase: load migration fields for all TEA players
  // ---------------------------------------------------------------------------
  async fetchMigrationRecordsFromSupabase(
    teaPlayers: Player[]
  ): Promise<Record<string, TeaMigrationRecord>> {
    if (teaPlayers.length === 0) return {};

    const ids = teaPlayers.map((p) => String(p.id).trim());

    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, migration_status, cb_status, infantry_tier, cavalry_tier, archer_tier')
        .in('id', ids);

      if (error) {
        console.warn('Supabase migration fetch error – falling back to localStorage:', error.message);
        return this.loadMigrationRecords();
      }

      const tgMap: Record<string, string> = {};
      teaPlayers.forEach((p) => {
        tgMap[String(p.id).trim()] = p.tgLevel;
      });

      const records: Record<string, TeaMigrationRecord> = {};
      for (const row of data ?? []) {
        const pid = String(row.id).trim();
        // Only hydrate if at least one migration column is set
        const hasMigrationData =
          row.migration_status != null ||
          row.cb_status != null ||
          row.infantry_tier != null ||
          row.cavalry_tier != null ||
          row.archer_tier != null;

        records[pid] = hasMigrationData
          ? rowToRecord(row as Record<string, unknown>, pid, tgMap[pid] ?? '')
          : defaultRecord(pid, tgMap[pid] ?? '');
      }

      // Persist hydrated data to localStorage as a cache
      this.saveMigrationRecords(records);
      return records;
    } catch (e) {
      console.warn('Unexpected error fetching migration records from Supabase:', e);
      return this.loadMigrationRecords();
    }
  },

  // ---------------------------------------------------------------------------
  // Supabase: persist a single player's migration fields
  // ---------------------------------------------------------------------------
  async persistPlayerRecord(
    playerId: string,
    record: TeaMigrationRecord
  ): Promise<void> {
    const cleanId = String(playerId).trim();
    try {
      const { error } = await supabase
        .from('players')
        .update({
          migration_status: DEST_TO_DB[record.destination] ?? 'TEA',
          cb_status: CB_TO_DB[record.cbStatus] ?? 'full',
          infantry_tier: TIER_TO_DB[record.troopTiers.infantry] ?? 't10',
          cavalry_tier: TIER_TO_DB[record.troopTiers.cavalry] ?? 't10',
          archer_tier: TIER_TO_DB[record.troopTiers.archers] ?? 't10',
        })
        .eq('id', cleanId);

      if (error) {
        console.warn(`Supabase persist error for player ${cleanId}:`, error.message);
      }
    } catch (e) {
      console.warn('Unexpected error persisting migration record to Supabase:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // Supabase: batch persist multiple players' migration fields
  // ---------------------------------------------------------------------------
  async batchPersistRecords(
    records: Record<string, TeaMigrationRecord>,
    playerIds: string[]
  ): Promise<void> {
    const rows = playerIds.map((id) => {
      const cleanId = String(id).trim();
      const rec = records[cleanId];
      if (!rec) return null;
      return {
        id: cleanId,
        migration_status: DEST_TO_DB[rec.destination] ?? 'TEA',
        cb_status: CB_TO_DB[rec.cbStatus] ?? 'full',
        infantry_tier: TIER_TO_DB[rec.troopTiers.infantry] ?? 't10',
        cavalry_tier: TIER_TO_DB[rec.troopTiers.cavalry] ?? 't10',
        archer_tier: TIER_TO_DB[rec.troopTiers.archers] ?? 't10',
      };
    }).filter(Boolean) as Record<string, unknown>[];

    if (rows.length === 0) return;

    try {
      // Upsert each row individually to avoid RLS issues with batch upsert
      await Promise.all(
        rows.map((row) =>
          supabase
            .from('players')
            .update({
              migration_status: row.migration_status,
              cb_status: row.cb_status,
              infantry_tier: row.infantry_tier,
              cavalry_tier: row.cavalry_tier,
              archer_tier: row.archer_tier,
            })
            .eq('id', row.id as string)
        )
      );
    } catch (e) {
      console.warn('Unexpected error batch-persisting migration records:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // Local helpers (synchronous, optimistic UI)
  // ---------------------------------------------------------------------------
  getRecordForPlayer(
    playerId: string,
    tgLevel: string,
    existingRecords?: Record<string, TeaMigrationRecord>
  ): TeaMigrationRecord {
    const cleanId = String(playerId).trim();
    const records = existingRecords || this.loadMigrationRecords();
    return records[cleanId] || defaultRecord(cleanId, tgLevel);
  },

  /**
   * Merge TEA players from the main roster with their migration records
   */
  mergeTeaPlayers(
    teaRoster: Player[],
    records: Record<string, TeaMigrationRecord>
  ): TeaMigrationPlayer[] {
    return teaRoster.map((player) => {
      const cleanId = String(player.id).trim();
      const rec = records[cleanId] || defaultRecord(cleanId, player.tgLevel);

      return {
        ...player,
        id: cleanId,
        destination: rec.destination || 'ACTIVE_TEA',
        cbStatus: rec.cbStatus || 'FULL',
        troopTiers: rec.troopTiers || inferDefaultTroopTiers(player.tgLevel),
        notes: rec.notes || '',
      };
    });
  },

  /**
   * Update a single player's migration settings in localStorage (optimistic)
   * Returns updated records map. Caller must separately call persistPlayerRecord().
   */
  updatePlayerRecord(
    playerId: string,
    patch: Partial<TeaMigrationRecord>,
    tgLevel: string
  ): Record<string, TeaMigrationRecord> {
    const cleanId = String(playerId).trim();
    const records = this.loadMigrationRecords();
    const current = records[cleanId] || defaultRecord(cleanId, tgLevel);

    records[cleanId] = {
      ...current,
      ...patch,
      playerId: cleanId,
      updatedAt: new Date().toISOString(),
    };

    this.saveMigrationRecords(records);
    return records;
  },

  /**
   * Batch update multiple players' destination or CB status (optimistic).
   * Caller must separately call batchPersistRecords().
   */
  batchUpdateRecords(
    playerIds: string[],
    patch: Partial<TeaMigrationRecord>,
    defaultTgLevels: Record<string, string>
  ): Record<string, TeaMigrationRecord> {
    const records = this.loadMigrationRecords();
    const now = new Date().toISOString();

    for (const id of playerIds) {
      const cleanId = String(id).trim();
      const current = records[cleanId] || defaultRecord(cleanId, defaultTgLevels[cleanId] ?? '');

      records[cleanId] = {
        ...current,
        ...patch,
        playerId: cleanId,
        updatedAt: now,
      };
    }

    this.saveMigrationRecords(records);
    return records;
  },

  /**
   * Generate clean formatted text output for copying migration lists to clipboard
   */
  generateCopyList(
    players: TeaMigrationPlayer[],
    destination: MigrationDestination
  ): string {
    const filtered = players.filter((p) => p.destination === destination);
    const label =
      destination === 'VIK'
        ? 'VIK Migration List'
        : destination === 'ONX'
        ? 'ONX Migration List'
        : 'TEA Active Roster';

    const lines = [
      `--- ${label} ---`,
      ...filtered.map((p) => {
        const cb =
          p.cbStatus === 'FULL'
            ? 'Full'
            : p.cbStatus === 'PARTIAL'
            ? 'Partial'
            : 'None';
        return `${p.name} - CB: ${cb}`;
      }),
    ];

    return lines.join('\n');
  },
};
