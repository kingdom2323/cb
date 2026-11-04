import React, { useState, useMemo, useCallback } from 'react';
import { useRoster } from '../../context/RosterContext';
import {
  computePlayerCoordinates,
  PlayerWithCoord,
  MapCoordinate,
  TACTICAL_LANDMARKS,
  FootprintType,
  GRID_SIZE,
} from '../../utils/mapUtils';
import { MapCanvas } from './MapCanvas';
import { Minimap } from './Minimap';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { TacticalRosterDrawer } from './TacticalRosterDrawer';
import { BattleGroup, Alliance, ALLIANCES } from '../../types/roster';
import { ALLIANCE_STYLES, GROUP_STYLES, formatPower } from '../../utils/formatters';
import { useTranslation } from '../../i18n/useTranslation';
import {
  Compass,
  Crosshair,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Layers,
  Users,
  Castle,
  Shield,
  ArrowLeft,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export const KingdomMapView: React.FC = () => {
  const { players, isAdmin, updatePlayerGroup, setActiveTab, togglePlayerCounterTeam } = useRoster();
  const { t } = useTranslation();

  // Map state
  const [camera, setCamera] = useState<MapCoordinate>({ x: 597, y: 597 }); // Defaults to King's Castle center
  const [zoom, setZoom] = useState<number>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithCoord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Tools state
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [footprintMode, setFootprintMode] = useState<FootprintType | null>(null);

  // Jump to input state
  const [jumpX, setJumpX] = useState<string>('597');
  const [jumpY, setJumpY] = useState<string>('597');

  // Filter state
  const [allianceFilter, setAllianceFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  // Compute 2x2 city coordinates for all players
  const playersWithCoords = useMemo(() => {
    return computePlayerCoordinates(players);
  }, [players]);

  // Jump to coordinates
  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseInt(jumpX, 10);
    const y = parseInt(jumpY, 10);
    if (!isNaN(x) && !isNaN(y)) {
      setCamera({
        x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, y)),
      });
    }
  };

  const handleJumpToLandmark = (coord: MapCoordinate) => {
    setCamera(coord);
    setJumpX(String(coord.x));
    setJumpY(String(coord.y));
  };

  const handleCenterOnPlayer = useCallback((player: PlayerWithCoord) => {
    setCamera(player.coord);
    setJumpX(String(player.coord.x));
    setJumpY(String(player.coord.y));
    setSelectedPlayer(player);
  }, []);

  // Visible coordinate range for minimap
  const minimapRange = useMemo(() => {
    const tilesSpan = Math.round(50 / zoom);
    return {
      minX: Math.max(0, camera.x - tilesSpan),
      maxX: Math.min(GRID_SIZE - 1, camera.x + tilesSpan),
      minY: Math.max(0, camera.y - tilesSpan),
      maxY: Math.min(GRID_SIZE - 1, camera.y + tilesSpan),
    };
  }, [camera, zoom]);

  return (
    <div className="space-y-3 font-sans pb-8 select-none">
      {/* Top Tactical Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Back to roster button */}
          <button
            type="button"
            onClick={() => setActiveTab('all-players')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
            title="Return to Roster View"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.roster}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base font-extrabold text-white tracking-wider uppercase">
                {t.kingdomMap}
              </h1>
              <span className="hidden sm:inline text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                1200 x 1200 KVK GRID
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              1:1 Tactical Kingshot mirror centered at King's Castle (597, 597)
            </div>
          </div>
        </div>

        {/* Tactical Status & Admin Badge */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.adminTacticalControl}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.readOnlyObserver}</span>
            </div>
          )}

          {/* Toggle Tactical Roster Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              isDrawerOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.rosterDrawer}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-bold text-slate-300">
              {players.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tactical Toolbar: Jump-to, Quick Landmarks, Tools, Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-md flex flex-wrap md:flex-nowrap items-center justify-between gap-2 text-xs overflow-x-auto">
        {/* Left: Quick Jump Coordinates & Landmarks */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Jump To Form */}
          <form onSubmit={handleJump} className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1">{t.jump}:</span>
            <input
              type="number"
              min={0}
              max={1199}
              value={jumpX}
              onChange={(e) => setJumpX(e.target.value)}
              placeholder="X"
              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-600 font-mono">,</span>
            <input
              type="number"
              min={0}
              max={1199}
              value={jumpY}
              onChange={(e) => setJumpY(e.target.value)}
              placeholder="Y"
              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
            >
              {t.go}
            </button>
          </form>

          {/* Quick Landmark Jump Buttons */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleJumpToLandmark(TACTICAL_LANDMARKS.castle.coord)}
              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Castle className="w-3 h-3 text-rose-400" />
              <span>Castle (597,597)</span>
            </button>

            <button
              type="button"
              onClick={() => handleJumpToLandmark(TACTICAL_LANDMARKS.turret1.coord)}
              className="px-2 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition"
            >
              Turret 1
            </button>

            <button
              type="button"
              onClick={() => handleJumpToLandmark(TACTICAL_LANDMARKS.turret2.coord)}
              className="px-2 py-1 rounded bg-violet-950/60 hover:bg-violet-900/80 text-violet-300 border border-violet-500/40 text-[11px] font-bold transition"
            >
              Turret 2
            </button>

            <button
              type="button"
              onClick={() => handleJumpToLandmark(TACTICAL_LANDMARKS.turret3.coord)}
              className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition"
            >
              Turret 3
            </button>

            <button
              type="button"
              onClick={() => handleJumpToLandmark(TACTICAL_LANDMARKS.inactive.coord)}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 text-[11px] font-bold transition"
            >
              Inactive Camp
            </button>
          </div>
        </div>

        {/* Right: Tactical Tools & Zoom */}
        <div className="flex items-center gap-2">
          {/* Manhattan Measure Tool */}
          <button
            type="button"
            onClick={() => setMeasureMode(!measureMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition border ${
              measureMode
                ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Measure Manhattan grid distance between any two tiles"
          >
            <Ruler className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.measureDistance}</span>
          </button>

          {/* Footprint Tool Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={footprintMode || 'none'}
              onChange={(e) => setFootprintMode(e.target.value === 'none' ? null : (e.target.value as FootprintType))}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none pr-1"
            >
              <option value="none">{t.footprintOff}</option>
              <option value="city_2x2">City (2x2)</option>
              <option value="hq_3x3">Alliance HQ (3x3)</option>
              <option value="beartrap_3x3">Bear Trap (3x3)</option>
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.25, Number((prev - 0.2).toFixed(2))))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono text-amber-300 font-bold px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(2.5, Number((prev + 0.2).toFixed(2))))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                handleJumpToLandmark(TACTICAL_LANDMARKS.castle.coord);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition border-l border-slate-800 ml-0.5"
              title="Reset Zoom & Center Castle"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Minimap Container */}
      <div className="relative w-full">
        {/* The 1200x1200 Pan & Zoom Map Canvas */}
        <MapCanvas
          players={playersWithCoords}
          camera={camera}
          onCameraChange={setCamera}
          zoom={zoom}
          onZoomChange={setZoom}
          selectedPlayerId={selectedPlayer?.id || null}
          onSelectPlayer={setSelectedPlayer}
          isAdmin={isAdmin}
          onUpdateGroup={updatePlayerGroup}
          measureMode={measureMode}
          footprintMode={footprintMode}
          allianceFilter={allianceFilter}
          groupFilter={groupFilter}
        />

        {/* Floating Minimap / Radar in Top-Right Corner */}
        <div className="absolute top-3 right-3 z-30 pointer-events-auto">
          <Minimap
            players={playersWithCoords}
            viewCenter={camera}
            visibleRange={minimapRange}
            onNavigate={(coord) => {
              setCamera(coord);
              setJumpX(String(coord.x));
              setJumpY(String(coord.y));
            }}
            selectedPlayerId={selectedPlayer?.id || null}
          />
        </div>

        {/* Collapsible Tactical Roster Drawer */}
        <TacticalRosterDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          players={playersWithCoords}
          onSelectPlayer={handleCenterOnPlayer}
          selectedPlayerId={selectedPlayer?.id || null}
          isAdmin={isAdmin}
          onUpdateGroup={updatePlayerGroup}
        />
      </div>

      {/* Detailed Tactical Player Modal when a pin is selected */}
      <PlayerDetailsModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        isAdmin={isAdmin}
        onUpdateGroup={updatePlayerGroup}
        onCenterOnPlayer={handleCenterOnPlayer}
        onToggleCounterTeam={togglePlayerCounterTeam}
      />
    </div>
  );
};
