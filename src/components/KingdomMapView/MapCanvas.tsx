import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlayerWithCoord,
  TACTICAL_LANDMARKS,
  TacticalLandmark,
  GRID_SIZE,
  MapCoordinate,
  getManhattanDistance,
  estimateMarchSeconds,
  formatMarchTime,
  FootprintType,
  FOOTPRINT_SPECS,
} from '../../utils/mapUtils';
import { PlayerPin } from './PlayerPin';
import { BattleGroup } from '../../types/roster';
import { GROUP_STYLES } from '../../utils/formatters';
import { Castle, Shield, Crosshair, Navigation, Ruler, Plus, Minus } from 'lucide-react';

interface MapCanvasProps {
  players: PlayerWithCoord[];
  camera: MapCoordinate;
  onCameraChange: (coord: MapCoordinate) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: PlayerWithCoord) => void;
  isAdmin: boolean;
  onUpdateGroup: (playerId: string, group: BattleGroup) => Promise<void>;
  measureMode: boolean;
  footprintMode: FootprintType | null;
  allianceFilter: string;
  groupFilter: string;
}

const BASE_TILE_SIZE = 22; // Base tile size in px at zoom = 1

export const MapCanvas: React.FC<MapCanvasProps> = ({
  players,
  camera,
  onCameraChange,
  zoom,
  onZoomChange,
  selectedPlayerId,
  onSelectPlayer,
  isAdmin,
  onUpdateGroup,
  measureMode,
  footprintMode,
  allianceFilter,
  groupFilter,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 597, y: 597 });

  // Touch pan/pinch-to-zoom state
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [touchCameraStart, setTouchCameraStart] = useState({ x: 597, y: 597 });
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null);

  const [hoverTile, setHoverTile] = useState<MapCoordinate | null>(null);
  const [measureA, setMeasureA] = useState<MapCoordinate | null>(null);
  const [measureB, setMeasureB] = useState<MapCoordinate | null>(null);

  const effectiveTileSize = BASE_TILE_SIZE * zoom;

  // Track viewport container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute visible tile coordinate bounds for viewport culling
  const visibleRange = useMemo(() => {
    const tilesX = dimensions.width / effectiveTileSize;
    const tilesY = dimensions.height / effectiveTileSize;

    const minX = Math.max(0, Math.floor(camera.x - tilesX / 2));
    const maxX = Math.min(GRID_SIZE - 1, Math.ceil(camera.x + tilesX / 2));
    const minY = Math.max(0, Math.floor(camera.y - tilesY / 2));
    const maxY = Math.min(GRID_SIZE - 1, Math.ceil(camera.y + tilesY / 2));

    return { minX, maxX, minY, maxY };
  }, [camera, effectiveTileSize, dimensions]);

  // Coordinate to screen pixel conversion
  const coordToScreen = useCallback(
    (coord: MapCoordinate) => {
      const screenCenterX = dimensions.width / 2;
      const screenCenterY = dimensions.height / 2;

      const screenX = screenCenterX + (coord.x - camera.x) * effectiveTileSize;
      const screenY = screenCenterY + (coord.y - camera.y) * effectiveTileSize;

      return { x: screenX, y: screenY };
    },
    [camera, effectiveTileSize, dimensions]
  );

  // Screen pixel to coordinate conversion
  const screenToCoord = useCallback(
    (screenX: number, screenY: number): MapCoordinate => {
      const screenCenterX = dimensions.width / 2;
      const screenCenterY = dimensions.height / 2;

      const tileX = camera.x + (screenX - screenCenterX) / effectiveTileSize;
      const tileY = camera.y + (screenY - screenCenterY) / effectiveTileSize;

      return {
        x: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(tileX))),
        y: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(tileY))),
      };
    },
    [camera, effectiveTileSize, dimensions]
  );

  // Filter players based on filters and viewport culling
  const visiblePlayers = useMemo(() => {
    const margin = 4;
    return players.filter((p) => {
      // Alliance filter
      if (allianceFilter !== 'ALL' && p.alliance !== allianceFilter) return false;
      // Group filter
      if (groupFilter !== 'ALL' && (p.battleGroup || 'Unassigned') !== groupFilter) return false;

      // Viewport culling
      return (
        p.coord.x >= visibleRange.minX - margin &&
        p.coord.x <= visibleRange.maxX + margin &&
        p.coord.y >= visibleRange.minY - margin &&
        p.coord.y <= visibleRange.maxY + margin
      );
    });
  }, [players, allianceFilter, groupFilter, visibleRange]);

  // Render Background Grid and Visual Markers on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Dark tactical battlefield background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const { minX, maxX, minY, maxY } = visibleRange;

    // Grid lines
    ctx.lineWidth = 0.5;

    // Draw vertical grid lines
    for (let x = minX; x <= maxX + 1; x++) {
      const screenX = coordToScreen({ x, y: 0 }).x;
      const isMajor50 = x % 50 === 0;
      const isMajor10 = x % 10 === 0;

      if (isMajor50) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)'; // indigo-500
        ctx.lineWidth = 1.2;
      } else if (isMajor10) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)'; // slate-700
        ctx.lineWidth = 0.8;
      } else if (zoom >= 0.7) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)'; // slate-800
        ctx.lineWidth = 0.5;
      } else {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, dimensions.height);
      ctx.stroke();

      // Coordinate numbers along major lines
      if (isMajor50 && zoom >= 0.5) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '10px Montserrat, monospace';
        ctx.fillText(`X:${x}`, screenX + 4, 14);
      }
    }

    // Draw horizontal grid lines
    for (let y = minY; y <= maxY + 1; y++) {
      const screenY = coordToScreen({ x: 0, y }).y;
      const isMajor50 = y % 50 === 0;
      const isMajor10 = y % 10 === 0;

      if (isMajor50) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
        ctx.lineWidth = 1.2;
      } else if (isMajor10) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
        ctx.lineWidth = 0.8;
      } else if (zoom >= 0.7) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
        ctx.lineWidth = 0.5;
      } else {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(dimensions.width, screenY);
      ctx.stroke();

      if (isMajor50 && zoom >= 0.5) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '10px Montserrat, monospace';
        ctx.fillText(`Y:${y}`, 4, screenY - 4);
      }
    }

    // King's Castle Tactical Boundary Ring (Sanctum Circle)
    const castlePos = coordToScreen(TACTICAL_LANDMARKS.castle.coord);
    const sanctumRadius = 55 * effectiveTileSize; // 55 tiles radius
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)'; // rose-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(castlePos.x, castlePos.y, sanctumRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Castle Label on perimeter
    if (sanctumRadius > 40) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.font = 'bold 10px Montserrat, sans-serif';
      ctx.fillText('SANCTUM PERIMETER (KVK BATTLE ZONE)', castlePos.x - 110, castlePos.y - sanctumRadius - 6);
    }

    // Manhattan Distance Measurement Tool Path
    if (measureA) {
      const target = measureB || hoverTile;
      if (target) {
        const p1 = coordToScreen(measureA);
        const p2 = coordToScreen(target);

        // Grid-aligned Manhattan path: horizontal then vertical
        const corner = coordToScreen({ x: target.x, y: measureA.y });

        ctx.strokeStyle = '#38bdf8'; // sky-400
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Start & End points
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Distance text badge in middle
        const dist = getManhattanDistance(measureA, target);
        const march = formatMarchTime(estimateMarchSeconds(dist));
        const badgeX = corner.x + 8;
        const badgeY = corner.y - 8;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(badgeX - 4, badgeY - 14, 150, 32);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX - 4, badgeY - 14, 150, 32);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px Montserrat, sans-serif';
        ctx.fillText(`Distance: ${dist} tiles`, badgeX + 4, badgeY);
        ctx.fillStyle = '#34d399';
        ctx.font = '10px Montserrat, sans-serif';
        ctx.fillText(`March Time: ~${march}`, badgeX + 4, badgeY + 13);
      }
    }

    // Footprint Inspector Preview Ghost on Hover
    if (footprintMode && hoverTile) {
      const spec = FOOTPRINT_SPECS[footprintMode];
      if (spec) {
        const fpStart = coordToScreen(hoverTile);
        const fpW = spec.width * effectiveTileSize;
        const fpH = spec.height * effectiveTileSize;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(fpStart.x, fpStart.y, fpW, fpH);

        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(fpStart.x, fpStart.y, fpW, fpH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Montserrat, sans-serif';
        ctx.fillText(`${spec.label} (${spec.width}x${spec.height})`, fpStart.x + 4, fpStart.y - 4);
      }
    }
  }, [dimensions, visibleRange, coordToScreen, zoom, effectiveTileSize, measureA, measureB, hoverTile, footprintMode]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode) {
      const coord = screenToCoord(e.clientX - containerRef.current!.getBoundingClientRect().left, e.clientY - containerRef.current!.getBoundingClientRect().top);
      if (!measureA) {
        setMeasureA(coord);
        setMeasureB(null);
      } else if (!measureB) {
        setMeasureB(coord);
      } else {
        setMeasureA(coord);
        setMeasureB(null);
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCameraStart({ x: camera.x, y: camera.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentCoord = screenToCoord(e.clientX - rect.left, e.clientY - rect.top);
    setHoverTile(currentCoord);

    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const newX = Math.round(cameraStart.x - dx / effectiveTileSize);
    const newY = Math.round(cameraStart.y - dy / effectiveTileSize);

    onCameraChange({
      x: Math.max(0, Math.min(GRID_SIZE - 1, newX)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    const newZoom = Math.max(0.25, Math.min(2.5, Number((zoom + zoomDelta).toFixed(2))));
    onZoomChange(newZoom);
  };

  // Touch pan and pinch-to-zoom for mobile devices
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (measureMode && e.touches.length === 1) {
      const t = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const coord = screenToCoord(t.clientX - rect.left, t.clientY - rect.top);
        if (!measureA) {
          setMeasureA(coord);
          setMeasureB(null);
        } else if (!measureB) {
          setMeasureB(coord);
        } else {
          setMeasureA(coord);
          setMeasureB(null);
        }
        return;
      }
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      setTouchStartPos({ x: t.clientX, y: t.clientY });
      setTouchCameraStart({ x: camera.x, y: camera.y });
      setLastPinchDist(null);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      setLastPinchDist(dist);
      setTouchStartPos(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartPos) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartPos.x;
      const dy = t.clientY - touchStartPos.y;
      const newX = Math.round(touchCameraStart.x - dx / effectiveTileSize);
      const newY = Math.round(touchCameraStart.y - dy / effectiveTileSize);

      onCameraChange({
        x: Math.max(0, Math.min(GRID_SIZE - 1, newX)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, newY)),
      });
    } else if (e.touches.length === 2 && lastPinchDist !== null) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = currentDist / lastPinchDist;
      if (Math.abs(factor - 1) > 0.02) {
        const newZoom = Math.max(0.25, Math.min(2.5, Number((zoom * factor).toFixed(2))));
        onZoomChange(newZoom);
        setLastPinchDist(currentDist);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartPos(null);
    setLastPinchDist(null);
  };

  // Admin Drag & Drop Target Handlers for Landmarks
  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnLandmark = (e: React.DragEvent, group: BattleGroup) => {
    if (!isAdmin) return;
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId) {
      onUpdateGroup(playerId, group);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-[480px] sm:h-[600px] lg:h-[720px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none cursor-${
        measureMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
      }`}
    >
      {/* Background Canvas for Grid & Vector Elements */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 block pointer-events-none"
      />

      {/* Interactive Landmark Overlay Elements */}
      {Object.values(TACTICAL_LANDMARKS).map((landmark) => {
        const screenPos = coordToScreen(landmark.coord);
        const w = landmark.width * effectiveTileSize;
        const h = landmark.height * effectiveTileSize;
        const left = screenPos.x - w / 2;
        const top = screenPos.y - h / 2;

        const isCastle = landmark.type === 'castle';

        return (
          <div
            key={landmark.id}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${w}px`,
              height: `${h}px`,
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnLandmark(e, landmark.group)}
            className={`absolute rounded-xl border-2 flex flex-col items-center justify-center p-2 shadow-2xl transition-all z-20 ${
              isCastle
                ? 'border-rose-500 bg-rose-950/80 ring-4 ring-rose-500/20'
                : 'border-blue-500 bg-slate-900/90'
            }`}
            title={`Landmark: ${landmark.name} (${landmark.coord.x}, ${landmark.coord.y}) - Drag players here to assign`}
          >
            {isCastle ? (
              <Castle className="w-8 h-8 text-rose-400 drop-shadow-md animate-pulse" />
            ) : (
              <Shield className="w-6 h-6 text-indigo-400" />
            )}

            <div className="text-center mt-1">
              <div className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[140px]">
                {landmark.shortName}
              </div>
              <div className="text-[10px] font-mono text-slate-300 font-bold">
                ({landmark.coord.x}, {landmark.coord.y})
              </div>
            </div>

            {isAdmin && (
              <div className="text-[9px] text-amber-300 font-bold mt-1 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                Drop to Assign
              </div>
            )}
          </div>
        );
      })}

      {/* Render Visible Player City Pins (Positioned by screen coordinates) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          style={{
            transform: `translate(${dimensions.width / 2 - camera.x * effectiveTileSize}px, ${
              dimensions.height / 2 - camera.y * effectiveTileSize
            }px)`,
          }}
          className="relative pointer-events-auto"
        >
          {visiblePlayers.map((player) => (
            <PlayerPin
              key={player.id}
              player={player}
              tileSize={effectiveTileSize}
              isSelected={player.id === selectedPlayerId}
              onClick={onSelectPlayer}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* Floating Zoom Controls for Mobile & Quick Desktop Use */}
      <div className="absolute bottom-16 right-3 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(2.5, Number((zoom + 0.25).toFixed(2))))}
          className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 text-white flex items-center justify-center font-bold text-base shadow-lg transition active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 text-slate-200" />
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.25, Number((zoom - 0.25).toFixed(2))))}
          className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 text-white flex items-center justify-center font-bold text-base shadow-lg transition active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4 text-slate-200" />
        </button>
      </div>

      {/* Bottom Floating HUD */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-none font-sans">
        {/* Coordinates HUD */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 shadow-xl text-[10px] sm:text-xs text-slate-300 font-mono flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              <strong className="text-white">({hoverTile ? `${hoverTile.x}, ${hoverTile.y}` : `${camera.x}, ${camera.y}`})</strong>
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div>
            Castle:{' '}
            <strong className="text-rose-400">
              {hoverTile ? getManhattanDistance(hoverTile, TACTICAL_LANDMARKS.castle.coord) : getManhattanDistance(camera, TACTICAL_LANDMARKS.castle.coord)}{' '}
              tiles
            </strong>
          </div>

          <span className="text-slate-700">|</span>

          <div>
            Zoom: <strong className="text-amber-300">{Math.round(zoom * 100)}%</strong>
          </div>
        </div>

        {/* Measure banner if active */}
        {measureMode && (
          <div className="bg-sky-950/90 border border-sky-500/40 rounded-lg px-3 py-1.5 shadow-xl text-xs font-bold text-sky-200 flex items-center gap-2 animate-in fade-in">
            <Ruler className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {!measureA
                ? 'Click tile for Point A'
                : !measureB
                ? 'Click tile for Point B'
                : `Manhattan: ${getManhattanDistance(measureA, measureB)} tiles (~${formatMarchTime(estimateMarchSeconds(getManhattanDistance(measureA, measureB)))})`}
            </span>
            {(measureA || measureB) && (
              <button
                type="button"
                onClick={() => {
                  setMeasureA(null);
                  setMeasureB(null);
                }}
                className="pointer-events-auto ml-2 text-[10px] text-sky-300 hover:text-white underline"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
