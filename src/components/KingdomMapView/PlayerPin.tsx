import React from 'react';
import { PlayerWithCoord } from '../../utils/mapUtils';
import { formatPower, formatTcLevel, getTcLevelBadgeStyle, ALLIANCE_STYLES } from '../../utils/formatters';
import { Shield } from 'lucide-react';

interface PlayerPinProps {
  player: PlayerWithCoord;
  tileSize: number;
  isSelected?: boolean;
  onClick: (player: PlayerWithCoord) => void;
  isAdmin: boolean;
  onDragStart?: (e: React.DragEvent, player: PlayerWithCoord) => void;
}

export const PlayerPin: React.FC<PlayerPinProps> = ({
  player,
  tileSize,
  isSelected,
  onClick,
  isAdmin,
  onDragStart,
}) => {
  const allianceStyle = ALLIANCE_STYLES[player.alliance] || ALLIANCE_STYLES.TEA;
  const tcFormatted = formatTcLevel(player.tgLevel);
  const tcBadge = getTcLevelBadgeStyle(tcFormatted);

  // Position on map based on (x, y) coordinates
  // City footprint is 2x2 tiles
  const left = player.coord.x * tileSize;
  const top = player.coord.y * tileSize;
  const width = tileSize * 2;
  const height = tileSize * 2;

  // Zoom levels: at lower zoom (< 18px per tile), use compact pin badge; at normal zoom (>= 18px), use detailed tactical card
  const isCompact = tileSize < 18;

  const handleDrag = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('text/plain', player.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, player);
    }
  };

  return (
    <div
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      draggable={isAdmin}
      onDragStart={handleDrag}
      onClick={(e) => {
        e.stopPropagation();
        onClick(player);
      }}
      className={`absolute transition-all select-none z-10 cursor-pointer group ${
        isAdmin ? 'active:cursor-grabbing cursor-grab' : ''
      }`}
      title={`${player.name} [${player.alliance}] | Power: ${formatPower(player.currentPower)} | Level: ${tcFormatted} | Coord: (${player.coord.x}, ${player.coord.y})`}
    >
      {/* 2x2 City Tile Footprint Boundary */}
      <div
        className={`w-full h-full rounded border flex flex-col justify-between p-1 shadow-md transition-all ${
          isSelected
            ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-950/40'
            : 'border-slate-700/80 bg-slate-900/85 hover:border-slate-500 hover:bg-slate-900'
        } backdrop-blur-xs`}
      >
        {isCompact ? (
          // Compact View when zoomed out
          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-center">
            <span
              className={`text-[8px] font-extrabold px-1 py-0.2 rounded ${allianceStyle.pill} truncate max-w-full`}
            >
              {player.alliance}
            </span>
            <span className="text-[8px] font-bold text-slate-200 truncate max-w-full leading-tight">
              {formatPower(player.currentPower)}
            </span>
          </div>
        ) : (
          // Full Detailed View when normal or zoomed in
          <>
            {/* Top row: Alliance badge + TC Level */}
            <div className="flex items-center justify-between gap-1 w-full">
              <span
                className={`text-[9px] font-extrabold px-1 rounded uppercase tracking-wider ${allianceStyle.badge}`}
              >
                {player.alliance}
              </span>
              <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${tcBadge}`}>
                {tcFormatted}
              </span>
            </div>

            {/* Middle: Player Name */}
            <div className="w-full text-left truncate my-auto">
              <div className="text-[10px] font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                {player.name}
              </div>
              <div className="text-[8px] text-slate-400 font-mono truncate">
                ({player.coord.x}, {player.coord.y})
              </div>
            </div>

            {/* Bottom row: Power + Rank */}
            <div className="flex items-center justify-between gap-1 w-full pt-0.5 border-t border-slate-800/80">
              <span className="text-[9px] font-extrabold text-amber-300 font-mono">
                {formatPower(player.currentPower)}
              </span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">
                {player.rank || 'R1'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Admin Drag Handle Indicator */}
      {isAdmin && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};
