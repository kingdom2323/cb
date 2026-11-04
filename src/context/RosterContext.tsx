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
  TabType,
  ALLIANCES,
  ACTIVE_BATTLE_GROUPS,
  BATTLE_GROUPS,
} from '../types/roster';
import { rosterService, mapRowToPlayer } from '../services/rosterService';
import { supabase } from '../services/supabaseClient';
import { mightPulseService, MightPulseSyncResult } from '../services/mightPulseService';
import { formatTcLevel } from '../utils/formatters';

const ADMIN_PASSWORD = 'kvk2323r4';
const AUTH_STORAGE_KEY = 'kvk_roster_admin_auth';

interface RosterContextType {
  players: Player[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
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
  togglePlayerCounterTeam: (playerId: string) => Promise<void>;
  batchSetCounterTeam: (playerIds: string[], isCounterTeam: boolean) => Promise<void>;
  resetAllAllocations: () => Promise<void>;
  reloadInitialData: () => Promise<void>;
  clearAllData: () => void;
  importPlayers: (incoming: Player[], mode: 'merge' | 'replace') => Promise<void>;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  filteredPlayers: Player[];
  groupStats: Record<BattleGroup, GroupStats>;
  allianceStats: Record<Alliance, AllianceStats>;
  counterTeamStats: { count: number; totalPower: number };
  totalPower: number;
  isDbLoading: boolean;
  dbStatus: 'connected' | 'syncing' | 'error';
  // Admin Authentication State
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  // MightPulse Live Sync
  syncWithMightPulse: (preserveGroups?: boolean) => Promise<MightPulseSyncResult>;
  isSyncingMightPulse: boolean;
  mightPulseNotice: { type: 'success' | 'warning' | 'error'; message: string; timestamp: string } | null;
  dismissMightPulseNotice: () => void;
}

const defaultFilters: RosterFilters = {
  search: '',
  alliance: 'ALL',
  rank: 'ALL',
  tcLevel: 'ALL',
  battleGroup: 'ALL',
  counterTeam: 'ALL',
};

const RosterContext = createContext<RosterContextType | undefined>(undefined);

function getTcLevelWeight(formattedLevel: string): number {
  if (formattedLevel === 'TG3') return 3000;
  if (formattedLevel === 'TG2') return 2000;
  if (formattedLevel === 'TG1') return 1000;
  const num = parseInt(formattedLevel.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function getInitialTabFromUrl(): TabType {
  try {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    if (
      hash === '#/map' ||
      hash === '#map' ||
      path.endsWith('/map') ||
      path.endsWith('/map/') ||
      search.get('tab') === 'map' ||
      search.get('view') === 'map'
    ) {
      return 'kingdom-map';
    }
    if (hash === '#/castle' || hash === '#castle' || search.get('tab') === 'castle') {
      return 'castle-battle';
    }
  } catch (e) {
    console.warn('URL parse error:', e);
  }
  return 'all-players';
}

export const RosterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => rosterService.loadCachedPlayers());
  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTabFromUrl);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    if (tab === 'kingdom-map') {
      if (window.location.hash !== '#/map' && window.location.hash !== '#map') {
        window.location.hash = '/map';
      }
    } else if (tab === 'castle-battle') {
      if (window.location.hash === '#/map' || window.location.hash === '#map') {
        window.location.hash = '/castle';
      }
    } else {
      if (window.location.hash === '#/map' || window.location.hash === '#map') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Listen for hash changes to navigate seamlessly between views
  useEffect(() => {
    const handleHash = () => {
      const tab = getInitialTabFromUrl();
      setActiveTabState(tab);
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);
  const [filters, setFilters] = useState<RosterFilters>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('currentPower');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('syncing');

  // Admin authentication state: default is Read-Only (false) unless stored in localStorage
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSyncingMightPulse, setIsSyncingMightPulse] = useState<boolean>(false);
  const [mightPulseNotice, setMightPulseNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
  } | null>(null);

  const dismissMightPulseNotice = useCallback(() => {
    setMightPulseNotice(null);
  }, []);

  const loginAdmin = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
    setSelectedPlayerIds(new Set());
  }, []);

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
    if (!isAdmin) return; // Only admin can multi-select for bulk actions
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [isAdmin]);

  const selectAllFiltered = useCallback((ids: string[]) => {
    if (!isAdmin) return;
    setSelectedPlayerIds(new Set(ids));
  }, [isAdmin]);

  const clearSelection = useCallback(() => {
    setSelectedPlayerIds(new Set());
  }, []);

  // Update battle group in React state immediately and sync to Supabase in real-time
  const updatePlayerGroup = useCallback(async (playerId: string, group: BattleGroup) => {
    if (!isAdmin) return; // Guard: Only admin can modify assignments

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
  }, [isAdmin]);

  // Batch update battle groups in React state immediately and sync to Supabase in real-time
  const batchAssignGroup = useCallback(async (playerIds: string[], group: BattleGroup) => {
    if (!isAdmin) return; // Guard: Only admin can batch assign
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
  }, [isAdmin]);

  // Toggle Counter Team dual categorization for a player
  const togglePlayerCounterTeam = useCallback(async (playerId: string) => {
    if (!isAdmin) return; // Guard: Only admin can toggle counter team
    let nextStatus = false;

    // Optimistic UI update
    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playerId) {
          nextStatus = !p.isCounterTeam;
          return { ...p, isCounterTeam: nextStatus, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      rosterService.cachePlayers(updated);
      return updated;
    });

    // Execute real-time Supabase update
    await rosterService.updatePlayerCounterTeam(playerId, nextStatus);
  }, [isAdmin]);

  // Batch assign/remove Counter Team status for multiple selected players
  const batchSetCounterTeam = useCallback(async (playerIds: string[], isCounterTeam: boolean) => {
    if (!isAdmin || !Array.isArray(playerIds) || playerIds.length === 0) return;
    const idSet = new Set(playerIds);

    // Optimistic UI update
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        idSet.has(p.id) ? { ...p, isCounterTeam, updatedAt: new Date().toISOString() } : p
      );
      rosterService.cachePlayers(updated);
      return updated;
    });
    setSelectedPlayerIds(new Set());

    // Execute real-time Supabase batch update
    await rosterService.batchUpdateCounterTeam(playerIds, isCounterTeam);
  }, [isAdmin]);

  // Reset all allocations back to unassigned in React state and in Supabase
  const resetAllAllocations = useCallback(async () => {
    if (!isAdmin) return; // Guard: Only admin can reset allocations
    setPlayers((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        battleGroup: 'Unassigned' as BattleGroup,
      }));
      rosterService.cachePlayers(updated);
      return updated;
    });

    await rosterService.resetAllAllocationsInSupabase();
  }, [isAdmin]);

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
    if (!isAdmin) return;
    setPlayers([]);
    rosterService.cachePlayers([]);
    setSelectedPlayerIds(new Set());
  }, [isAdmin]);

  // MightPulse live synchronization with local CSV fallback and Supabase upsert
  const syncWithMightPulse = useCallback(
    async (preserveGroups = true): Promise<MightPulseSyncResult> => {
      if (!isAdmin) {
        throw new Error('Admin authentication required to sync live data');
      }

      setIsSyncingMightPulse(true);
      setIsDbLoading(true);
      setDbStatus('syncing');

      try {
        const result = await mightPulseService.syncKingdomData(preserveGroups);
        setPlayers(result.players);
        rosterService.cachePlayers(result.players);
        setDbStatus('connected');

        setMightPulseNotice({
          type: result.source === 'mightpulse' ? 'success' : 'warning',
          message: result.message,
          timestamp: new Date().toLocaleTimeString(),
        });

        return result;
      } catch (err: any) {
        console.error('MightPulse sync error:', err);
        setDbStatus('error');
        setMightPulseNotice({
          type: 'error',
          message: `Live data sync failed: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString(),
        });
        throw err;
      } finally {
        setIsSyncingMightPulse(false);
        setIsDbLoading(false);
      }
    },
    [isAdmin]
  );
  const importPlayers = useCallback(
    async (incoming: Player[], mode: 'merge' | 'replace') => {
      if (!isAdmin) return; // Guard: Only admin can import/upsert
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
    [isAdmin]
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
      // Counter team filter
      if (filters.counterTeam === 'YES' && !player.isCounterTeam) {
        return false;
      }
      if (filters.counterTeam === 'NO' && player.isCounterTeam) {
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
        case 'isCounterTeam':
          comparison = (a.isCounterTeam ? 1 : 0) - (b.isCounterTeam ? 1 : 0);
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
      if (p.isCounterTeam) {
        stats[g].counterTeamCount = (stats[g].counterTeamCount || 0) + 1;
        stats[g].counterTeamPower = (stats[g].counterTeamPower || 0) + p.currentPower;
      }
    }

    return stats;
  }, [players]);

  // Global Counter Team Stats
  const counterTeamStats = useMemo(() => {
    const counterMembers = players.filter((p) => p.isCounterTeam);
    return {
      count: counterMembers.length,
      totalPower: counterMembers.reduce((sum, p) => sum + p.currentPower, 0),
    };
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
        togglePlayerCounterTeam,
        batchSetCounterTeam,
        resetAllAllocations,
        reloadInitialData,
        clearAllData,
        importPlayers,
        isImportModalOpen,
        setIsImportModalOpen,
        filteredPlayers,
        groupStats,
        allianceStats,
        counterTeamStats,
        totalPower,
        isDbLoading,
        dbStatus,
        isAdmin,
        loginAdmin,
        logoutAdmin,
        isLoginModalOpen,
        setIsLoginModalOpen,
        syncWithMightPulse,
        isSyncingMightPulse,
        mightPulseNotice,
        dismissMightPulseNotice,
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
