import { BattleGroup, Player } from '../types/roster';

export interface MapCoordinate {
  x: number;
  y: number;
}

export type FootprintType = 'city_2x2' | 'hq_3x3' | 'beartrap_3x3';

export interface TacticalLandmark {
  id: string;
  name: string;
  shortName: string;
  group: BattleGroup;
  coord: MapCoordinate;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  bgRgba: string;
  description: string;
  type: 'castle' | 'turret' | 'camp';
}

export const GRID_SIZE = 1200; // 0 to 1199

/**
 * 1:1 Kingshot Mirror Tactical Landmarks
 */
export const TACTICAL_LANDMARKS: Record<string, TacticalLandmark> = {
  castle: {
    id: 'castle',
    name: "King's Castle",
    shortName: 'Castle',
    group: 'Castle',
    coord: { x: 597, y: 597 },
    width: 6,
    height: 6,
    color: '#f43f5e', // rose-500
    borderColor: '#e11d48',
    bgRgba: 'rgba(225, 29, 72, 0.25)',
    description: 'Central Kingshot fortress at fixed coordinates (597, 597). Contested core of KvK.',
    type: 'castle',
  },
  turret1: {
    id: 'turret1',
    name: 'Turret 1 (North)',
    shortName: 'Turret 1',
    group: 'Turret 1',
    coord: { x: 597, y: 567 },
    width: 4,
    height: 4,
    color: '#3b82f6', // blue-500
    borderColor: '#2563eb',
    bgRgba: 'rgba(37, 99, 235, 0.25)',
    description: 'Northern defensive battery. 30 tiles Manhattan distance from King\'s Castle.',
    type: 'turret',
  },
  turret2: {
    id: 'turret2',
    name: 'Turret 2 (South-East)',
    shortName: 'Turret 2',
    group: 'Turret 2',
    coord: { x: 622, y: 612 },
    width: 4,
    height: 4,
    color: '#8b5cf6', // violet-500
    borderColor: '#7c3aed',
    bgRgba: 'rgba(124, 58, 237, 0.25)',
    description: 'South-Eastern flank battery. 40 tiles Manhattan distance from King\'s Castle.',
    type: 'turret',
  },
  turret3: {
    id: 'turret3',
    name: 'Turret 3 (South-West)',
    shortName: 'Turret 3',
    group: 'Turret 3',
    coord: { x: 572, y: 612 },
    width: 4,
    height: 4,
    color: '#f59e0b', // amber-500
    borderColor: '#d97706',
    bgRgba: 'rgba(217, 119, 6, 0.25)',
    description: 'South-Western flank battery. 40 tiles Manhattan distance from King\'s Castle.',
    type: 'turret',
  },
  inactive: {
    id: 'inactive',
    name: 'Inactive Reserve Camp',
    shortName: 'Inactive Camp',
    group: 'Inactive',
    coord: { x: 597, y: 647 },
    width: 4,
    height: 4,
    color: '#71717a', // zinc-500
    borderColor: '#52525b',
    bgRgba: 'rgba(82, 82, 91, 0.25)',
    description: 'Southern staging ground for reserve and inactive forces outside contested battle sanctum.',
    type: 'camp',
  },
};

/**
 * Standard footprints defined in Kingshot
 */
export const FOOTPRINT_SPECS: Record<
  FootprintType,
  { label: string; width: number; height: number; description: string; color: string }
> = {
  city_2x2: {
    label: 'Town Center (City)',
    width: 2,
    height: 2,
    description: 'Standard 2x2 footprint for player cities/town centers.',
    color: '#38bdf8', // sky-400
  },
  hq_3x3: {
    label: 'Alliance HQ',
    width: 3,
    height: 3,
    description: '3x3 footprint for Alliance Fortress HQ.',
    color: '#34d399', // emerald-400
  },
  beartrap_3x3: {
    label: 'Bear Trap',
    width: 3,
    height: 3,
    description: '3x3 footprint for Alliance Bear Trap building.',
    color: '#fbbf24', // amber-400
  },
};

/**
 * Manhattan distance calculation: |x1 - x2| + |y1 - y2|
 */
export function getManhattanDistance(p1: MapCoordinate, p2: MapCoordinate): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Approximate march time in seconds based on Manhattan distance
 * Standard cavalry march ~ 1 tile per 1.5s
 */
export function estimateMarchSeconds(distanceTiles: number, speedMultiplier: number = 1): number {
  return Math.round((distanceTiles * 1.5) / speedMultiplier);
}

export function formatMarchTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

/**
 * Generate organized 2x2 grid slots around a center coordinate
 */
