import React, { useState } from 'react';
import { useRoster } from '../context/RosterContext';
import { exportRosterToCsv, downloadFile } from '../utils/csvParser';
import {
  Users,
  Castle,
  Upload,
  Download,
  RotateCcw,
  FileSpreadsheet,
  FileJson,
  Check,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
  Eye,
  Map,
  RefreshCw,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsImportModalOpen,
    players,
    resetAllAllocations,
    isAdmin,
    logoutAdmin,
    setIsLoginModalOpen,
    syncWithMightPulse,
    isSyncingMightPulse,
  } = useRoster();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleExportCsv = () => {
    const csv = exportRosterToCsv(players);
    downloadFile(csv, `kvk_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    setShowExportMenu(false);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(players, null, 2);
    downloadFile(json, `kvk_roster_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    setShowExportMenu(false);
  };

  const handleCopySummary = () => {
    const castleCount = players.filter((p) => p.battleGroup === 'Castle').length;
    const t1Count = players.filter((p) => p.battleGroup === 'Turret 1').length;
    const t2Count = players.filter((p) => p.battleGroup === 'Turret 2').length;
    const t3Count = players.filter((p) => p.battleGroup === 'Turret 3').length;
    const inactiveCount = players.filter((p) => p.battleGroup === 'Inactive').length;
    const unassignedCount = players.filter((p) => p.battleGroup === 'Unassigned').length;

    const summaryText = [
      'KvK Battle Roster Summary',
      '=========================',
      `Total Players: ${players.length}`,
      `Castle: ${castleCount}`,
      `Turret 1: ${t1Count}`,
      `Turret 2: ${t2Count}`,
      `Turret 3: ${t3Count}`,
      `Inactive: ${inactiveCount}`,
      `Unassigned: ${unassignedCount}`,
      `Exported: ${new Date().toLocaleString()}`,
    ].join('\n');

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    setShowExportMenu(false);
  };

  const activeBattleCount = players.filter(
    (p) => p.battleGroup !== 'Unassigned' && p.battleGroup !== 'Inactive'
  ).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/95 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo: ONLY "KVK ROSTER" in bold clean Montserrat */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ring-1 ring-indigo-400/30">
            <Castle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wider text-white uppercase">
            KVK ROSTER
          </h1>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 order-3 sm:order-2 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setActiveTab('all-players')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'all-players'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Players</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all-players'
                  ? 'bg-indigo-800 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {players.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('castle-battle')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'castle-battle'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Castle className="w-3.5 h-3.5" />
            <span>Castle Battle</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'castle-battle'
                  ? 'bg-rose-800 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeBattleCount}
            </span>
          </button>
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          {/* Admin Mode Status & Controls */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Mode Active</span>
                <span className="sm:hidden">Admin</span>
              </span>

              {/* Prominent Admin Refresh from MightPulse Button */}
              <button
                type="button"
                disabled={isSyncingMightPulse}
                onClick={() => syncWithMightPulse(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm border border-emerald-400/30"
                title="Refresh and sync live data from MightPulse API for Kingdom 2323 (with local CSV fallback)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMightPulse ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isSyncingMightPulse ? 'Syncing...' : 'Refresh from MightPulse'}
                </span>
                <span className="sm:hidden">
                  {isSyncingMightPulse ? 'Syncing...' : 'Refresh'}
                </span>
              </button>

              {/* Secret Tactical Map Link (Admin Dashboard Tool) */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'kingdom-map' ? 'castle-battle' : 'kingdom-map')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition border ${
                  activeTab === 'kingdom-map'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                }`}
                title="Tactical Kingdom Map (/map)"
              >
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">{activeTab === 'kingdom-map' ? 'Exit Map' : 'Tactical Map'}</span>
              </button>

              {/* CSV Upload Button (Admin Only) */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                title="Import & Sync Alliance CSV Files"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Import CSVs</span>
                <span className="md:hidden">Import</span>
              </button>

              {/* Reset Allocations (Admin Only) */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all battle group assignments back to Unassigned in Supabase?')) {
                    resetAllAllocations();
                  }
                }}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                title="Reset All Battle Allocations"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logoutAdmin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs font-bold transition"
                title="Exit Admin Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700/80 text-[11px] font-bold flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Read-Only</span>
              </span>

              {/* Discrete Admin Login Button */}
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition shadow-sm"
                title="Login with Admin password"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            </div>
          )}

          {/* Export Dropdown (Available in both Read-Only & Admin modes) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
              title="Export roster data"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden md:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export as CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <FileJson className="w-4 h-4 text-blue-400" />
                  <span>Export as JSON</span>
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  {copiedNotification ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Users className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{copiedNotification ? 'Summary Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
