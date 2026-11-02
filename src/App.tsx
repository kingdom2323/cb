import React from 'react';
import { RosterProvider, useRoster } from './context/RosterContext';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AllPlayersView } from './components/AllPlayersView';
import { CastleBattleView } from './components/CastleBattleView';
import { KingdomMapView } from './components/KingdomMapView/KingdomMapView';
import { ImportModal } from './components/ImportModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Database, Loader2, AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, players, isDbLoading, dbStatus } = useRoster();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Top Header */}
      <Header />

      {/* High Density Global Metrics Strip */}
      <StatsBar />

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        {activeTab === 'all-players' && <AllPlayersView />}
        {activeTab === 'castle-battle' && <CastleBattleView />}
        {activeTab === 'kingdom-map' && <KingdomMapView />}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-[11px] text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider">KVK ROSTER</span>
            <span>|</span>
            <span className="text-slate-400 font-medium">Kingshot Alliances: ERA | FFF | TEA | VIK</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold">
              {isDbLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="text-amber-300">Syncing with Supabase...</span>
                </>
              ) : dbStatus === 'connected' ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Supabase Connected</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 font-bold">{players.length} Players</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Supabase Offline (Local Cache Active)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* CSV Import Modal (Admin Only) */}
      <ImportModal />

      {/* Admin Login Modal */}
      <AdminLoginModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <RosterProvider>
        <AppContent />
      </RosterProvider>
    </ErrorBoundary>
  );
}
