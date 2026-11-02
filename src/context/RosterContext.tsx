import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  Player,
  Alliance,
  BattleGroup,
  RosterFilters,
  SortField,
  SortDirection,
  GroupStats,
  AllianceStats,
  ALLIANCES,
  ACTIVE_BATTLE_GROUPS,
  BATTLE_GROUPS,
} from '../types/roster';
import { rosterService, mapRowToPlayer } from '../services/rosterService';
import { supabase } from '../services/supabaseClient';
import { formatTcLevel } from '../utils/formatters';

interface RosterContextType {
  players: Player[];
  activeTab: 'all-players' | 'castle-battle';
  setActiveTab: (tab: 'all-players' | 'castle-battle') => void;
  filters: RosterFilters;
  setFilter: <K extends keyof RosterFilters>(key: K, value: RosterFilters[K]) => void;
  resetFilters: () => void;
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
  selectedPlayerIds: Set<string>;
  toggleSelectPlayer: (id: string) => void;
  selectAllFiltered: (ids: string[]) => void;
  clearSelection: () => void;
  updatePlayerGroup: (playerId: string, group: BattleGroup) => Promise<void>;
  batchAssignGroup: (playerIds: string[], group: BattleGroup) => Promise<void>;
  resetAllAllocations: () => Promise<void>;
  reloadInitialData: () => Promise<void>;
  clearAllData: () => void;
  importPlayers: (incoming: Player[], mode: 'merge' | 'replace') => Promise<void>;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  filteredPlayers: Player[];
  groupStats: Record<BattleGroup, GroupStats>;
  allianceStats: Record<Alliance, AllianceStats>;
  totalPower: number;
  isDbLoading: boolean;
  dbStatus: 'connected' | 'syncing' | 'error';
}

const defaultFilters: RosterFilters = {
  search: '',
  alliance: 'ALL',
  rank: 'ALL',
  tcLevel: 'ALL',
  battleGroup: 'ALL',
};

const RosterContext = createContext<RosterContextType | undefined>(undefined);

