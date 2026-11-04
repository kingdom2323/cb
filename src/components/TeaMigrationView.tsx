import React, { useState, useMemo, useCallback } from 'react';
import { useRoster } from '../context/RosterContext';
import {
  TroopTier,
  CbParticipationStatus,
  MigrationDestination,
  PlayerTroopTiers,
  TeaMigrationPlayer,
  TeaMigrationRecord,
  TROOP_TIERS,
  CB_STATUS_CONFIG,
  DESTINATION_CONFIG,
} from '../types/migration';
import { teaMigrationService } from '../services/teaMigrationService';
import {
  formatPower,
  formatFullNumber,
  formatTcLevel,
  getRankBadgeStyle,
} from '../utils/formatters';
import {
  Shield,
  Search,
  Copy,
  Check,
  RotateCcw,
  Users,
  ArrowRightLeft,
  Filter,
  UserCheck,
  UserMinus,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const TeaMigrationView: React.FC = () => {
  const { players, isAdmin, syncWithMightPulse, isSyncingMightPulse } = useRoster();

  // Local state for migration records
  const [records, setRecords] = useState<Record<string, TeaMigrationRecord>>(() =>
    teaMigrationService.loadMigrationRecords()
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState<MigrationDestination | 'ALL'>('ALL');
  const [cbFilter, setCbFilter] = useState<CbParticipationStatus | 'ALL'>('ALL');
  const [tierFilter, setTierFilter] = useState<TroopTier | 'ALL'>('ALL');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Multi-selection for bulk actions (Admin only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter ONLY TEA alliance players from the source of truth
  const teaPlayersRaw = useMemo(() => {
    return players.filter((p) => p.alliance === 'TEA');
  }, [players]);

  // Merge TEA players with their migration records
  const teaPlayers: TeaMigrationPlayer[] = useMemo(() => {
    return teaMigrationService.mergeTeaPlayers(teaPlayersRaw, records);
  }, [teaPlayersRaw, records]);

  // Overall Slot Calculations
  const activeTeaPlayers = useMemo(
    () => teaPlayers.filter((p) => p.destination === 'ACTIVE_TEA'),
    [teaPlayers]
  );
  const vikMigrationPlayers = useMemo(
    () => teaPlayers.filter((p) => p.destination === 'VIK'),
    [teaPlayers]
  );
  const onxMigrationPlayers = useMemo(
    () => teaPlayers.filter((p) => p.destination === 'ONX'),
    [teaPlayers]
  );

  const activeCount = activeTeaPlayers.length;
  const vikCount = vikMigrationPlayers.length;
  const onxCount = onxMigrationPlayers.length;
  const totalTeaCount = teaPlayers.length;

  const MAX_SLOTS = 100;
  const availableSlots = Math.max(0, MAX_SLOTS - activeCount);
  const isOverCapacity = activeCount > MAX_SLOTS;

  // CB Readiness
  const fullyParticipatingCount = useMemo(
    () => activeTeaPlayers.filter((p) => p.cbStatus === 'FULL').length,
    [activeTeaPlayers]
  );
  const partialParticipatingCount = useMemo(
    () => activeTeaPlayers.filter((p) => p.cbStatus === 'PARTIAL').length,
    [activeTeaPlayers]
  );
  const nonParticipatingCount = useMemo(
    () => activeTeaPlayers.filter((p) => p.cbStatus === 'NONE').length,
    [activeTeaPlayers]
  );

  // Update a single player's migration destination
  const handleSetDestination = useCallback(
    (playerId: string, destination: MigrationDestination, tgLevel: string) => {
      const updated = teaMigrationService.updatePlayerRecord(playerId, { destination }, tgLevel);
      setRecords({ ...updated });
    },
    []
  );

  // Update a single player's CB status
  const handleSetCbStatus = useCallback(
    (playerId: string, cbStatus: CbParticipationStatus, tgLevel: string) => {
      const updated = teaMigrationService.updatePlayerRecord(playerId, { cbStatus }, tgLevel);
      setRecords({ ...updated });
    },
    []
  );

  // Update a single troop type's tier
  const handleSetTroopTier = useCallback(
    (
      playerId: string,
      troopType: keyof PlayerTroopTiers,
      tier: TroopTier,
      currentTiers: PlayerTroopTiers,
      tgLevel: string
    ) => {
      const newTiers: PlayerTroopTiers = {
        ...currentTiers,
        [troopType]: tier,
      };
      const updated = teaMigrationService.updatePlayerRecord(
        playerId,
        { troopTiers: newTiers },
        tgLevel
      );
      setRecords({ ...updated });
    },
    []
  );

  // Bulk actions
  const handleBulkDestination = useCallback(
    (destination: MigrationDestination) => {
      if (selectedIds.size === 0) return;
      const tgMap: Record<string, string> = {};
      teaPlayers.forEach((p) => {
        tgMap[p.id] = p.tgLevel;
      });

      const updated = teaMigrationService.batchUpdateRecords(
        Array.from(selectedIds),
        { destination },
        tgMap
      );
      setRecords({ ...updated });
      setSelectedIds(new Set());
    },
    [selectedIds, teaPlayers]
  );

  const handleBulkCbStatus = useCallback(
    (cbStatus: CbParticipationStatus) => {
      if (selectedIds.size === 0) return;
      const tgMap: Record<string, string> = {};
      teaPlayers.forEach((p) => {
        tgMap[p.id] = p.tgLevel;
      });

      const updated = teaMigrationService.batchUpdateRecords(
        Array.from(selectedIds),
        { cbStatus },
        tgMap
      );
      setRecords({ ...updated });
      setSelectedIds(new Set());
    },
    [selectedIds, teaPlayers]
  );

  // Multi-select helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Clipboard copy helpers
  const handleCopyList = (dest: MigrationDestination, label: string) => {
    const text = teaMigrationService.generateCopyList(teaPlayers, dest);
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Filtered & Sorted list
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return teaPlayers.filter((player) => {
      // Destination filter
      if (destinationFilter !== 'ALL' && player.destination !== destinationFilter) {
        return false;
      }
      // CB filter
      if (cbFilter !== 'ALL' && player.cbStatus !== cbFilter) {
        return false;
      }
      // Tier filter
      if (tierFilter !== 'ALL') {
        const hasTier =
          player.troopTiers.infantry === tierFilter ||
          player.troopTiers.cavalry === tierFilter ||
          player.troopTiers.archers === tierFilter;
        if (!hasTier) return false;
      }
      // Search filter
      if (q) {
        const matchName = player.name.toLowerCase().includes(q);
        const matchId = player.id.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [teaPlayers, searchQuery, destinationFilter, cbFilter, tierFilter]);

  // Color helper for troop tiers
  const getTierBadgeStyle = (tier: TroopTier) => {
    switch (tier) {
      case 'TG3':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50 hover:border-purple-400';
      case 'TG2':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50 hover:border-blue-400';
      case 'TG1':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:border-emerald-400';
      case 'T10':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500';
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* =========================================================================
          SECTION 1: TOP SLOT MANAGEMENT & CAPACITY HERO BANNER (X / 100)
          ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Capacity Counter & Slot Gauge */}
          <div className="flex items-center gap-4">
            {/* Big Badge Counter */}
            <div
              className={`flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 shadow-inner transition-all ${
                isOverCapacity
                  ? 'border-rose-500 bg-rose-950/40 text-rose-300 animate-pulse'
                  : activeCount === MAX_SLOTS
                  ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                  : 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                TEA Slots
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl sm:text-4xl font-black">{activeCount}</span>
                <span className="text-sm font-bold text-slate-500">/ 100</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 uppercase ${
                  isOverCapacity
                    ? 'bg-rose-500 text-white'
                    : activeCount === MAX_SLOTS
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/30 text-emerald-300'
                }`}
              >
                {isOverCapacity
                  ? `Over +${activeCount - MAX_SLOTS}`
                  : availableSlots > 0
                  ? `${availableSlots} Open`
                  : 'Full'}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <span>TEA Alliance Roster & Migration Manager</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Kingdom 2323
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Manage TEA alliance capacity to free up spots for incoming server players.
                Move members to <strong>VIK</strong> or <strong>ONX</strong>, record troop tiers,
                and track Castle Battle (CB) participation.
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md pt-1">
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    style={{ width: `${Math.min(100, (activeCount / MAX_SLOTS) * 100)}%` }}
                    className={`transition-all duration-300 ${
                      isOverCapacity
                        ? 'bg-rose-500'
                        : activeCount === MAX_SLOTS
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Active TEA Card */}
            <div
              onClick={() => setDestinationFilter('ACTIVE_TEA')}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                destinationFilter === 'ACTIVE_TEA'
                  ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-sky-400 block">
                Active In TEA
              </span>
              <span className="text-lg font-black text-white">{activeCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Staying in TEA</span>
            </div>

            {/* Migrate to VIK Card */}
            <div
              onClick={() => setDestinationFilter('VIK')}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                destinationFilter === 'VIK'
                  ? 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-purple-400 block">
                Migrate to VIK
              </span>
              <span className="text-lg font-black text-purple-300">{vikCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Slots Freed</span>
            </div>

            {/* Migrate to ONX Card */}
            <div
              onClick={() => setDestinationFilter('ONX')}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                destinationFilter === 'ONX'
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                Migrate to ONX
              </span>
              <span className="text-lg font-black text-amber-300">{onxCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Slots Freed</span>
            </div>

            {/* CB Ready Card */}
            <div
              onClick={() => setCbFilter(cbFilter === 'FULL' ? 'ALL' : 'FULL')}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                cbFilter === 'FULL'
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                CB Full Ready
              </span>
              <span className="text-lg font-black text-emerald-300">
                {fullyParticipatingCount}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {partialParticipatingCount} Partial | {nonParticipatingCount} None
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: TOOLBAR & CONTROLS
          ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search TEA member by name or ID..."
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

          {/* Quick copy migration list buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleCopyList('VIK', 'VIK List Copied!')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold transition shadow-sm"
              title="Copy formatted list of all TEA players migrating to VIK"
            >
              {copiedNotification === 'VIK List Copied!' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-purple-300" />
              )}
              <span>Copy VIK List ({vikCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyList('ONX', 'ONX List Copied!')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-500/40 text-xs font-bold transition shadow-sm"
              title="Copy formatted list of all TEA players migrating to ONX"
            >
              {copiedNotification === 'ONX List Copied!' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Copy ONX List ({onxCount})</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                disabled={isSyncingMightPulse}
                onClick={() => syncWithMightPulse(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
                title="Refresh latest live TEA players from MightPulse / Supabase"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingMightPulse ? 'animate-spin' : ''}`}
                />
                <span>{isSyncingMightPulse ? 'Syncing...' : 'Sync TEA'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Destination Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">
              Category:
            </span>
            <button
              type="button"
              onClick={() => setDestinationFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                destinationFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All TEA ({totalTeaCount})
            </button>
            <button
              type="button"
              onClick={() => setDestinationFilter('ACTIVE_TEA')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                destinationFilter === 'ACTIVE_TEA'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-950 text-sky-400 hover:text-white border border-sky-500/30'
              }`}
            >
              Active TEA ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setDestinationFilter('VIK')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                destinationFilter === 'VIK'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-950 text-purple-400 hover:text-white border border-purple-500/30'
              }`}
            >
              To VIK ({vikCount})
            </button>
            <button
              type="button"
              onClick={() => setDestinationFilter('ONX')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                destinationFilter === 'ONX'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 text-amber-400 hover:text-white border border-amber-500/30'
              }`}
            >
              To ONX ({onxCount})
            </button>
          </div>

          {/* Secondary Filters: CB & Tiers */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* CB Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">CB:</span>
              <select
                value={cbFilter}
                onChange={(e) => setCbFilter(e.target.value as CbParticipationStatus | 'ALL')}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="ALL">All CB</option>
                <option value="FULL">Full Ready</option>
                <option value="PARTIAL">Partial</option>
                <option value="NONE">Not Playing</option>
              </select>
            </div>

            {/* Troop Tier Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as TroopTier | 'ALL')}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="ALL">All Tiers</option>
                <option value="TG3">Has TG3</option>
                <option value="TG2">Has TG2</option>
                <option value="TG1">Has TG1</option>
                <option value="T10">Has T10</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: BULK ACTION BAR (ADMIN ONLY)
          ========================================================================= */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-200">
              {selectedIds.size} player{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Move Selected:</span>
            <button
              type="button"
              onClick={() => handleBulkDestination('ACTIVE_TEA')}
              className="px-2.5 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs transition"
            >
              Active TEA
            </button>
            <button
              type="button"
              onClick={() => handleBulkDestination('VIK')}
              className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition"
            >
              Migrate VIK
            </button>
            <button
              type="button"
              onClick={() => handleBulkDestination('ONX')}
              className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs transition"
            >
              Migrate ONX
            </button>

            <div className="h-4 w-px bg-indigo-700/60 mx-1" />

            <span className="text-slate-400 text-[11px] font-medium mr-1">Set CB:</span>
            <button
              type="button"
              onClick={() => handleBulkCbStatus('FULL')}
              className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => handleBulkCbStatus('PARTIAL')}
              className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs transition"
            >
              Partial
            </button>
            <button
              type="button"
              onClick={() => handleBulkCbStatus('NONE')}
              className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition"
            >
              None
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: PLAYER ROSTER LIST & EDITING CARDS
          ========================================================================= */}
      <div className="space-y-2">
        {filteredPlayers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-slate-500">
            No TEA members found matching current filters.
          </div>
        ) : (
          filteredPlayers.map((player, idx) => {
            const isSelected = selectedIds.has(player.id);
            const destConfig = DESTINATION_CONFIG[player.destination];
            const cbConfig = CB_STATUS_CONFIG[player.cbStatus];
            const rankStyle = getRankBadgeStyle(player.rank);

            return (
              <div
                key={player.id}
                className={`p-3 sm:p-4 rounded-xl border transition shadow-sm ${
                  destConfig.cardBorder
                } ${
                  isSelected
                    ? 'ring-2 ring-indigo-500/80 bg-indigo-950/20'
                    : 'bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Player Identity, Power, CB Tag */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Admin Checkbox */}
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(player.id)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 shrink-0 cursor-pointer"
                      />
                    )}

                    {/* Index */}
                    <span className="text-[11px] text-slate-500 font-mono font-bold w-6 text-right shrink-0 hidden sm:inline">
                      {idx + 1}.
                    </span>

                    {/* Alliance Tag & Rank */}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                      TEA
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${rankStyle}`}>
                      {player.rank}
                    </span>

                    {/* Player Name & Power */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">
                          {player.name}
                        </span>
                        {player.isCounterTeam && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 uppercase">
                            CT
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
                          ID: {player.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span
                          className="font-extrabold text-amber-300"
                          title={formatFullNumber(player.currentPower)}
                        >
                          {formatPower(player.currentPower)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 font-medium">
                          {formatTcLevel(player.tgLevel)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 font-medium">
                          Group: {player.battleGroup || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Granular Troop Tiers (Inf, Cav, Arch) */}
                  <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex-wrap justify-between sm:justify-start">
                    {/* Infantry */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Inf:</span>
                      <div className="flex items-center gap-0.5">
                        {TROOP_TIERS.map((tier) => {
                          const isActive = player.troopTiers.infantry === tier;
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() =>
                                handleSetTroopTier(
                                  player.id,
                                  'infantry',
                                  tier,
                                  player.troopTiers,
                                  player.tgLevel
                                )
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                isActive
                                  ? `${getTierBadgeStyle(tier)} ring-1 ring-white/30 font-black shadow-xs`
                                  : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              {tier}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                    {/* Cavalry */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Cav:</span>
                      <div className="flex items-center gap-0.5">
                        {TROOP_TIERS.map((tier) => {
                          const isActive = player.troopTiers.cavalry === tier;
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() =>
                                handleSetTroopTier(
                                  player.id,
                                  'cavalry',
                                  tier,
                                  player.troopTiers,
                                  player.tgLevel
                                )
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                isActive
                                  ? `${getTierBadgeStyle(tier)} ring-1 ring-white/30 font-black shadow-xs`
                                  : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              {tier}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                    {/* Archers */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Arch:</span>
                      <div className="flex items-center gap-0.5">
                        {TROOP_TIERS.map((tier) => {
                          const isActive = player.troopTiers.archers === tier;
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() =>
                                handleSetTroopTier(
                                  player.id,
                                  'archers',
                                  tier,
                                  player.troopTiers,
                                  player.tgLevel
                                )
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                isActive
                                  ? `${getTierBadgeStyle(tier)} ring-1 ring-white/30 font-black shadow-xs`
                                  : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              {tier}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Castle Battle (CB) Status & Migration Actions */}
                  <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                    {/* CB Participation Selector */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 px-1">
                        CB:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetCbStatus(player.id, 'FULL', player.tgLevel)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          player.cbStatus === 'FULL'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-emerald-300'
                        }`}
                        title="Fully Participating in Castle Battle"
                      >
                        Full
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCbStatus(player.id, 'PARTIAL', player.tgLevel)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          player.cbStatus === 'PARTIAL'
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-400 hover:text-amber-300'
                        }`}
                        title="Partially Participating in Castle Battle"
                      >
                        Partial
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCbStatus(player.id, 'NONE', player.tgLevel)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          player.cbStatus === 'NONE'
                            ? 'bg-rose-700 text-white'
                            : 'text-slate-400 hover:text-rose-300'
                        }`}
                        title="Not Participating in Castle Battle"
                      >
                        None
                      </button>
                    </div>

                    {/* Migration Destination Target */}
                    <div className="flex items-center gap-1">
                      {player.destination === 'ACTIVE_TEA' ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleSetDestination(player.id, 'VIK', player.tgLevel)
                            }
                            className="px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs font-bold transition shadow-xs"
                            title="Move to VIK to free up a slot in TEA"
                          >
                            To VIK
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSetDestination(player.id, 'ONX', player.tgLevel)
                            }
                            className="px-2.5 py-1 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-xs"
                            title="Move to ONX to free up a slot in TEA"
                          >
                            To ONX
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${destConfig.badge}`}
                          >
                            {destConfig.shortLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleSetDestination(player.id, 'ACTIVE_TEA', player.tgLevel)
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                            title="Move back to Active TEA"
                          >
                            Back to TEA
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
