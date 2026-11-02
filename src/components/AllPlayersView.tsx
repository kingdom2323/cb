import React, { useState } from 'react';
import { useRoster } from '../context/RosterContext';
import {
  ALLIANCES,
  Alliance,
  BATTLE_GROUPS,
  BattleGroup,
  SortField,
} from '../types/roster';
import {
  ALLIANCE_STYLES,
  GROUP_STYLES,
  getRankBadgeStyle,
  formatPower,
  formatFullNumber,
  formatTcLevel,
  getTcLevelBadgeStyle,
} from '../utils/formatters';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

export const AllPlayersView: React.FC = () => {
  const {
    filteredPlayers,
    players,
    filters,
    setFilter,
    resetFilters,
    sortField,
    sortDirection,
    handleSort,
    selectedPlayerIds,
    toggleSelectPlayer,
    selectAllFiltered,
    clearSelection,
    updatePlayerGroup,
    batchAssignGroup,
    isAdmin,
  } = useRoster();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pagination calculation
  const totalItems = filteredPlayers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isAllSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every((p) => selectedPlayerIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (!isAdmin) return;
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllFiltered(filteredPlayers.map((p) => p.id));
    }
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.alliance !== 'ALL' ||
    filters.rank !== 'ALL' ||
    filters.tcLevel !== 'ALL' ||
    filters.battleGroup !== 'ALL';

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400" />
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Search & Filter Toolbar with Precise Heights and Spacing Alignment */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          {/* Global Search Bar */}
          <div className="sm:col-span-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Search Roster
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search player name or ID..."
                value={filters.search}
                onChange={(e) => {
                  setFilter('search', e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-7 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilter('search', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1"
                >
                  x
                </button>
              )}
            </div>
          </div>

          {/* Alliance Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Alliance
            </label>
            <select
              value={filters.alliance}
              onChange={(e) => {
                setFilter('alliance', e.target.value as Alliance | 'ALL');
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer transition"
            >
              <option value="ALL">All Alliances</option>
              {ALLIANCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Rank
            </label>
            <select
              value={filters.rank}
              onChange={(e) => {
                setFilter('rank', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer transition"
            >
              <option value="ALL">All Ranks</option>
              <option value="R5">Leader / R5</option>
              <option value="R4">R4</option>
              <option value="R3">R3</option>
              <option value="R2">R2</option>
              <option value="R1">R1</option>
            </select>
          </div>

          {/* TC level Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              TC level
            </label>
            <select
              value={filters.tcLevel}
              onChange={(e) => {
                setFilter('tcLevel', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer transition"
            >
              <option value="ALL">All TC Levels</option>
              <option value="TG3">TG3</option>
              <option value="TG2">TG2</option>
              <option value="TG1">TG1</option>
              <option value="NON_TG">TC Standard (1 to 30)</option>
            </select>
          </div>

          {/* Battle Group Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Battle Group
            </label>
            <select
              value={filters.battleGroup}
              onChange={(e) => {
                setFilter('battleGroup', e.target.value as BattleGroup | 'ALL');
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer transition"
            >
              <option value="ALL">All Groups</option>
              {BATTLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status line & active filter chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Showing <strong className="text-white font-bold">{filteredPlayers.length}</strong> of{' '}
              <span className="font-semibold">{players.length}</span> players
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2 ml-2 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Rows per page:</span>
            {[50, 100, 200, 500].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  pageSize === size
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Admin Only) */}
      {isAdmin && selectedPlayerIds.size > 0 && (
        <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-200">
              {selectedPlayerIds.size} player{selectedPlayerIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium">Assign selected to:</span>
            {BATTLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => batchAssignGroup(Array.from(selectedPlayerIds), group)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  group === 'Castle'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : group === 'Turret 1'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : group === 'Turret 2'
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : group === 'Turret 3'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : group === 'Inactive'
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop View: High Density Table */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 select-none uppercase tracking-wider text-[11px]">
                {isAdmin && (
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-2.5 px-2 w-10 text-center font-bold">#</th>
                <th
                  onClick={() => handleSort('alliance')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>Alliance</span>
                    {renderSortIcon('alliance')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group w-20"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>Rank</span>
                    {renderSortIcon('rank')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>Player Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-bold">ID</th>
                <th
                  onClick={() => handleSort('currentPower')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group text-right"
                >
                  <div className="flex items-center justify-end gap-1 font-bold">
                    <span>Power</span>
                    {renderSortIcon('currentPower')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tcLevel')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>TC level</span>
                    {renderSortIcon('tcLevel')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('battleGroup')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group min-w-[160px]"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>Battle Group</span>
                    {renderSortIcon('battleGroup')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-slate-500">
                    No players found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = selectedPlayerIds.has(player.id);
                  const allianceStyle = ALLIANCE_STYLES[player.alliance];
                  const groupStyle = GROUP_STYLES[player.battleGroup];
                  const rankStyle = getRankBadgeStyle(player.rank);
                  const formattedLevel = formatTcLevel(player.tgLevel);
                  const tcBadgeStyle = getTcLevelBadgeStyle(formattedLevel);

                  return (
                    <tr
                      key={player.id}
                      onClick={isAdmin ? () => toggleSelectPlayer(player.id) : undefined}
                      className={`transition-colors ${
                        isAdmin ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-indigo-950/40 hover:bg-indigo-950/60'
                          : idx % 2 === 0
                          ? 'bg-slate-900/40 hover:bg-slate-800/50'
                          : 'bg-slate-900/80 hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Checkbox (Admin Only) */}
                      {isAdmin && (
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPlayer(player.id)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Index */}
                      <td className="py-2 px-2 text-center text-slate-500 font-bold text-[11px]">
                        {globalIdx}
                      </td>

                      {/* Alliance */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${allianceStyle.badge}`}
                        >
                          {player.alliance}
                        </span>
                      </td>

                      {/* Rank */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${rankStyle}`}
                        >
                          {player.rank}
                        </span>
                      </td>

                      {/* Name with Alliance tag */}
                      <td className="py-2 px-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{player.name}</span>
                          <span
                            className={`text-[9px] px-1 rounded uppercase font-bold opacity-85 ${allianceStyle.badge}`}
                            title={`Alliance: ${player.alliance}`}
                          >
                            {player.alliance}
                          </span>
                        </div>
                      </td>

                      {/* ID with 1-click copy */}
                      <td className="py-2 px-3 text-slate-400 text-[11px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(player.id, e)}
                          className="flex items-center gap-1.5 hover:text-white transition group/btn"
                          title="Click to copy ID"
                        >
                          <span>{player.id}</span>
                          {copiedId === player.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-600 group-hover/btn:text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Power */}
                      <td className="py-2 px-3 text-right font-bold text-amber-300 text-xs">
                        <span title={formatFullNumber(player.currentPower)}>
                          {formatPower(player.currentPower)}
                        </span>
                      </td>

                      {/* TC Level */}
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${tcBadgeStyle}`}>
                          {formattedLevel}
                        </span>
                      </td>

                      {/* Battle Group: Editable for Admin, Read-Only Badge for Viewers */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            value={player.battleGroup}
                            onChange={(e) => updatePlayerGroup(player.id, e.target.value as BattleGroup)}
                            className={`w-full text-xs font-bold rounded px-2 py-1 border transition focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-slate-950 cursor-pointer ${groupStyle.badge}`}
                          >
                            {BATTLE_GROUPS.map((g) => (
                              <option key={g} value={g} className="bg-slate-900 text-slate-200">
                                {g}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${groupStyle.badge}`}
                          >
                            {player.battleGroup || 'Unassigned'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: High Density Card Layout */}
      <div className="md:hidden space-y-2">
        {paginatedPlayers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500">
            No players found matching current filters.
          </div>
        ) : (
          paginatedPlayers.map((player) => {
            const isSelected = selectedPlayerIds.has(player.id);
            const allianceStyle = ALLIANCE_STYLES[player.alliance];
            const groupStyle = GROUP_STYLES[player.battleGroup];
            const rankStyle = getRankBadgeStyle(player.rank);
            const formattedLevel = formatTcLevel(player.tgLevel);
            const tcBadgeStyle = getTcLevelBadgeStyle(formattedLevel);

            return (
              <div
                key={player.id}
                onClick={isAdmin ? () => toggleSelectPlayer(player.id) : undefined}
                className={`p-3 rounded-lg border transition ${
                  isSelected
                    ? 'border-indigo-500/80 bg-indigo-950/30'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Name, Alliance, Rank, Checkbox (Admin) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${allianceStyle.badge}`}
                    >
                      {player.alliance}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${rankStyle}`}
                    >
                      {player.rank}
                    </span>
                    <span className="font-bold text-white text-sm truncate">{player.name}</span>
                  </div>

                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectPlayer(player.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                  )}
                </div>

                {/* Middle Row: Power, TC Level */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-slate-800/80 my-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Power</span>
                    <span className="font-bold text-amber-300">
                      {formatPower(player.currentPower)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">TC level</span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] ${tcBadgeStyle}`}>
                      {formattedLevel}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: ID and Group (Editable for Admin, Badge for Public) */}
                <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleCopyId(player.id, e)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>ID: {player.id}</span>
                    {copiedId === player.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>

                  {isAdmin ? (
                    <select
                      value={player.battleGroup}
                      onChange={(e) => updatePlayerGroup(player.id, e.target.value as BattleGroup)}
                      className={`text-xs font-bold rounded px-2 py-1 border bg-slate-950 focus:outline-none ${groupStyle.badge}`}
                    >
                      {BATTLE_GROUPS.map((g) => (
                        <option key={g} value={g} className="bg-slate-900 text-slate-200">
                          {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${groupStyle.badge}`}
                    >
                      {player.battleGroup || 'Unassigned'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
          <span>
            Page <strong className="text-white font-bold">{currentPage}</strong> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition font-bold"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
