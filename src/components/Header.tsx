import React, { useState, useRef, useEffect } from 'react';
import { useRoster } from '../context/RosterContext';
import { exportRosterToCsv, downloadFile } from '../utils/csvParser';
import { useTranslation } from '../i18n/useTranslation';
import { Language } from '../i18n/translations';
import {
  Users,
  Castle,
  ArrowRightLeft,
  Download,
  FileSpreadsheet,
  FileJson,
  Check,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
  Eye,
  RefreshCw,
  Globe,
  Menu,
  X,
} from 'lucide-react';

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'PT', label: 'Português', flag: '🇧🇷' },
];

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    players,
    isAdmin,
    logoutAdmin,
    setIsLoginModalOpen,
    syncWithMightPulse,
    isSyncingMightPulse,
  } = useRoster();

  const { t, lang, setLang } = useTranslation();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktopLang = langMenuRef.current?.contains(target);
      const insideMobileLang = mobileLangMenuRef.current?.contains(target);
      if (!insideDesktopLang && !insideMobileLang) {
        setShowLangMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const teaCount = players.filter((p) => p.alliance === 'TEA').length;

  const currentLangOption = LANG_OPTIONS.find((o) => o.code === lang) || LANG_OPTIONS[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/95 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">

        {/* Brand / Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ring-1 ring-indigo-400/30">
            <Castle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase hidden xs:block sm:block">
            {t.headerTitle}
          </h1>
        </div>

        {/* Center Nav Tabs - adaptive */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all-players')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'all-players'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.allPlayers}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all-players' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {players.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('castle-battle')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'castle-battle'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Castle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.castleBattle}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'castle-battle' ? 'bg-rose-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeBattleCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tea-migration')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'tea-migration'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="TEA Alliance Slot & Migration Management (/migrate)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.teaMigration}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'tea-migration' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {teaCount}
            </span>
          </button>
        </nav>

        {/* Right: Desktop action buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Admin actions */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden lg:inline">{t.adminModeActive}</span>
                <span className="lg:hidden">Admin</span>
              </span>

              <button
                type="button"
                disabled={isSyncingMightPulse}
                onClick={() => syncWithMightPulse(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm border border-emerald-400/30 whitespace-nowrap"
                title={t.refreshMightPulse}
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingMightPulse ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">{isSyncingMightPulse ? t.syncing : t.refreshMightPulse}</span>
                <span className="lg:hidden">{isSyncingMightPulse ? t.syncing : 'Sync'}</span>
              </button>

              <button
                type="button"
                onClick={logoutAdmin}
                className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs font-bold transition"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t.logout}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700/80 text-[11px] font-bold flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-slate-400" />
                <span className="hidden md:inline">{t.readOnly}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition shadow-sm"
                title={t.adminLoginBtn}
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.adminLoginBtn}</span>
              </button>
            </div>
          )}

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
              title={t.export}
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden md:inline">{t.export}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                <button type="button" onClick={handleExportCsv} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{t.exportCsv}</span>
                </button>
                <button type="button" onClick={handleExportJson} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium">
                  <FileJson className="w-4 h-4 text-blue-400" />
                  <span>{t.exportJson}</span>
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button type="button" onClick={handleCopySummary} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 font-medium">
                  {copiedNotification ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Users className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{copiedNotification ? t.summaryCopied : t.copySummary}</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentLangOption.flag} {lang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => { setLang(opt.code); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 font-medium transition ${
                      lang === opt.code
                        ? 'bg-indigo-900/60 text-indigo-200'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span>{opt.label}</span>
                    {lang === opt.code && <Check className="w-3 h-3 text-indigo-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: compact right side */}
        <div className="flex sm:hidden items-center gap-1.5">
          {/* Language switcher (icon only on mobile) */}
          <div className="relative" ref={mobileLangMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
            >
              <span>{currentLangOption.flag}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => { setLang(opt.code); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 font-medium transition ${
                      lang === opt.code ? 'bg-indigo-900/60 text-indigo-200' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            aria-label="Menu"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {showMobileMenu && (
        <div className="sm:hidden bg-slate-900 border-t border-slate-800 px-3 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {/* Quick tab switcher for mobile */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('all-players'); setShowMobileMenu(false); }}
              className={`py-1.5 px-1 rounded text-center transition ${
                activeTab === 'all-players' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              {t.allPlayers}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('castle-battle'); setShowMobileMenu(false); }}
              className={`py-1.5 px-1 rounded text-center transition ${
                activeTab === 'castle-battle' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              {t.castleBattle}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('tea-migration'); setShowMobileMenu(false); }}
              className={`py-1.5 px-1 rounded text-center transition flex items-center justify-center gap-1 ${
                activeTab === 'tea-migration' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>TEA</span>
            </button>
          </div>
          {isAdmin ? (
            <>
              {/* Admin badge */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.adminModeActive}</span>
              </div>

              {/* Action row 1 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingMightPulse}
                  onClick={() => { syncWithMightPulse(true); setShowMobileMenu(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition flex-1 justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMightPulse ? 'animate-spin' : ''}`} />
                  <span>{isSyncingMightPulse ? t.syncing : t.refreshMightPulse}</span>
                </button>
              </div>

              {/* Action row 2 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex-1 justify-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.export}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { logoutAdmin(); setShowMobileMenu(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs font-bold transition flex-1 justify-center"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 flex-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{t.readOnly}</span>
              </span>
              <button
                type="button"
                onClick={() => { setIsLoginModalOpen(true); setShowMobileMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex-1 justify-center"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.adminLoginBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => { handleExportCsv(); setShowMobileMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
