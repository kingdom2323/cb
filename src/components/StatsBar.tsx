import React from 'react';
import { useRoster } from '../context/RosterContext';
import { ALLIANCE_STYLES, formatPower, formatFullNumber } from '../utils/formatters';
import { ALLIANCES, Alliance } from '../types/roster';
import { Users, Zap, Swords } from 'lucide-react';

export const StatsBar: React.FC = () => {
  const { players, totalPower, allianceStats, groupStats, filters, setFilter } = useRoster();

  const activeAssignedCount =
    (groupStats['Castle']?.count || 0) +
    (groupStats['Turret 1']?.count || 0) +
    (groupStats['Turret 2']?.count || 0) +
    (groupStats['Turret 3']?.count || 0);

  const activeAssignedPower =
    (groupStats['Castle']?.totalPower || 0) +
    (groupStats['Turret 1']?.totalPower || 0) +
    (groupStats['Turret 2']?.totalPower || 0) +
    (groupStats['Turret 3']?.totalPower || 0);

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Core Global Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Total Players:</span>
            <span className="font-bold text-white">{players.length}</span>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Combined Power:</span>
            <span className="font-bold text-amber-300" title={formatFullNumber(totalPower)}>
              {formatPower(totalPower)}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">Battle Assigned:</span>
            <span className="font-bold text-white">{activeAssignedCount}</span>
            <span className="text-slate-500">({formatPower(activeAssignedPower)})</span>
          </div>
        </div>

        {/* Alliance quick pill stats */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[11px] font-medium hidden md:inline">Alliances:</span>
          {ALLIANCES.map((alliance: Alliance) => {
            const stat = allianceStats[alliance];
            const isSelected = filters.alliance === alliance;
            const style = ALLIANCE_STYLES[alliance];

            return (
              <button
                key={alliance}
                type="button"
                onClick={() => setFilter('alliance', isSelected ? 'ALL' : alliance)}
                className={`px-2 py-1 rounded transition-all flex items-center gap-1.5 text-[11px] font-bold ${
                  isSelected
                    ? `${style.pill} shadow-sm ring-1 ring-white/20`
                    : `bg-slate-800/80 hover:bg-slate-800 text-slate-300 border ${style.border}`
                }`}
                title={`Filter by ${alliance} (${stat?.count || 0} players, ${formatPower(stat?.totalPower || 0)})`}
              >
                <span className={isSelected ? 'text-inherit font-bold' : style.text}>
                  {alliance}
                </span>
                <span className="text-slate-400 opacity-90">{stat?.count || 0}</span>
                <span className="text-slate-400 text-[10px] hidden sm:inline">
                  [{formatPower(stat?.totalPower || 0)}]
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
