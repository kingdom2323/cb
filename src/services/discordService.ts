import { TeaMigrationPlayer, MigrationDestination } from '../types/migration';

const DISCORD_NETLIFY_ENDPOINT = '/.netlify/functions/discord';

export interface DiscordSendResult {
  ok: boolean;
  sent?: number;
  error?: string;
}

/**
 * Send a migration list (VIK or ONX) to Discord via the Netlify serverless proxy.
 * Falls back to a direct browser fetch if the proxy is unavailable (dev mode).
 */
export async function sendMigrationListToDiscord(
  players: TeaMigrationPlayer[],
  destination: MigrationDestination
): Promise<DiscordSendResult> {
  const filtered = players
    .filter((p) => p.destination === destination)
    .map((p) => ({ name: p.name, cbStatus: p.cbStatus }));

  try {
    const res = await fetch(DISCORD_NETLIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, players: filtered }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, sent: data.sent ?? filtered.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: msg };
  }
}
