import React, { useState, useMemo } from 'react';
import { PlayerWithCoord } from '../../utils/mapUtils';
import { formatPower, formatTcLevel, getTcLevelBadgeStyle, ALLIANCE_STYLES, GROUP_STYLES } from '../../utils/formatters';
import { Alliance, BattleGroup, ALLIANCES, ACTIVE_BATTLE_GROUPS } from '../../types/roster';
import {
  Search,
  Users,
  X,
  Crosshair,
  Filter,
  Shield,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface TacticalRosterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerWithCoord[];
  onSelectPlayer: (player: PlayerWithCoord) => void;
  selectedPlayerId?: string | null;
  isAdmin: boolean;
  onUpdateGroup: (playerId: string, group: BattleGroup) => Promise<void>;
}

export const TacticalRosterDrawer: React.FC<TacticalRosterDrawerProps> = ({
  isOpen,
  onClose,
  players,
  onSelectPlayer,
  selectedPlayerId,
  isAdmin,
  onUpdateGroup,
}) => {
  const [search, setSearch] = useState('');
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<BattleGroup | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (selectedAlliance !== 'ALL' && p.alliance !== selectedAlliance) return false;
      if (selectedGroup !== 'ALL' && (p.battleGroup || 'Unassigned') !== selectedGroup) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [players, search, selectedAlliance, selectedGroup]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl z-40 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Tactical Roster ({filtered.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Close Roster Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/70">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player or ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Alliance pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedAlliance('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              selectedAlliance === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {ALLIANCES.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedAlliance(tag)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                selectedAlliance === tag
                  ? ALLIANCE_STYLES[tag].badge + ' ring-1 ring-white/20'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Battle Group dropdown filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as BattleGroup | 'ALL')}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Groups</option>
            <option value="Castle">Castle</option>
            <option value="Turret 1">Turret 1</option>
            <option value="Turret 2">Turret 2</option>
            <option value="Turret 3">Turret 3</option>
            <option value="Inactive">Inactive</option>
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No matching players found.
          </div>
        ) : (
          filtered.map((p) => {
            const isSelected = p.id === selectedPlayerId;
            const allianceStyle = ALLIANCE_STYLES[p.alliance] || ALLIANCE_STYLES.TEA;
            const tc = formatTcLevel(p.tgLevel);
            const tcBadge = getTcLevelBadgeStyle(tc);
            const groupStyle = GROUP_STYLES[p.battleGroup || 'Unassigned'];

            return (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Alliance, Name, TC level */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${allianceStyle.badge}`}
                    >
                      {p.alliance}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {p.name}
                    </span>
                  </div>

                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${tcBadge}`}>
                    {tc}
                  </span>
                </div>

                {/* Bottom Row: Power, Coords, Current Group */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="font-extrabold text-amber-300">
                    {formatPower(p.currentPower)}
                  </span>

                  <span className="text-slate-400 font-medium">
                    ({p.coord.x}, {p.coord.y})
                  </span>

                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${groupStyle.badge}`}>
                    {p.battleGroup || 'Unassigned'}
                  </span>
                </div>

                {/* Admin Quick Group Reassign */}
                {isAdmin && (
                  <div
                    className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[9px] uppercase font-bold text-slate-500">Quick Assign:</span>
                    <select
                      value={p.battleGroup || 'Unassigned'}
                      onChange={(e) => onUpdateGroup(p.id, e.target.value as BattleGroup)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="Castle">Castle</option>
                      <option value="Turret 1">Turret 1</option>
                      <option value="Turret 2">Turret 2</option>
                      <option value="Turret 3">Turret 3</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
