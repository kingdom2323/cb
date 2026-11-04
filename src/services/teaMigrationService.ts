import {
  TroopTier,
  CbParticipationStatus,
  MigrationDestination,
  PlayerTroopTiers,
  TeaMigrationRecord,
  TeaMigrationPlayer,
} from '../types/migration';
import { Player } from '../types/roster';
import { formatTcLevel } from '../utils/formatters';

const TEA_MIGRATION_STORAGE_KEY = 'kvk_tea_migration_records_v1';

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

export const teaMigrationService = {
  /**
   * Load all migration records from localStorage
   */
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

  /**
   * Save all migration records to localStorage
   */
  saveMigrationRecords(records: Record<string, TeaMigrationRecord>): void {
    try {
      localStorage.setItem(TEA_MIGRATION_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save TEA migration records to localStorage:', e);
    }
  },

  /**
   * Get or create a record for a specific player
   */
  getRecordForPlayer(
    playerId: string,
    tgLevel: string,
    existingRecords?: Record<string, TeaMigrationRecord>
  ): TeaMigrationRecord {
    const cleanId = String(playerId).trim();
    const records = existingRecords || this.loadMigrationRecords();
    const existing = records[cleanId];

    if (existing) {
      return existing;
    }

    const defaultTiers = inferDefaultTroopTiers(tgLevel);
    return {
      playerId: cleanId,
      destination: 'ACTIVE_TEA',
      cbStatus: 'FULL',
      troopTiers: defaultTiers,
      updatedAt: new Date().toISOString(),
    };
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
      const rec = records[cleanId] || this.getRecordForPlayer(cleanId, player.tgLevel, records);

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
   * Update a single player's migration settings
   */
  updatePlayerRecord(
    playerId: string,
    patch: Partial<TeaMigrationRecord>,
    tgLevel: string
  ): Record<string, TeaMigrationRecord> {
    const cleanId = String(playerId).trim();
    const records = this.loadMigrationRecords();
    const current = records[cleanId] || this.getRecordForPlayer(cleanId, tgLevel, records);

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
   * Batch update multiple players' destination or CB status
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
      const current =
        records[cleanId] || this.getRecordForPlayer(cleanId, defaultTgLevels[cleanId] || '', records);

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
