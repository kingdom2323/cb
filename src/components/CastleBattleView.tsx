import React, { useState, useMemo } from 'react';
import { useRoster } from '../context/RosterContext';
import { BattleGroup, ACTIVE_BATTLE_GROUPS, Player, ALLIANCES, Alliance } from '../types/roster';
import {
  ALLIANCE_STYLES,
  GROUP_STYLES,
  formatPower,
  formatFullNumber,
  formatTcLevel,
  getTcLevelBadgeStyle,
  getRankBadgeStyle,
} from '../utils/formatters';
import {
  Castle,
  Shield,
  Swords,
  Crosshair,
  UserMinus,
  Users,
  Search,
  Copy,
  Check,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const CastleBattleView: React.FC = () => {
  const { players, groupStats, updatePlayerGroup, batchAssignGroup, isAdmin, togglePlayerCounterTeam } = useRoster();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAllianceFilter, setSelectedAllianceFilter] = useState<Alliance | 'ALL'>('ALL');
  const [mobileActiveGroup, setMobileActiveGroup] = useState<BattleGroup>('Castle');
  const [copiedGroup, setCopiedGroup] = useState<BattleGroup | null>(null);

  // Modal to assign players from the unassigned reserve pool directly from this view (Admin Only)
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveSearch, setReserveSearch] = useState('');
  const [reserveAllianceFilter, setReserveAllianceFilter] = useState<Alliance | 'ALL'>('ALL');

  // Filter unassigned players for the quick reserve assigner
  const unassignedPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (p.battleGroup && p.battleGroup !== 'Unassigned') return false;
        if (reserveAllianceFilter !== 'ALL' && p.alliance !== reserveAllianceFilter) return false;
        if (reserveSearch.trim()) {
          const q = reserveSearch.trim().toLowerCase();
          return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.currentPower - a.currentPower);
  }, [players, reserveSearch, reserveAllianceFilter]);

  const totalUnassignedCount = players.filter(
    (p) => !p.battleGroup || p.battleGroup === 'Unassigned'
  ).length;

  // Group players strictly for the 5 active battle groups
  const playersByGroup = useMemo(() => {
    const map: Record<BattleGroup, Player[]> = {
      'Castle': [],
      'Turret 1': [],
      'Turret 2': [],
      'Turret 3': [],
      'Inactive': [],
      'Unassigned': [],
    };

    const q = searchQuery.trim().toLowerCase();

    players.forEach((p) => {
      // Alliance filter
      if (selectedAllianceFilter !== 'ALL' && p.alliance !== selectedAllianceFilter) {
        return;
      }
      // Search filter
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchName && !matchId) return;
      }

      const g = p.battleGroup || 'Unassigned';
      if (map[g]) {
        map[g].push(p);
      }
    });

    // Sort each active bucket by power descending
    ACTIVE_BATTLE_GROUPS.forEach((group) => {
      map[group].sort((a, b) => b.currentPower - a.currentPower);
    });

    return map;
  }, [players, searchQuery, selectedAllianceFilter]);

  const handleCopyGroupList = (group: BattleGroup) => {
    const list = playersByGroup[group];

    const lines = [
      `--- ${group} ---`,
      ...list.map((p) => `[${p.alliance}] ${p.name}${p.isCounterTeam ? ' (CT)' : ''}`),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedGroup(group);
    setTimeout(() => setCopiedGroup(null), 2000);
  };

  const groupIcons: Record<BattleGroup, React.ReactNode> = {
    'Castle': <Castle className="w-4 h-4 text-rose-400" />,
    'Turret 1': <Shield className="w-4 h-4 text-blue-400" />,
    'Turret 2': <Swords className="w-4 h-4 text-violet-400" />,
    'Turret 3': <Crosshair className="w-4 h-4 text-amber-400" />,
    'Inactive': <UserMinus className="w-4 h-4 text-zinc-400" />,
    'Unassigned': <Users className="w-4 h-4 text-slate-400" />,
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Filter and Search Bar for Battle view */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search player name or ID in battle groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-7 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-bold"
              >
                x
              </button>
            )}
          </div>
        </div>

        {/* Alliance filter pill buttons & Unallocated reserves quick assigner (Admin Only) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">
              Alliance:
            </span>
            <button
              type="button"
              onClick={() => setSelectedAllianceFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                selectedAllianceFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All
            </button>
            {ALLIANCES.map((a) => {
              const isSelected = selectedAllianceFilter === a;
              const style = ALLIANCE_STYLES[a];
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setSelectedAllianceFilter(isSelected ? 'ALL' : a)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    isSelected
                      ? `${style.pill} shadow-sm`
                      : `bg-slate-950 text-slate-400 hover:text-white border ${style.border}`
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>

          {/* Quick Reserve Assigner Button (Admin Only) */}
          {isAdmin && (
            <>
              <div className="h-4 w-px bg-slate-800 hidden md:block" />
              <button
                type="button"
                onClick={() => setShowReserveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs transition shadow-sm"
                title="Assign unallocated players into battle groups"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.addPlayers} ({totalUnassignedCount})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher: 5 Active Battle Groups - horizontally scrollable */}
      <div className="xl:hidden flex overflow-x-auto gap-1 pb-1 scrollbar-hide rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
        {ACTIVE_BATTLE_GROUPS.map((group) => {
          const count = playersByGroup[group]?.length || 0;
          const isCurrent = mobileActiveGroup === group;
          const style = GROUP_STYLES[group];

          return (
            <button
              key={group}
              type="button"
              onClick={() => setMobileActiveGroup(group)}
              className={`flex-shrink-0 min-w-[100px] px-2.5 py-1.5 rounded-md text-center transition flex items-center justify-center gap-1.5 ${
                isCurrent
                  ? `${style.badge} font-bold shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
              }`}
            >
              <span className="truncate">{group}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Battle Buckets Grid: Exactly 5 Active Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {ACTIVE_BATTLE_GROUPS.map((group) => {
          const groupList = playersByGroup[group];
          const stats = groupStats[group];
          const style = GROUP_STYLES[group];
          const isMobileHidden = mobileActiveGroup !== group;

          return (
            <div
              key={group}
              className={`flex flex-col bg-slate-900 border rounded-xl overflow-hidden shadow-sm transition-all ${
                style.cardBorder
              } ${isMobileHidden ? 'hidden xl:flex' : 'flex'}`}
            >
              {/* Group Summary Card Header */}
              <div className={`p-3 border-b ${style.headerBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {groupIcons[group]}
                    <h3 className="font-bold text-sm tracking-tight text-white truncate">
                      {group}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Copy text button */}
                    <button
                      type="button"
                      onClick={() => handleCopyGroupList(group)}
                      title={t.copyGroupList}
                      className="p-1 rounded bg-slate-950/60 hover:bg-slate-950 text-slate-300 hover:text-white border border-slate-700/60 transition"
                    >
                      {copiedGroup === group ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-xs">
                  <div className="bg-slate-950/70 rounded p-1.5 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Assigned
                    </span>
                    <span className="text-sm font-bold text-white">
                      {stats?.count || 0}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 rounded p-1.5 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Power
                    </span>
                    <span
                      className="text-sm font-bold text-amber-300 truncate block"
                      title={formatFullNumber(stats?.totalPower || 0)}
                    >
                      {formatPower(stats?.totalPower || 0)}
                    </span>
                  </div>
                </div>

                {(stats?.counterTeamCount || 0) > 0 && (
                  <div className="col-span-2 bg-cyan-950/40 rounded p-1.5 border border-cyan-500/30">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                      Counter Team
                    </span>
                    <span className="text-sm font-bold text-cyan-300">
                      {stats?.counterTeamCount || 0} CT
                    </span>
                  </div>
                )}

                {/* Alliance breakdown mini-bars */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>Mix</span>
                    <span className="text-[9px]">
                      {ALLIANCES.map((a) => `${a}:${stats?.allianceBreakdown[a] || 0}`).join(' | ')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    {ALLIANCES.map((a) => {
                      const count = stats?.allianceBreakdown[a] || 0;
                      const percent = stats?.count ? (count / stats.count) * 100 : 0;
                      const colorMap: Record<Alliance, string> = {
                        ERA: 'bg-emerald-500',
                        FFF: 'bg-amber-500',
                        TEA: 'bg-sky-500',
                        VIK: 'bg-purple-500',
                      };
                      return (
                        <div
                          key={a}
                          style={{ width: `${percent}%` }}
                          className={`${colorMap[a]} transition-all duration-300`}
                          title={`${a}: ${count} players (${percent.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Player Cards List inside Active Bucket */}
              <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-310px)] min-h-[360px]">
                {groupList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    <span>No players currently in {group}.</span>
                  </div>
                ) : (
                  groupList.map((player, idx) => {
                    const allianceStyle = ALLIANCE_STYLES[player.alliance];
                    const rankStyle = getRankBadgeStyle(player.rank);
                    const formattedLevel = formatTcLevel(player.tgLevel);
                    const tcBadgeStyle = getTcLevelBadgeStyle(formattedLevel);

                    return (
                      <div
                        key={player.id}
                        className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-lg p-2.5 space-y-2 transition shadow-sm min-w-0"
                      >
                        {/* Player Header: Name, Rank, and MANDATORY Alliance Tag */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] text-slate-500 w-3.5 text-right font-bold shrink-0">
                              {idx + 1}.
                            </span>
                            {/* Alliance tag ALWAYS prominently visible */}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${allianceStyle.badge}`}
                              title={`Alliance: ${player.alliance}`}
                            >
                              {player.alliance}
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${rankStyle}`}
                            >
                              {player.rank}
                            </span>
                            <span
                              className="font-bold text-slate-100 text-xs truncate min-w-0"
                              title={player.name}
                            >
                              {player.name}
                            </span>
                          </div>

                          <span className="font-bold text-amber-300 text-xs shrink-0">
                            {formatPower(player.currentPower)}
                          </span>
                        </div>

                        {/* Player Details: ID & TC Level */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 min-w-0">
                          <span className="text-slate-500 font-medium truncate min-w-0">ID: {player.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 ${tcBadgeStyle}`}>
                            {formattedLevel}
                          </span>
                        </div>

                        {/* Counter Team Badge and Admin Toggle */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                          {player.isCounterTeam && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider animate-pulse-slow">
                              CT
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePlayerCounterTeam(player.id);
                              }}
                              title={player.isCounterTeam ? 'Remove from Counter Team' : 'Add to Counter Team'}
                              className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                                player.isCounterTeam
                                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                                  : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40'
                              }`}
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>{player.isCounterTeam ? 'CT' : 'Set CT'}</span>
                            </button>
                          )}
                        </div>

                        {/* Interactive Group Reassignment (Admin Only) */}
                        {isAdmin && (
                          <div className="pt-1">
                            <select
                              value={player.battleGroup}
                              onChange={(e) => updatePlayerGroup(player.id, e.target.value as BattleGroup)}
                              className="w-full text-[11px] font-bold rounded px-2 py-1 bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer transition"
                            >
                              {ACTIVE_BATTLE_GROUPS.map((g) => (
                                <option key={g} value={g}>
                                  Move to: {g}
                                </option>
                              ))}
                              <option value="Unassigned">{t.unassigned}</option>
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
        })}
      </div>

      {/* Quick Reserve Assigner Modal (Admin Only) */}
      {isAdmin && showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Assign Unallocated Players ({unassignedPlayers.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quickly assign available reserve players directly into Castle, Turrets, or Inactive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReserveModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filter Bar */}
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reserves by name or ID..."
                  value={reserveSearch}
                  onChange={(e) => setReserveSearch(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={reserveAllianceFilter}
                onChange={(e) => setReserveAllianceFilter(e.target.value as Alliance | 'ALL')}
                className="h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-slate-200 font-bold focus:outline-none"
              >
                <option value="ALL">All Alliances</option>
                {ALLIANCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Player List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[50vh]">
              {unassignedPlayers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No unallocated players found matching search.
                </div>
              ) : (
                unassignedPlayers.slice(0, 100).map((player) => {
                  const allianceStyle = ALLIANCE_STYLES[player.alliance];
                  const rankStyle = getRankBadgeStyle(player.rank);
                  const formattedLevel = formatTcLevel(player.tgLevel);
                  const tcBadgeStyle = getTcLevelBadgeStyle(formattedLevel);

                  return (
                    <div
                      key={player.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${allianceStyle.badge}`}
                        >
                          {player.alliance}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${rankStyle}`}>
                          {player.rank}
                        </span>
                        <span className="font-bold text-white text-xs truncate">{player.name}</span>
                        <span className="text-amber-300 font-bold ml-1 shrink-0">
                          {formatPower(player.currentPower)}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 ${tcBadgeStyle}`}>
                          {formattedLevel}
                        </span>
                      </div>

                      {/* Fast assignment buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {ACTIVE_BATTLE_GROUPS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => updatePlayerGroup(player.id, g)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                              g === 'Castle'
                                ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/30'
                                : g === 'Turret 1'
                                ? 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-500/30'
                                : g === 'Turret 2'
                                ? 'bg-violet-950/70 hover:bg-violet-900 text-violet-300 border border-violet-500/30'
                                : g === 'Turret 3'
                                ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/30'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            + {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Showing top {Math.min(unassignedPlayers.length, 100)} of {unassignedPlayers.length} unallocated players
              </span>
              <button
                type="button"
                onClick={() => setShowReserveModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
