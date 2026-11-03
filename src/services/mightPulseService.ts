import { Player, Alliance, ALLIANCES } from '../types/roster';
import { CSV_BACKUP_DATA } from '../data/csvBackups';
import { parseAllianceCsv } from '../utils/csvParser';
import { rosterService, parsePowerValue } from './rosterService';

export const MIGHTPULSE_CONFIG = {
  // Target Netlify Serverless Function proxy to bypass browser CORS & protect API key
  netlifyEndpoint: '/.netlify/functions/mightpulse',
  kingdomId: '2323',
  timeoutMs: 15000,
};

export interface MightPulseMember {
  uid?: number;
  governor_id?: number;
  fid?: number;
  nick_name?: string;
  name?: string;
  power?: number;
  current_power?: number | string;
  town_center_level?: number;
  alliance_rank?: number;
  alliance_rank_label?: string;
  kid?: number;
  avatar_url?: string;
  kills?: number | null;
  alliance_tag?: string;
}

export interface MightPulseSyncResult {
  success: boolean;
  source: 'mightpulse' | 'csv_fallback';
  players: Player[];
  count: number;
  message: string;
  allianceBreakdown: Record<Alliance, number>;
  timestamp: string;
  errorDetails?: string;
}

/**
 * Format town center numeric level into TG/TC string format matching application standards:
 * - >= 45: TG3
 * - >= 40: TG2
 * - >= 35: TG1
 * - Standard: TC1 to TC30
 */
export function formatLevelFromTownCenter(tcLevel: number | undefined): string {
  if (tcLevel == null || isNaN(tcLevel)) return 'TC1';
  const num = Number(tcLevel);
  if (num >= 45) return 'TG3';
  if (num >= 40) return 'TG2';
  if (num >= 35) return 'TG1';
  return `TC${num}`;
}

/**
 * Convert MightPulse member row to standard Player object
 */
export function mapMightPulseMemberToPlayer(m: MightPulseMember, defaultAlliance: Alliance): Player {
  const allianceTag = (m.alliance_tag || defaultAlliance) as Alliance;
  const validAlliance: Alliance = ALLIANCES.includes(allianceTag) ? allianceTag : 'ERA';

  const id = String(m.governor_id || m.fid || m.uid || `${validAlliance}-${Math.random()}`);
  const name = String(m.nick_name || m.name || 'Unknown').replace(/\u00a0/g, ' ').trim();
  const rank = String(m.alliance_rank_label || (m.alliance_rank ? `R${m.alliance_rank}` : 'R1'))
    .replace(/\u00a0/g, ' ')
    .trim();

  // Robust power parsing: handles numeric integer (158540211) or formatted strings
  const rawPower = m.power ?? m.current_power ?? (m as any).Power ?? (m as any)['Current power'];
  const currentPower = parsePowerValue(rawPower);
  const tgLevel = formatLevelFromTownCenter(m.town_center_level);

  return {
    id,
    name,
    rank,
    currentPower,
    tgLevel,
    alliance: validAlliance,
    battleGroup: 'Unassigned', // preserved during Supabase sync
    updatedAt: new Date().toISOString(),
  };
}

export const mightPulseService = {
  /**
   * Fetch live kingdom data via Netlify Serverless Function proxy
   */
  async fetchLiveKingdomPlayers(): Promise<Player[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MIGHTPULSE_CONFIG.timeoutMs);

    try {
      const response = await fetch(MIGHTPULSE_CONFIG.netlifyEndpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Netlify proxy responded with HTTP ${response.status} (${response.statusText})`);
      }

      const json = await response.json();
      if (!json || !Array.isArray(json.members) || json.members.length === 0) {
        throw new Error('Netlify proxy returned invalid or empty members payload');
      }

      return json.members.map((m: MightPulseMember) =>
        mapMightPulseMemberToPlayer(m, (m.alliance_tag || 'ERA') as Alliance)
      );
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Parse local backup CSV files for ERA, FFF, TEA, and VIK.
   * Strictly used as a secondary fallback if the live API is unreachable.
   */
  async parseLocalCsvFallback(): Promise<Player[]> {
    const fallbackResults = await Promise.all(
      ALLIANCES.map(async (alliance) => {
        const rawCsv = CSV_BACKUP_DATA[alliance];
        if (!rawCsv) return [];
        const parsed = await parseAllianceCsv(rawCsv, alliance, `${alliance}_members.csv`);
        return parsed.players;
      })
    );

    return fallbackResults.flat();
  },

  /**
   * Prioritize MightPulse Data & Prevent CSV Overwrite:
   * 1. Try Netlify Serverless Function proxy to fetch live Kingdom 2323 data.
   * 2. If successful, ONLY process and update Supabase with the live MightPulse payload.
   *    Local CSV backups are NEVER merged or loaded on success.
   * 3. Local CSV backups act strictly as a secondary fallback inside catch block.
   */
  async syncKingdomData(preserveBattleGroups = true): Promise<MightPulseSyncResult> {
    let source: 'mightpulse' | 'csv_fallback' = 'mightpulse';
    let players: Player[] = [];
    let errorDetails: string | undefined;

    try {
      // 1. Primary path: Attempt live MightPulse API via Netlify Serverless Function proxy
      players = await this.fetchLiveKingdomPlayers();
      if (!Array.isArray(players) || players.length === 0) {
        throw new Error('MightPulse returned empty roster payload');
      }
      source = 'mightpulse';
    } catch (apiError: any) {
      // 2. Secondary fallback: Triggered ONLY in catch block when API fails or times out
      errorDetails = apiError?.message || String(apiError);
      console.warn('Netlify MightPulse proxy request failed, engaging local CSV backup fallback:', apiError);

      source = 'csv_fallback';
      players = await this.parseLocalCsvFallback();
    }

    // 3. Process and persist data to Supabase while strictly keeping sources isolated
    let syncedPlayers: Player[] = players;

    if (players.length > 0) {
      if (source === 'mightpulse') {
        // Exclusively sync live MightPulse payload (preserves battle groups, cleans stale alliance rows, updates cache)
        syncedPlayers = await rosterService.syncMightPulsePlayersToSupabase(players, preserveBattleGroups);
      } else {
        // Fallback CSV sync
        syncedPlayers = await rosterService.upsertPlayersToSupabase(players, preserveBattleGroups);
      }
    }

    // Compute alliance breakdown
    const allianceBreakdown: Record<Alliance, number> = {
      ERA: 0,
      FFF: 0,
      TEA: 0,
      VIK: 0,
    };
    for (const p of syncedPlayers) {
      if (allianceBreakdown[p.alliance] !== undefined) {
        allianceBreakdown[p.alliance] += 1;
      }
    }

    const message =
      source === 'mightpulse'
        ? `Successfully synchronized live data from MightPulse API via Netlify Proxy (Kingdom ${MIGHTPULSE_CONFIG.kingdomId}: ${syncedPlayers.length} players across ERA, FFF, TEA, VIK).`
        : `MightPulse API unreachable (${errorDetails || 'network error'}). Successfully synchronized from local CSV backup (${syncedPlayers.length} players).`;

    return {
      success: true,
      source,
      players: syncedPlayers,
      count: syncedPlayers.length,
      message,
      allianceBreakdown,
      timestamp: new Date().toISOString(),
      errorDetails,
    };
  },
};
