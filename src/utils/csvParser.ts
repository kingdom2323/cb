import Papa from 'papaparse';
import { Player, Alliance, BattleGroup } from '../types/roster';
import { formatTcLevel } from './formatters';

export interface ParseResult {
  players: Player[];
  alliance: Alliance;
  fileName: string;
  rowCount: number;
  errors: string[];
}

/**
 * Detect alliance code from filename e.g. "ERA_members.csv" -> "ERA"
 */
export function detectAllianceFromFileName(fileName: string): Alliance | null {
  const upper = fileName.toUpperCase();
  if (upper.includes('ERA')) return 'ERA';
  if (upper.includes('FFF')) return 'FFF';
  if (upper.includes('TEA')) return 'TEA';
  if (upper.includes('VIK')) return 'VIK';
  return null;
}

/**
 * Robust CSV string or File parser
 */
export function parseAllianceCsv(
  csvContent: string,
  targetAlliance: Alliance,
  fileName: string = 'import.csv'
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const players: Player[] = [];
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          // Normalize column lookups
          const name = row['Name'] || row['name'] || row['Player Name'] || row['player_name'] || '';
          const id = row['ID'] || row['id'] || row['Player ID'] || row['player_id'] || '';
          const rank = row['Rank'] || row['rank'] || 'R1';
          
          const rawPower = row['Current power'] || row['Current Power'] || row['current_power'] || row['Power'] || row['power'] || '0';
          // Clean commas, spaces or dots from power
          const cleanPower = String(rawPower).replace(/[^\d]/g, '');
          const currentPower = parseInt(cleanPower, 10) || 0;

          const tgLevel =
            row['TC level'] ||
            row['TC Level'] ||
            row['tc_level'] ||
            row['TG level'] ||
            row['TG Level'] ||
            row['tg_level'] ||
            row['TG'] ||
            row['TC'] ||
            '';

          // Check if alliance column is already present in CSV, else use targetAlliance
          const rowAlliance = (row['Alliance'] || row['alliance'] || targetAlliance) as Alliance;
          const validAlliance: Alliance = ['ERA', 'FFF', 'TEA', 'VIK'].includes(rowAlliance)
            ? rowAlliance
            : targetAlliance;

          if (!name && !id) {
            errors.push(`Row ${index + 2}: Missing both Name and ID`);
            return;
          }

          players.push({
            id: String(id || `${validAlliance}-${index}-${Date.now()}`),
            name: String(name || 'Unknown Player').trim(),
            rank: String(rank || 'R1').trim(),
            currentPower,
            tgLevel: String(tgLevel || '').trim(),
            alliance: validAlliance,
            battleGroup: 'Unassigned',
            updatedAt: new Date().toISOString(),
          });
        });

        resolve({
          players,
          alliance: targetAlliance,
          fileName,
          rowCount: players.length,
          errors,
        });
      },
      error: (err: Error) => {
        resolve({
          players: [],
          alliance: targetAlliance,
          fileName,
          rowCount: 0,
          errors: [err.message],
        });
      },
    });
  });
}

/**
 * Export current roster to CSV string
 */
export function exportRosterToCsv(players: Player[]): string {
  const fields = ['Name', 'ID', 'Alliance', 'Rank', 'Current power', 'TC level', 'Battle Group'];
  const rows = players.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.id}"`,
    `"${p.alliance}"`,
    `"${p.rank}"`,
    p.currentPower,
    `"${formatTcLevel(p.tgLevel)}"`,
    `"${p.battleGroup}"`
  ]);

  return [fields.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, fileName: string, type: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
