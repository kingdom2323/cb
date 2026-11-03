import { Player, Alliance, ALLIANCES } from '../types/roster';
import { CSV_BACKUP_DATA } from '../data/csvBackups';
import { parseAllianceCsv } from '../utils/csvParser';
import { rosterService } from './rosterService';

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
 * Format town center level numeric into TG/TC string format
 */
function formatLevelFromTownCenter(tcLevel: number | undefined): string {
  if (tcLevel == null || isNaN(tcLevel)) return 'TC1';
  const num = Number(tcLevel);
  if (num >= 45) return '45 (TG3)';
  if (num >= 40) return '40 (TG2)';
  if (num >= 35) return '35 (TG1)';
  return `TC${num}`;
}

/**
 * Convert MightPulse member row to standard Player object
 */
function mapMightPulseMemberToPlayer(m: MightPulseMember, defaultAlliance: Alliance): Player {
  const allianceTag = (m.alliance_tag || defaultAlliance) as Alliance;
  const validAlliance: Alliance = ALLIANCES.includes(allianceTag) ? allianceTag : 'ERA';

  const id = String(m.governor_id || m.fid || m.uid || `${validAlliance}-${Math.random()}`);
  const name = String(m.nick_name || m.name || 'Unknown').trim();
  const rank = String(m.alliance_rank_label || (m.alliance_rank ? `R${m.alliance_rank}` : 'R1')).trim();
  const currentPower = typeof m.power === 'number' ? m.power : parseInt(String(m.power || 0), 10) || 0;
  const tgLevel = formatLevelFromTownCenter(m.town_center_level);

  return {
    id,
    name,
    rank,
    currentPower,
    tgLevel,
    alliance: validAlliance,
    battleGroup: 'Unassigned', // preserved during Supabase upsert
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
   * Parse local backup CSV files for ERA, FFF, TEA, and VIK
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

    const players = fallbackResults.flat();
    return players;
  },

  /**
   * Execute full synchronization: Try Netlify MightPulse Serverless Function first;
   * If it fails or times out, seamlessly fall back to local CSVs;
   * Then upsert the players directly into the Supabase database.
   */
  async syncKingdomData(preserveBattleGroups = true): Promise<MightPulseSyncResult> {
    let source: 'mightpulse' | 'csv_fallback' = 'mightpulse';
    let players: Player[] = [];
    let errorDetails: string | undefined;

    try {
      // 1. Attempt Netlify Serverless Function proxy
      players = await this.fetchLiveKingdomPlayers();
      source = 'mightpulse';
    } catch (apiError: any) {
      // 2. Automatically fall back to Local CSV Backup
      errorDetails = apiError?.message || String(apiError);
      console.warn('Netlify MightPulse proxy request failed, engaging local CSV backup fallback:', apiError);

      source = 'csv_fallback';
      players = await this.parseLocalCsvFallback();
    }

    // 3. Upsert data directly into Supabase players table
    if (players.length > 0) {
      await rosterService.upsertPlayersToSupabase(players, preserveBattleGroups);
    }

    // Compute alliance breakdown
    const allianceBreakdown: Record<Alliance, number> = {
      ERA: 0,
      FFF: 0,
      TEA: 0,
      VIK: 0,
    };
    for (const p of players) {
      if (allianceBreakdown[p.alliance] !== undefined) {
        allianceBreakdown[p.alliance] += 1;
      }
    }

    const message =
      source === 'mightpulse'
        ? `Successfully synchronized live data from MightPulse API via Netlify Proxy (Kingdom ${MIGHTPULSE_CONFIG.kingdomId}: ${players.length} players across ERA, FFF, TEA, VIK).`
        : `MightPulse API unreachable (${errorDetails || 'network error'}). Successfully synchronized from local CSV backup (${players.length} players).`;

    return {
      success: true,
      source,
      players,
      count: players.length,
      message,
      allianceBreakdown,
      timestamp: new Date().toISOString(),
      errorDetails,
    };
  },
};
