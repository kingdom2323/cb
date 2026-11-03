import React, { useState, useRef } from 'react';
import { useRoster } from '../context/RosterContext';
import { parseAllianceCsv, detectAllianceFromFileName } from '../utils/csvParser';
import { Alliance, ALLIANCES, Player } from '../types/roster';
import { INITIAL_PLAYERS } from '../data/initialData';
import {
  Upload,
  X,
  FileCheck,
  AlertCircle,
  FolderArchive,
  Trash2,
  CheckCircle2,
  Loader2,
  Database,
  RefreshCw,
  Radio,
} from 'lucide-react';

interface StagedFile {
  file: File;
  alliance: Alliance;
  parsedPlayers: Player[];
  error?: string;
}

export const ImportModal: React.FC = () => {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    importPlayers,
    syncWithMightPulse,
    isSyncingMightPulse,
  } = useRoster();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isImportModalOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setStatusMessage('Parsing CSV files...');
    const newStaged: StagedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const detected = detectAllianceFromFileName(file.name) || 'ERA';

      try {
        const text = await file.text();
        const result = await parseAllianceCsv(text, detected, file.name);

        newStaged.push({
          file,
          alliance: detected,
          parsedPlayers: result.players,
          error: result.errors.length > 0 && result.players.length === 0 ? result.errors[0] : undefined,
        });
      } catch (err: any) {
        newStaged.push({
          file,
          alliance: detected,
          parsedPlayers: [],
          error: err?.message || 'Failed to read file',
        });
      }
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setIsProcessing(false);
    setStatusMessage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const updateStagedAlliance = (index: number, newAlliance: Alliance) => {
    const item = stagedFiles[index];
    if (!item) return;

    const updatedPlayers = item.parsedPlayers.map((p) => ({
      ...p,
      alliance: newAlliance,
    }));

    setStagedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, alliance: newAlliance, parsedPlayers: updatedPlayers } : f))
    );
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    const allPlayers: Player[] = stagedFiles.flatMap((f) => f.parsedPlayers);
    if (allPlayers.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`Upserting ${allPlayers.length} players to Supabase...`);
    try {
      await importPlayers(allPlayers, importMode);
      setStagedFiles([]);
      setIsImportModalOpen(false);
    } catch (err: any) {
      alert('Failed to sync players to Supabase: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleSyncBundledToSupabase = async () => {
    setIsProcessing(true);
    setStatusMessage('Syncing all 4 alliance CSVs to Supabase...');
    try {
      await importPlayers(INITIAL_PLAYERS, 'merge');
      setStagedFiles([]);
      setIsImportModalOpen(false);
    } catch (err: any) {
      alert('Failed to sync bundled data to Supabase: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleMightPulseSync = async () => {
    try {
      await syncWithMightPulse(importMode === 'merge');
      setIsImportModalOpen(false);
    } catch (err: any) {
      console.warn('MightPulse sync error from modal:', err);
    }
  };

  const totalStagedCount = stagedFiles.reduce((sum, f) => sum + f.parsedPlayers.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Import & Sync CSVs to Supabase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Load CSV files for ERA, FFF, TEA, and VIK. Upserts directly to the Supabase database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* MightPulse Live API Sync Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">MightPulse Live API Sync</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    Kingdom 2323
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Fetches live roster data for <strong className="text-emerald-300">ERA, FFF, TEA, and VIK</strong> directly from MightPulse and upserts into Supabase. Includes automatic local CSV fallback if API is unreachable.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing || isSyncingMightPulse}
              onClick={handleMightPulseSync}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 shadow-sm border border-emerald-400/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMightPulse ? 'animate-spin' : ''}`} />
              <span>{isSyncingMightPulse ? 'Syncing Live Data...' : 'Refresh from MightPulse'}</span>
            </button>
          </div>

          {/* Quick preset action */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FolderArchive className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-200">Sync Bundled 4 Alliances to Supabase</span>
                <p className="text-slate-400 text-[11px]">
                  Batch upserts all 391 verified players from ERA, FFF, TEA, and VIK into Supabase.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSyncBundledToSupabase}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold whitespace-nowrap transition disabled:opacity-50"
            >
              Sync to Supabase
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              dragActive
                ? 'border-indigo-400 bg-indigo-950/20'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-indigo-400 opacity-80" />
              <div className="text-xs font-bold text-slate-200">
                <span>Drag and drop CSV files here, or </span>
                <span className="text-indigo-400 underline underline-offset-2">browse</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Supports ERA, FFF, TEA, VIK. Columns: Name, ID, Rank, Current power, TC level
              </p>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-200">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Staged files list */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Staged Files ({stagedFiles.length})</span>
                <span className="text-indigo-400 font-bold text-[11px]">
                  {totalStagedCount} total players parsed
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stagedFiles.map((staged, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {staged.error ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">{staged.file.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {staged.parsedPlayers.length} players found
                          {staged.error ? ` (${staged.error})` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Alliance dropdown override */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-bold">Alliance:</span>
                        <select
                          value={staged.alliance}
                          onChange={(e) => updateStagedAlliance(idx, e.target.value as Alliance)}
                          className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                        >
                          {ALLIANCES.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStagedFile(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import mode options */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">Supabase Sync Mode</label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2 ${
                  importMode === 'merge'
                    ? 'border-indigo-500 bg-indigo-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block text-slate-200">Upsert (Preserve Battle Groups)</span>
                  <span className="text-[11px] text-slate-400">
                    Updates player power and level in Supabase while preserving existing battle group allocations.
                  </span>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2 ${
                  importMode === 'replace'
                    ? 'border-indigo-500 bg-indigo-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block text-slate-200">Fresh Upsert (Reset Groups)</span>
                  <span className="text-[11px] text-slate-400">
                    Overwrites battle groups with fresh unassigned status in Supabase.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStagedFiles([]);
              setIsImportModalOpen(false);
            }}
            className="px-3 py-1.5 rounded text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={stagedFiles.length === 0 || totalStagedCount === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCheck className="w-3.5 h-3.5" />
            )}
            <span>Confirm & Upsert ({totalStagedCount} Players)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
