import React, { useRef, useEffect } from 'react';
import { PlayerWithCoord, TACTICAL_LANDMARKS, GRID_SIZE, MapCoordinate } from '../../utils/mapUtils';
import { ALLIANCE_STYLES } from '../../utils/formatters';

interface MinimapProps {
  players: PlayerWithCoord[];
  viewCenter: MapCoordinate;
  visibleRange: { minX: number; maxX: number; minY: number; maxY: number };
  onNavigate: (coord: MapCoordinate) => void;
  selectedPlayerId?: string | null;
}

const MINIMAP_SIZE = 160; // 160x160 px square

export const Minimap: React.FC<MinimapProps> = ({
  players,
  viewCenter,
  visibleRange,
  onNavigate,
  selectedPlayerId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Subtle grid lines (every 200 tiles)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 0.5;
    const step = (MINIMAP_SIZE / GRID_SIZE) * 200;
    for (let i = step; i < MINIMAP_SIZE; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, MINIMAP_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(MINIMAP_SIZE, i);
      ctx.stroke();
    }

    // Battle zone boundary (central contested radius ~100 tiles around 597, 597)
    const scale = MINIMAP_SIZE / GRID_SIZE;
    const castleX = 597 * scale;
    const castleY = 597 * scale;
    const zoneRadius = 90 * scale;

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)'; // rose-500
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(castleX, castleY, zoneRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw all player dots (color-coded by alliance)
    for (const p of players) {
      const px = p.coord.x * scale;
      const py = p.coord.y * scale;

      let color = '#38bdf8'; // TEA sky
      if (p.alliance === 'ERA') color = '#34d399'; // emerald
      else if (p.alliance === 'FFF') color = '#fbbf24'; // amber
      else if (p.alliance === 'VIK') color = '#c084fc'; // purple

      ctx.fillStyle = color;
      ctx.fillRect(px - 0.75, py - 0.75, 1.5, 1.5);
    }

    // Draw landmark markers
    // Castle
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(castleX - 3, castleY - 3, 6, 6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(castleX - 3, castleY - 3, 6, 6);

    // Turrets
    for (const landmark of Object.values(TACTICAL_LANDMARKS)) {
      if (landmark.id === 'castle') continue;
      const lx = landmark.coord.x * scale;
      const ly = landmark.coord.y * scale;
      ctx.fillStyle = landmark.color;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Selected player highlight
    if (selectedPlayerId) {
      const sp = players.find((p) => p.id === selectedPlayerId);
      if (sp) {
        const sx = sp.coord.x * scale;
        const sy = sp.coord.y * scale;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw camera viewport rectangle
    const vx = visibleRange.minX * scale;
    const vy = visibleRange.minY * scale;
    const vw = (visibleRange.maxX - visibleRange.minX) * scale;
    const vh = (visibleRange.maxY - visibleRange.minY) * scale;

    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 1.2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeRect(vx, vy, vw, vh);
  }, [players, viewCenter, visibleRange, selectedPlayerId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scale = GRID_SIZE / MINIMAP_SIZE;
    const targetX = Math.round(clickX * scale);
    const targetY = Math.round(clickY * scale);

    onNavigate({
      x: Math.max(0, Math.min(GRID_SIZE - 1, targetX)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, targetY)),
    });
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 shadow-2xl flex flex-col items-center gap-1.5 select-none font-sans">
      <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold text-slate-400">
        <span className="uppercase tracking-wider">Kingdom Radar</span>
        <span className="text-slate-500 font-mono">1200x1200</span>
      </div>

      <div className="relative border border-slate-800 rounded overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          onClick={handleClick}
          className="block"
          title="Click to jump camera to coordinates"
        />
      </div>

      {/* Mini Legend */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 w-full text-[9px] text-slate-400 font-medium px-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          <span>Castle (597,597)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          <span>Turret 1</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
          <span>Turret 2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span>Turret 3</span>
        </div>
      </div>
    </div>
  );
};
