/**
 * Netlify Serverless Function Proxy for MightPulse API
 * Bypasses browser CORS restrictions and secures API key
 */

const MIGHTPULSE_BASE = 'https://api.mightpulse.com';
const API_KEY = process.env.MIGHTPULSE_API_KEY || 'kss_0oRgcYQLGaiVkq66XHC_OI2q2d8Y4wach7udiAKk0cQ';
const KINGDOM_ID = '2323';
const ALLIANCES = ['ERA', 'FFF', 'TEA', 'VIK'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const allianceParam = params.alliance || params.tag;

    // If an individual alliance is requested (e.g. ?alliance=ERA)
    if (allianceParam) {
      const tag = allianceParam.toUpperCase();
      const url = `${MIGHTPULSE_BASE}/v1/alliances/${KINGDOM_ID}/${tag}?include=info,roster`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'X-Api-Key': API_KEY,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {
          statusCode: res.status,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            ok: false,
            error: `MightPulse API error: ${res.status} ${res.statusText}`,
          }),
        };
      }

      const data = await res.json();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(data),
      };
    }

    // Default: fetch all 4 alliances (ERA, FFF, TEA, VIK) for Kingdom 2323 in parallel
    const allianceResults = await Promise.all(
      ALLIANCES.map(async (tag) => {
        const url = `${MIGHTPULSE_BASE}/v1/alliances/${KINGDOM_ID}/${tag}?include=info,roster`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'X-Api-Key': API_KEY,
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch alliance ${tag}: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const members = (data.members || []).map((m) => ({
          ...m,
          alliance_tag: tag,
        }));

        return {
          tag,
          alliance: data.alliance,
          members,
        };
      })
    );

    const allMembers = allianceResults.flatMap((r) => r.members);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        kid: Number(KINGDOM_ID),
        source: 'mightpulse_netlify_proxy',
        alliances: ALLIANCES,
        members: allMembers,
        count: allMembers.length,
        allianceDetails: allianceResults.reduce((acc, r) => {
          acc[r.tag] = r.alliance;
          return acc;
        }, {}),
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Netlify MightPulse Proxy Error:', error);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Error proxying MightPulse API',
        source: 'mightpulse_netlify_proxy',
      }),
    };
  }
};