function generateGarrisonSlots(
  center: MapCoordinate,
  excludeWidth: number,
  excludeHeight: number,
  maxSlots: number = 120
): MapCoordinate[] {
  const slots: MapCoordinate[] = [];
  const occupied = new Set<string>();

  // Mark landmark footprint as occupied
  const halfW = Math.ceil(excludeWidth / 2);
  const halfH = Math.ceil(excludeHeight / 2);
  for (let x = center.x - halfW; x <= center.x + halfW; x++) {
    for (let y = center.y - halfH; y <= center.y + halfH; y++) {
      occupied.add(`${x},${y}`);
    }
  }

  // Generate concentric rings of 2x2 city slots (spacing by 2 tiles)
  let ringRadius = Math.max(halfW, halfH) + 2;

  while (slots.length < maxSlots && ringRadius < 50) {
    const minX = center.x - ringRadius;
    const maxX = center.x + ringRadius;
    const minY = center.y - ringRadius;
    const maxY = center.y + ringRadius;

    // Top and Bottom rows
    for (let x = minX; x <= maxX; x += 2) {
      for (const y of [minY, maxY]) {
        const key = `${x},${y}`;
        if (!occupied.has(key) && x >= 2 && x <= GRID_SIZE - 4 && y >= 2 && y <= GRID_SIZE - 4) {
          occupied.add(key);
          // Also mark the other 3 tiles of 2x2
          occupied.add(`${x + 1},${y}`);
          occupied.add(`${x},${y + 1}`);
          occupied.add(`${x + 1},${y + 1}`);
          slots.push({ x, y });
          if (slots.length >= maxSlots) break;
        }
      }
      if (slots.length >= maxSlots) break;
    }

    // Left and Right columns
    for (let y = minY + 2; y <= maxY - 2; y += 2) {
      for (const x of [minX, maxX]) {
        const key = `${x},${y}`;
        if (!occupied.has(key) && x >= 2 && x <= GRID_SIZE - 4 && y >= 2 && y <= GRID_SIZE - 4) {
          occupied.add(key);
          occupied.add(`${x + 1},${y}`);
          occupied.add(`${x},${y + 1}`);
          occupied.add(`${x + 1},${y + 1}`);
          slots.push({ x, y });
          if (slots.length >= maxSlots) break;
        }
      }
      if (slots.length >= maxSlots) break;
    }

    ringRadius += 2;
  }

  return slots;
}

// Precomputed garrison slots for each landmark zone
const GARRISON_SLOTS_CACHE: Record<BattleGroup, MapCoordinate[]> = {
  'Castle': generateGarrisonSlots(TACTICAL_LANDMARKS.castle.coord, 6, 6, 160),
  'Turret 1': generateGarrisonSlots(TACTICAL_LANDMARKS.turret1.coord, 4, 4, 100),
  'Turret 2': generateGarrisonSlots(TACTICAL_LANDMARKS.turret2.coord, 4, 4, 100),
  'Turret 3': generateGarrisonSlots(TACTICAL_LANDMARKS.turret3.coord, 4, 4, 100),
  'Inactive': generateGarrisonSlots(TACTICAL_LANDMARKS.inactive.coord, 4, 4, 140),
  'Unassigned': [],
};

/**
 * Assign coordinates to players based on their battle group and power rank
 */
export interface PlayerWithCoord extends Player {
  coord: MapCoordinate;
  distanceToCastle: number;
}

export function computePlayerCoordinates(players: Player[]): PlayerWithCoord[] {
  // Group players by battleGroup
  const grouped: Record<BattleGroup, Player[]> = {
    'Castle': [],
    'Turret 1': [],
    'Turret 2': [],
    'Turret 3': [],
    'Inactive': [],
    'Unassigned': [],
  };

  for (const player of players) {
    const group = player.battleGroup || 'Unassigned';
    if (grouped[group]) {
      grouped[group].push(player);
    } else {
      grouped['Unassigned'].push(player);
    }
  }

  // Sort each group descending by power so strongest players are in front/inner defense
  for (const group of Object.keys(grouped) as BattleGroup[]) {
    grouped[group].sort((a, b) => b.currentPower - a.currentPower);
  }

  const castleCoord = TACTICAL_LANDMARKS.castle.coord;
  const result: PlayerWithCoord[] = [];

  // Assign coordinates for active groups
  for (const group of ['Castle', 'Turret 1', 'Turret 2', 'Turret 3', 'Inactive'] as BattleGroup[]) {
    const slots = GARRISON_SLOTS_CACHE[group];
    const groupPlayers = grouped[group];

    groupPlayers.forEach((player, idx) => {
      const coord = slots[idx] || {
        x: Math.min(GRID_SIZE - 2, Math.max(2, slots[0]?.x || 597) + (idx % 10) * 2),
        y: Math.min(GRID_SIZE - 2, Math.max(2, slots[0]?.y || 597) + Math.floor(idx / 10) * 2),
      };
      result.push({
        ...player,
        coord,
        distanceToCastle: getManhattanDistance(coord, castleCoord),
      });
    });
  }

  // Unassigned players stationed along staging line or perimeter
  const unassignedBaseX = 540;
  const unassignedBaseY = 670;
  grouped['Unassigned'].forEach((player, idx) => {
    const coord: MapCoordinate = {
      x: unassignedBaseX + (idx % 25) * 2,
      y: unassignedBaseY + Math.floor(idx / 25) * 2,
    };
    result.push({
      ...player,
      coord,
      distanceToCastle: getManhattanDistance(coord, castleCoord),
    });
  });

  return result;
}
