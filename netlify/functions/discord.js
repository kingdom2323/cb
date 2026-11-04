/**
 * Netlify Serverless Function: Discord Webhook Proxy for /migrate page
 *
 * POST /.netlify/functions/discord
 * Body: { destination: 'VIK' | 'ONX', players: Array<{ name, cbStatus }> }
 *
 * The webhook URL is stored server-side in a Netlify environment variable
 * (DISCORD_WEBHOOK_URL) so it never appears in the client bundle.
 */

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  'https://discord.com/api/webhooks/1567649078266036285/ALByuHB_5zrCCMKMR1F3IfqMx7nWMYH86VlUdQCxZpbJSt5oyDweYRFW6FptZtC3Zy3Z';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function cbLabel(status) {
  if (status === 'FULL') return 'Full';
  if (status === 'PARTIAL') return 'Partial';
  return 'None';
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    };
  }

  const { destination, players } = body;

  if (!destination || !Array.isArray(players)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Missing destination or players array' }),
    };
  }

  const label =
    destination === 'VIK' ? 'VIK Migration List' : destination === 'ONX' ? 'ONX Migration List' : 'TEA Active Roster';

  const listLines = players
    .map((p) => `${p.name} - CB: ${cbLabel(p.cbStatus)}`)
    .join('\n');

  const messageContent = players.length === 0
    ? `**--- ${label} ---**\n*(No players in this list)*`
    : `**--- ${label} ---**\n\`\`\`\n${listLines}\n\`\`\`\n*${players.length} player${players.length !== 1 ? 's' : ''} - Kingdom 2323*`;

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: messageContent }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Discord webhook error:', res.status, errText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: `Discord API error: ${res.status}` }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, sent: players.length }),
    };
  } catch (err) {
    console.error('Discord proxy error:', err);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: err.message || 'Failed to reach Discord' }),
    };
  }
};
