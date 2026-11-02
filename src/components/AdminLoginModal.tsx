import React, { useState } from 'react';
import { useRoster } from '../context/RosterContext';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginAdmin } = useRoster();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    const success = loginAdmin(password.trim());
    if (success) {
      setPassword('');
      setError(null);
      setIsLoginModalOpen(false);
    } else {
      setError('Incorrect admin password. Please try again.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Admin Authentication
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Enter the admin password to unlock roster editing, battle allocations, and CSV upload permissions.
          </p>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Enter password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-9 px-3 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
