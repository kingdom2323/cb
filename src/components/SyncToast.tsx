import React, { useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

export const SyncToast: React.FC = () => {
  const { isSyncingMightPulse, mightPulseNotice, dismissMightPulseNotice } = useRoster();

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!mightPulseNotice) return;
    const timer = setTimeout(() => {
      dismissMightPulseNotice();
    }, 8000);
    return () => clearTimeout(timer);
  }, [mightPulseNotice, dismissMightPulseNotice]);

  if (!isSyncingMightPulse && !mightPulseNotice) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 max-w-md w-full pointer-events-auto font-sans animate-in slide-in-from-top-2 duration-200">
      {isSyncingMightPulse ? (
        // Sync In Progress Toast
        <div className="p-3.5 rounded-xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md flex items-center gap-3 text-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>MightPulse Synchronization</span>
            </h4>
            <p className="text-xs text-indigo-300 mt-0.5">
              Syncing live kingdom data (Kingdom 2323: ERA, FFF, TEA, VIK)...
            </p>
          </div>
        </div>
      ) : mightPulseNotice ? (
        // Result Notification Toast
        <div
          className={`p-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 text-slate-100 border ${
            mightPulseNotice.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/50 ring-1 ring-emerald-500/20'
              : mightPulseNotice.type === 'warning'
              ? 'bg-slate-900/95 border-amber-500/50 ring-1 ring-amber-500/20'
              : 'bg-slate-900/95 border-rose-500/50 ring-1 ring-rose-500/20'
          }`}
        >
          {/* Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              mightPulseNotice.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : mightPulseNotice.type === 'warning'
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}
          >
            {mightPulseNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : mightPulseNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  mightPulseNotice.type === 'success'
                    ? 'text-emerald-400'
                    : mightPulseNotice.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {mightPulseNotice.type === 'success'
                  ? 'MightPulse Live Sync Success'
                  : mightPulseNotice.type === 'warning'
                  ? 'Local CSV Backup Fallback'
                  : 'Synchronization Error'}
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {mightPulseNotice.timestamp}
              </span>
            </div>

            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {mightPulseNotice.message}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismissMightPulseNotice}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
