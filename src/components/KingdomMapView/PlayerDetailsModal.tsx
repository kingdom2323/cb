import React, { useState } from 'react';
import { PlayerWithCoord, getManhattanDistance, TACTICAL_LANDMARKS, estimateMarchSeconds, formatMarchTime } from '../../utils/mapUtils';
import { formatPower, formatFullNumber, formatTcLevel, getTcLevelBadgeStyle, ALLIANCE_STYLES, GROUP_STYLES } from '../../utils/formatters';
import { BattleGroup, ACTIVE_BATTLE_GROUPS } from '../../types/roster';
import { useTranslation } from '../../i18n/useTranslation';
import {
  X,
  Castle,
  Navigation,
  Clock,
  Crosshair,
  Shield,
  Zap,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface PlayerDetailsModalProps {
  player: PlayerWithCoord | null;
  onClose: () => void;
  isAdmin: boolean;
  onUpdateGroup: (playerId: string, group: BattleGroup) => Promise<void>;
  onCenterOnPlayer: (player: PlayerWithCoord) => void;
  onToggleCounterTeam?: (playerId: string) => Promise<void>;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  player,
  onClose,
  isAdmin,
  onUpdateGroup,
  onCenterOnPlayer,
  onToggleCounterTeam,
}) => {
  const { t } = useTranslation();
  if (!player) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const allianceStyle = ALLIANCE_STYLES[player.alliance] || ALLIANCE_STYLES.TEA;
  const tcFormatted = formatTcLevel(player.tgLevel);
  const tcBadge = getTcLevelBadgeStyle(tcFormatted);

  const distanceToCastle = getManhattanDistance(player.coord, TACTICAL_LANDMARKS.castle.coord);
  const marchTime = formatMarchTime(estimateMarchSeconds(distanceToCastle));

  const handleGroupSelect = async (newGroup: BattleGroup) => {
    if (!isAdmin || isUpdating || player.battleGroup === newGroup) return;
    setIsUpdating(true);
    try {
      await onUpdateGroup(player.id, newGroup);
      setSuccessNotice(`Reassigned to ${newGroup}`);
      setTimeout(() => setSuccessNotice(null), 2500);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${allianceStyle.badge}`}>
              {player.alliance}
            </span>
            <h2 className="text-base font-bold text-white truncate max-w-[220px]">
              {player.name}
            </h2>
            {player.isCounterTeam && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                Counter Team
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Power</div>
              <div className="text-lg font-black text-amber-300 font-mono">
                {formatPower(player.currentPower)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {formatFullNumber(player.currentPower)}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Town Center Level</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${tcBadge}`}>
                  {tcFormatted}
                </span>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Rank: {player.rank || 'R1'}
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Coordinates & Distance */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
              <span>Map Position & Manhattan Distance</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                <div className="text-[9px] text-slate-500 font-sans uppercase font-bold">Coords (X, Y)</div>
                <div className="text-xs font-bold text-slate-200">
                  {player.coord.x}, {player.coord.y}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                <div className="text-[9px] text-slate-500 font-sans uppercase font-bold">To Castle (597,597)</div>
                <div className="text-xs font-bold text-rose-400">
                  {distanceToCastle} tiles
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                <div className="text-[9px] text-slate-500 font-sans uppercase font-bold">March Time</div>
                <div className="text-xs font-bold text-emerald-400">
                  ~{marchTime}
                </div>
              </div>
            </div>
          </div>

          {/* Battle Group Assignment Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Tactical Assignment</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Current: <span className="text-white font-bold">{player.battleGroup || 'Unassigned'}</span>
              </span>
            </div>

            {isAdmin ? (
              // Admin assignment buttons
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Castle', 'Turret 1', 'Turret 2', 'Turret 3', 'Inactive', 'Unassigned'] as BattleGroup[]).map(
                    (group) => {
                      const isCurrent = player.battleGroup === group;
                      const style = GROUP_STYLES[group];
                      return (
                        <button
                          key={group}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleGroupSelect(group)}
                          className={`px-2 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1 border ${
                            isCurrent
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-xs'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isCurrent && <Check className="w-3 h-3 text-amber-400" />}
                          <span>{group}</span>
                        </button>
                      );
                    }
                  )}
                </div>

                {successNotice && (
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded">
                    <Check className="w-3.5 h-3.5" />
                    <span>{successNotice} (Synced to Supabase)</span>
                  </div>
                )}
              </div>
            ) : (
              // Read-Only view
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Admin authentication required to modify battle group assignment.</span>
              </div>
            )}
          </div>

          {/* Counter Team Toggle */}
          {onToggleCounterTeam && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Counter Team Status</span>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onToggleCounterTeam(player.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-2 ${
                    player.isCounterTeam
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25'
                      : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {player.isCounterTeam ? 'Remove from Counter Team' : 'Add to Counter Team'}
                </button>
              ) : (
                player.isCounterTeam && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 px-3 py-1.5 rounded">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Counter Team Member</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onCenterOnPlayer(player);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{t.centerCamera}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