function getTcLevelWeight(formattedLevel: string): number {
  if (formattedLevel === 'TG3') return 3000;
  if (formattedLevel === 'TG2') return 2000;
  if (formattedLevel === 'TG1') return 1000;
  const num = parseInt(formattedLevel.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export const RosterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => rosterService.loadCachedPlayers());
  const [activeTab, setActiveTab] = useState<'all-players' | 'castle-battle'>('all-players');
  const [filters, setFilters] = useState<RosterFilters>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('currentPower');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('syncing');

  // Initial load from Supabase database
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsDbLoading(true);
      setDbStatus('syncing');
      try {
        const fetched = await rosterService.fetchPlayersFromSupabase();
        if (isMounted) {
          setPlayers(fetched);
          setDbStatus('connected');
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
        if (isMounted) {
          setDbStatus('error');
        }
      } finally {
        if (isMounted) {
          setIsDbLoading(false);
        }
      }
    }

    loadData();

    // Supabase Real-time Subscription for live updates across clients
    const channel = supabase
      .channel('public:players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = mapRowToPlayer(payload.new);
            setPlayers((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          } else if (payload.eventType === 'INSERT') {
            const inserted = mapRowToPlayer(payload.new);
            setPlayers((prev) => {
              if (prev.some((p) => p.id === inserted.id)) {
                return prev.map((p) => (p.id === inserted.id ? inserted : p));
              }
              return [inserted, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const setFilter = useCallback(<K extends keyof RosterFilters>(key: K, value: RosterFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'currentPower' || field === 'tcLevel' ? 'desc' : 'asc');
    }
  }, [sortField]);

  const toggleSelectPlayer = useCallback((id: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback((ids: string[]) => {
    setSelectedPlayerIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlayerIds(new Set());
  }, []);

  // Update battle group in React state immediately and sync to Supabase in real-time
  const updatePlayerGroup = useCallback(async (playerId: string, group: BattleGroup) => {
    // Optimistic UI update
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, battleGroup: group, updatedAt: new Date().toISOString() } : p
      );
      rosterService.cachePlayers(updated);
      return updated;
    });

    // Execute real-time Supabase update
    await rosterService.updatePlayerBattleGroup(playerId, group);
  }, []);

  // Batch update battle groups in React state immediately and sync to Supabase in real-time
  const batchAssignGroup = useCallback(async (playerIds: string[], group: BattleGroup) => {
    const idSet = new Set(playerIds);
    // Optimistic UI update
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        idSet.has(p.id) ? { ...p, battleGroup: group, updatedAt: new Date().toISOString() } : p
      );
      rosterService.cachePlayers(updated);
      return updated;
    });
    setSelectedPlayerIds(new Set());

    // Execute real-time Supabase batch update
    await rosterService.batchUpdateBattleGroup(playerIds, group);
  }, []);

  // Reset all allocations back to unassigned in React state and in Supabase
  const resetAllAllocations = useCallback(async () => {
    setPlayers((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        battleGroup: 'Unassigned' as BattleGroup,
      }));
      rosterService.cachePlayers(updated);
      return updated;
    });

    await rosterService.resetAllAllocationsInSupabase();
  }, []);

  const reloadInitialData = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const refreshed = await rosterService.fetchPlayersFromSupabase();
      setPlayers(refreshed);
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  const clearAllData = useCallback(() => {
    setPlayers([]);
    rosterService.cachePlayers([]);
    setSelectedPlayerIds(new Set());
  }, []);

  // Import players: batch upsert to Supabase
  const importPlayers = useCallback(
    async (incoming: Player[], mode: 'merge' | 'replace') => {
      setIsDbLoading(true);
      setDbStatus('syncing');
      try {
        const preserve = mode === 'merge';
        const updated = await rosterService.upsertPlayersToSupabase(incoming, preserve);
        setPlayers(updated);
        setDbStatus('connected');
      } catch (err) {
        console.error('Import failed:', err);
        setDbStatus('error');
      } finally {
        setIsDbLoading(false);
        setSelectedPlayerIds(new Set());
      }
    },
    []
  );

  // Filtered & Sorted Players for All Players view
  const filteredPlayers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const filtered = players.filter((player) => {
      // Alliance filter
      if (filters.alliance !== 'ALL' && player.alliance !== filters.alliance) {
        return false;
      }
      // Rank filter
      if (filters.rank !== 'ALL') {
        const pRank = (player.rank || '').toUpperCase();
        const fRank = filters.rank.toUpperCase();
        if (fRank === 'R5') {
          if (pRank !== 'R5' && pRank !== 'LEADER') return false;
        } else if (pRank !== fRank) {
          return false;
        }
      }
      // TC level filter
      if (filters.tcLevel !== 'ALL') {
        const levelFormatted = formatTcLevel(player.tgLevel);
        if (filters.tcLevel === 'TG3' && levelFormatted !== 'TG3') return false;
        if (filters.tcLevel === 'TG2' && levelFormatted !== 'TG2') return false;
        if (filters.tcLevel === 'TG1' && levelFormatted !== 'TG1') return false;
        if (filters.tcLevel === 'NON_TG' && !levelFormatted.startsWith('TC')) return false;
        if (filters.tcLevel.startsWith('TC') && levelFormatted !== filters.tcLevel) return false;
      }
      // Battle group filter
      if (filters.battleGroup !== 'ALL' && player.battleGroup !== filters.battleGroup) {
        return false;
      }
      // Search filter (Name or ID)
      if (query) {
        const nameMatch = player.name.toLowerCase().includes(query);
        const idMatch = player.id.toLowerCase().includes(query);
        if (!nameMatch && !idMatch) return false;
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'currentPower':
          comparison = a.currentPower - b.currentPower;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'rank':
          comparison = (a.rank || '').localeCompare(b.rank || '');
          break;
        case 'tcLevel':
          comparison =
            getTcLevelWeight(formatTcLevel(a.tgLevel)) -
            getTcLevelWeight(formatTcLevel(b.tgLevel));
          break;
        case 'alliance':
          comparison = a.alliance.localeCompare(b.alliance);
          break;
        case 'battleGroup':
          comparison = a.battleGroup.localeCompare(b.battleGroup);
          break;
        default:
          comparison = a.currentPower - b.currentPower;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [players, filters, sortField, sortDirection]);

  // Overall power
  const totalPower = useMemo(() => {
    return players.reduce((sum, p) => sum + p.currentPower, 0);
  }, [players]);

  // Group Stats for all battle groups
  const groupStats = useMemo(() => {
    const stats: Record<BattleGroup, GroupStats> = {
      'Castle': {
        group: 'Castle',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
      'Turret 1': {
        group: 'Turret 1',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
      'Turret 2': {
        group: 'Turret 2',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
      'Turret 3': {
        group: 'Turret 3',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
      'Inactive': {
        group: 'Inactive',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
      'Unassigned': {
        group: 'Unassigned',
        count: 0,
        totalPower: 0,
        topPower: 0,
        allianceBreakdown: { ERA: 0, FFF: 0, TEA: 0, VIK: 0 },
      },
    };

    for (const p of players) {
      const g = p.battleGroup || 'Unassigned';
      if (!stats[g]) continue;
      stats[g].count += 1;
      stats[g].totalPower += p.currentPower;
      if (p.currentPower > stats[g].topPower) {
        stats[g].topPower = p.currentPower;
      }
      if (stats[g].allianceBreakdown[p.alliance] !== undefined) {
        stats[g].allianceBreakdown[p.alliance] += 1;
      }
    }

    return stats;
  }, [players]);

  // Alliance stats
  const allianceStats = useMemo(() => {
    const stats: Record<Alliance, AllianceStats> = {
      ERA: { alliance: 'ERA', count: 0, totalPower: 0, assignedCount: 0 },
      FFF: { alliance: 'FFF', count: 0, totalPower: 0, assignedCount: 0 },
      TEA: { alliance: 'TEA', count: 0, totalPower: 0, assignedCount: 0 },
      VIK: { alliance: 'VIK', count: 0, totalPower: 0, assignedCount: 0 },
    };

    for (const p of players) {
      if (!stats[p.alliance]) continue;
      stats[p.alliance].count += 1;
      stats[p.alliance].totalPower += p.currentPower;
      if (p.battleGroup && p.battleGroup !== 'Unassigned' && p.battleGroup !== 'Inactive') {
        stats[p.alliance].assignedCount += 1;
      }
    }

    return stats;
  }, [players]);

  return (
    <RosterContext.Provider
      value={{
        players,
        activeTab,
        setActiveTab,
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
        resetAllAllocations,
        reloadInitialData,
        clearAllData,
        importPlayers,
        isImportModalOpen,
        setIsImportModalOpen,
        filteredPlayers,
        groupStats,
        allianceStats,
        totalPower,
        isDbLoading,
        dbStatus,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
};

export const useRoster = () => {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
};
