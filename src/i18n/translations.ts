export type Language = 'EN' | 'FR' | 'ES' | 'PT';

export interface Translations {
  // Header
  headerTitle: string;
  allPlayers: string;
  castleBattle: string;
  adminModeActive: string;
  adminLoginBtn: string;
  readOnly: string;
  refreshMightPulse: string;
  syncing: string;
  tacticalMap: string;
  exitMap: string;
  importCsvs: string;
  import: string;
  export: string;
  exportCsv: string;
  exportJson: string;
  copySummary: string;
  summaryCopied: string;
  resetAllocations: string;
  logout: string;
  // StatsBar
  totalPlayers: string;
  combinedPower: string;
  battleAssigned: string;
  alliances: string;
  // AllPlayersView filters
  searchRoster: string;
  searchPlaceholder: string;
  alliance: string;
  allAlliances: string;
  rank: string;
  allRanks: string;
  tcLevel: string;
  allTcLevels: string;
  tcStandard: string;
  battleGroup: string;
  allGroups: string;
  showing: string;
  of: string;
  players: string;
  resetFilters: string;
  rowsPerPage: string;
  // Bulk actions
  selected: string;
  clear: string;
  assignSelectedTo: string;
  // Table headers
  colIndex: string;
  colAlliance: string;
  colRank: string;
  colName: string;
  colId: string;
  colPower: string;
  colTcLevel: string;
  colBattleGroup: string;
  // Castle Battle View
  reserve: string;
  unassigned: string;
  clearGroup: string;
  copyGroupList: string;
  addPlayers: string;
  // Map View
  kingdomMap: string;
  rosterDrawer: string;
  roster: string;
  adminTacticalControl: string;
  readOnlyObserver: string;
  jump: string;
  go: string;
  measureDistance: string;
  footprintOff: string;
  // Toast
  syncSuccess: string;
  csvFallback: string;
  syncError: string;
  syncingLive: string;
  // Confirm dialogs
  confirmResetAllocations: string;
  confirmClearGroup: string;
  // Language
  language: string;
  // Admin Login Modal
  adminAuth: string;
  enterAdminPasswordDesc: string;
  adminPasswordLabel: string;
  enterPasswordPlaceholder: string;
  cancel: string;
  authenticate: string;
  incorrectPassword: string;
  pleaseEnterPassword: string;
  // Tactical Drawer & Modal
  drawerAll: string;
  quickAssign: string;
  noPlayersFound: string;
  close: string;
  centerCamera: string;
  counterTeam: string;
  counterTeamShort: string;
  toggleCounterTeam: string;
  addToCounterTeam: string;
  removeFromCounterTeam: string;
  counterTeamFilter: string;
  allCounterTeam: string;
  ctOnly: string;
  nonCT: string;
  markAsCounterTeam: string;
  removeFromCTBulk: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  EN: {
    headerTitle: 'KVK ROSTER',
    allPlayers: 'All Players',
    castleBattle: 'Castle Battle',
    adminModeActive: 'Admin Mode Active',
    adminLoginBtn: 'Admin Login',
    readOnly: 'Read-Only',
    refreshMightPulse: 'Refresh from MightPulse',
    syncing: 'Syncing...',
    tacticalMap: 'Tactical Map',
    exitMap: 'Exit Map',
    importCsvs: 'Import CSVs',
    import: 'Import',
    export: 'Export',
    exportCsv: 'Export as CSV',
    exportJson: 'Export as JSON',
    copySummary: 'Copy Summary',
    summaryCopied: 'Summary Copied!',
    resetAllocations: 'Reset Allocations',
    logout: 'Logout',
    totalPlayers: 'Total Players',
    combinedPower: 'Combined Power',
    battleAssigned: 'Battle Assigned',
    alliances: 'Alliances',
    searchRoster: 'Search Roster',
    searchPlaceholder: 'Search player name or ID...',
    alliance: 'Alliance',
    allAlliances: 'All Alliances',
    rank: 'Rank',
    allRanks: 'All Ranks',
    tcLevel: 'TC Level',
    allTcLevels: 'All TC Levels',
    tcStandard: 'TC Standard (1 to 30)',
    battleGroup: 'Battle Group',
    allGroups: 'All Groups',
    showing: 'Showing',
    of: 'of',
    players: 'players',
    resetFilters: 'Reset Filters',
    rowsPerPage: 'Rows per page',
    selected: 'selected',
    clear: 'Clear',
    assignSelectedTo: 'Assign selected to',
    colIndex: '#',
    colAlliance: 'Alliance',
    colRank: 'Rank',
    colName: 'Name',
    colId: 'ID',
    colPower: 'Power',
    colTcLevel: 'TC Level',
    colBattleGroup: 'Battle Group',
    reserve: 'Reserve',
    unassigned: 'Unassigned',
    clearGroup: 'Clear Group',
    copyGroupList: 'Copy List',
    addPlayers: 'Add Players',
    kingdomMap: 'KINGDOM MAP',
    rosterDrawer: 'Roster Drawer',
    roster: 'Roster',
    adminTacticalControl: 'Admin Tactical Control Active',
    readOnlyObserver: 'Read-Only Observer Mode',
    jump: 'Jump',
    go: 'Go',
    measureDistance: 'Measure Distance',
    footprintOff: 'Footprint: Off',
    syncSuccess: 'MightPulse Live Sync Success',
    csvFallback: 'Local CSV Backup Fallback',
    syncError: 'Synchronization Error',
    syncingLive: 'Syncing live kingdom data (Kingdom 2323: ERA, FFF, TEA, VIK)...',
    confirmResetAllocations: 'Reset all battle group assignments back to Unassigned in Supabase?',
    confirmClearGroup: 'Remove all players from this group back to unallocated reserve?',
    language: 'Language',
    adminAuth: 'Admin Authentication',
    enterAdminPasswordDesc: 'Enter the admin password to unlock roster editing, battle allocations, and CSV upload permissions.',
    adminPasswordLabel: 'Admin Password',
    enterPasswordPlaceholder: 'Enter password...',
    cancel: 'Cancel',
    authenticate: 'Authenticate',
    incorrectPassword: 'Incorrect admin password. Please try again.',
    pleaseEnterPassword: 'Please enter the admin password',
    drawerAll: 'All',
    quickAssign: 'Quick Assign',
    noPlayersFound: 'No matching players found.',
    close: 'Close',
    centerCamera: 'Center Camera',
    counterTeam: 'Counter Team',
    counterTeamShort: 'CT',
    toggleCounterTeam: 'Toggle Counter Team',
    addToCounterTeam: 'Add to Counter Team',
    removeFromCounterTeam: 'Remove from Counter Team',
    counterTeamFilter: 'Counter Team',
    allCounterTeam: 'All',
    ctOnly: 'CT Only',
    nonCT: 'Non-CT',
    markAsCounterTeam: 'Mark as Counter Team',
    removeFromCTBulk: 'Remove CT Status',
  },
  FR: {
    headerTitle: 'ROSTER KVK',
    allPlayers: 'Tous les joueurs',
    castleBattle: 'Bataille Chateau',
    adminModeActive: 'Mode Admin Actif',
    adminLoginBtn: 'Connexion Admin',
    readOnly: 'Lecture seule',
    refreshMightPulse: 'Actualiser MightPulse',
    syncing: 'Synchronisation...',
    tacticalMap: 'Carte Tactique',
    exitMap: 'Quitter Carte',
    importCsvs: 'Importer CSV',
    import: 'Importer',
    export: 'Exporter',
    exportCsv: 'Exporter en CSV',
    exportJson: 'Exporter en JSON',
    copySummary: 'Copier Resume',
    summaryCopied: 'Resume copie!',
    resetAllocations: 'Reinitialiser',
    logout: 'Deconnexion',
    totalPlayers: 'Total Joueurs',
    combinedPower: 'Puissance Totale',
    battleAssigned: 'Assignes Bataille',
    alliances: 'Alliances',
    searchRoster: 'Rechercher',
    searchPlaceholder: 'Rechercher nom ou ID...',
    alliance: 'Alliance',
    allAlliances: 'Toutes Alliances',
    rank: 'Rang',
    allRanks: 'Tous Rangs',
    tcLevel: 'Niveau TC',
    allTcLevels: 'Tous Niveaux',
    tcStandard: 'TC Standard (1 a 30)',
    battleGroup: 'Groupe Bataille',
    allGroups: 'Tous Groupes',
    showing: 'Affichage',
    of: 'sur',
    players: 'joueurs',
    resetFilters: 'Reinitialiser Filtres',
    rowsPerPage: 'Lignes par page',
    selected: 'selectionne(s)',
    clear: 'Effacer',
    assignSelectedTo: 'Assigner a',
    colIndex: '#',
    colAlliance: 'Alliance',
    colRank: 'Rang',
    colName: 'Nom',
    colId: 'ID',
    colPower: 'Puissance',
    colTcLevel: 'Niveau TC',
    colBattleGroup: 'Groupe Bataille',
    reserve: 'Reserve',
    unassigned: 'Non Assigne',
    clearGroup: 'Vider Groupe',
    copyGroupList: 'Copier Liste',
    addPlayers: 'Ajouter Joueurs',
    kingdomMap: 'CARTE DU ROYAUME',
    rosterDrawer: 'Panneau Roster',
    roster: 'Roster',
    adminTacticalControl: 'Controle Tactique Admin Actif',
    readOnlyObserver: 'Mode Observation Lecture seule',
    jump: 'Aller',
    go: 'OK',
    measureDistance: 'Mesurer Distance',
    footprintOff: 'Empreinte: Off',
    syncSuccess: 'Sync MightPulse Reussie',
    csvFallback: 'Repli CSV Local',
    syncError: 'Erreur Synchronisation',
    syncingLive: 'Synchronisation donnees royaume 2323...',
    confirmResetAllocations: 'Reinitialiser tous les groupes de bataille a Non Assigne?',
    confirmClearGroup: 'Retirer tous les joueurs de ce groupe vers la reserve?',
    language: 'Langue',
    adminAuth: 'Authentification Admin',
    enterAdminPasswordDesc: 'Entrez le mot de passe admin pour deverrouiller l\'edition du roster et les attributions.',
    adminPasswordLabel: 'Mot de passe Admin',
    enterPasswordPlaceholder: 'Entrez le mot de passe...',
    cancel: 'Annuler',
    authenticate: 'Connexion',
    incorrectPassword: 'Mot de passe incorrect. Veuillez reessayer.',
    pleaseEnterPassword: 'Veuillez entrer le mot de passe admin',
    drawerAll: 'Tous',
    quickAssign: 'Assignation Rapide',
    noPlayersFound: 'Aucun joueur trouve.',
    close: 'Fermer',
    centerCamera: 'Centrer Camera',
    counterTeam: 'Equipe Contre',
    counterTeamShort: 'CT',
    toggleCounterTeam: 'Basculer Equipe Contre',
    addToCounterTeam: 'Ajouter Equipe Contre',
    removeFromCounterTeam: 'Retirer Equipe Contre',
    counterTeamFilter: 'Equipe Contre',
    allCounterTeam: 'Tous',
    ctOnly: 'CT Seulement',
    nonCT: 'Non-CT',
    markAsCounterTeam: 'Marquer Equipe Contre',
    removeFromCTBulk: 'Retirer Statut CT',
  },
  ES: {
    headerTitle: 'ROSTER KVK',
    allPlayers: 'Todos los jugadores',
    castleBattle: 'Batalla Castillo',
    adminModeActive: 'Modo Admin Activo',
    adminLoginBtn: 'Acceso Admin',
    readOnly: 'Solo Lectura',
    refreshMightPulse: 'Actualizar MightPulse',
    syncing: 'Sincronizando...',
    tacticalMap: 'Mapa Tactico',
    exitMap: 'Salir Mapa',
    importCsvs: 'Importar CSV',
    import: 'Importar',
    export: 'Exportar',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
    copySummary: 'Copiar Resumen',
    summaryCopied: 'Resumen copiado!',
    resetAllocations: 'Reiniciar',
    logout: 'Cerrar Sesion',
    totalPlayers: 'Total Jugadores',
    combinedPower: 'Poder Combinado',
    battleAssigned: 'Asignados Batalla',
    alliances: 'Alianzas',
    searchRoster: 'Buscar',
    searchPlaceholder: 'Buscar nombre o ID...',
    alliance: 'Alianza',
    allAlliances: 'Todas las Alianzas',
    rank: 'Rango',
    allRanks: 'Todos los Rangos',
    tcLevel: 'Nivel TC',
    allTcLevels: 'Todos los Niveles',
    tcStandard: 'TC Estandar (1 a 30)',
    battleGroup: 'Grupo Batalla',
    allGroups: 'Todos los Grupos',
    showing: 'Mostrando',
    of: 'de',
    players: 'jugadores',
    resetFilters: 'Reiniciar Filtros',
    rowsPerPage: 'Filas por pagina',
    selected: 'seleccionado(s)',
    clear: 'Limpiar',
    assignSelectedTo: 'Asignar a',
    colIndex: '#',
    colAlliance: 'Alianza',
    colRank: 'Rango',
    colName: 'Nombre',
    colId: 'ID',
    colPower: 'Poder',
    colTcLevel: 'Nivel TC',
    colBattleGroup: 'Grupo Batalla',
    reserve: 'Reserva',
    unassigned: 'Sin Asignar',
    clearGroup: 'Vaciar Grupo',
    copyGroupList: 'Copiar Lista',
    addPlayers: 'Agregar Jugadores',
    kingdomMap: 'MAPA DEL REINO',
    rosterDrawer: 'Panel Roster',
    roster: 'Roster',
    adminTacticalControl: 'Control Tactico Admin Activo',
    readOnlyObserver: 'Modo Observador Solo Lectura',
    jump: 'Ir a',
    go: 'OK',
    measureDistance: 'Medir Distancia',
    footprintOff: 'Huella: Off',
    syncSuccess: 'Sync MightPulse Exitosa',
    csvFallback: 'Respaldo CSV Local',
    syncError: 'Error de Sincronizacion',
    syncingLive: 'Sincronizando datos reino 2323...',
    confirmResetAllocations: 'Reiniciar todos los grupos de batalla a Sin Asignar?',
    confirmClearGroup: 'Retirar todos los jugadores de este grupo a la reserva?',
    language: 'Idioma',
    adminAuth: 'Autenticacion Admin',
    enterAdminPasswordDesc: 'Ingrese la contrasena de admin para desbloquear edicion y asignaciones.',
    adminPasswordLabel: 'Contrasena Admin',
    enterPasswordPlaceholder: 'Ingrese la contrasena...',
    cancel: 'Cancelar',
    authenticate: 'Iniciar',
    incorrectPassword: 'Contrasena incorrecta. Intente de nuevo.',
    pleaseEnterPassword: 'Por favor ingrese la contrasena de admin',
    drawerAll: 'Todos',
    quickAssign: 'Asignacion Rapida',
    noPlayersFound: 'No se encontraron jugadores.',
    close: 'Cerrar',
    centerCamera: 'Centrar Camara',
    counterTeam: 'Equipo Contra',
    counterTeamShort: 'CT',
    toggleCounterTeam: 'Alternar Equipo Contra',
    addToCounterTeam: 'Agregar al Equipo Contra',
    removeFromCounterTeam: 'Quitar del Equipo Contra',
    counterTeamFilter: 'Equipo Contra',
    allCounterTeam: 'Todos',
    ctOnly: 'Solo CT',
    nonCT: 'No-CT',
    markAsCounterTeam: 'Marcar Equipo Contra',
    removeFromCTBulk: 'Quitar Estado CT',
  },
  PT: {
    headerTitle: 'ROSTER KVK',
    allPlayers: 'Todos Jogadores',
    castleBattle: 'Batalha Castelo',
    adminModeActive: 'Modo Admin Ativo',
    adminLoginBtn: 'Login Admin',
    readOnly: 'Somente Leitura',
    refreshMightPulse: 'Atualizar MightPulse',
    syncing: 'Sincronizando...',
    tacticalMap: 'Mapa Tatico',
    exitMap: 'Sair Mapa',
    importCsvs: 'Importar CSV',
    import: 'Importar',
    export: 'Exportar',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
    copySummary: 'Copiar Resumo',
    summaryCopied: 'Resumo copiado!',
    resetAllocations: 'Reiniciar',
    logout: 'Sair',
    totalPlayers: 'Total Jogadores',
    combinedPower: 'Poder Combinado',
    battleAssigned: 'Atribuidos Batalha',
    alliances: 'Aliancas',
    searchRoster: 'Pesquisar',
    searchPlaceholder: 'Pesquisar nome ou ID...',
    alliance: 'Alianca',
    allAlliances: 'Todas Aliancas',
    rank: 'Rank',
    allRanks: 'Todos Ranks',
    tcLevel: 'Nivel TC',
    allTcLevels: 'Todos Niveis',
    tcStandard: 'TC Padrao (1 a 30)',
    battleGroup: 'Grupo Batalha',
    allGroups: 'Todos Grupos',
    showing: 'Exibindo',
    of: 'de',
    players: 'jogadores',
    resetFilters: 'Reiniciar Filtros',
    rowsPerPage: 'Linhas por pagina',
    selected: 'selecionado(s)',
    clear: 'Limpar',
    assignSelectedTo: 'Atribuir a',
    colIndex: '#',
    colAlliance: 'Alianca',
    colRank: 'Rank',
    colName: 'Nome',
    colId: 'ID',
    colPower: 'Poder',
    colTcLevel: 'Nivel TC',
    colBattleGroup: 'Grupo Batalha',
    reserve: 'Reserva',
    unassigned: 'Nao Atribuido',
    clearGroup: 'Limpar Grupo',
    copyGroupList: 'Copiar Lista',
    addPlayers: 'Adicionar Jogadores',
    kingdomMap: 'MAPA DO REINO',
    rosterDrawer: 'Painel Roster',
    roster: 'Roster',
    adminTacticalControl: 'Controle Tatico Admin Ativo',
    readOnlyObserver: 'Modo Observador Somente Leitura',
    jump: 'Ir para',
    go: 'OK',
    measureDistance: 'Medir Distancia',
    footprintOff: 'Pegada: Off',
    syncSuccess: 'Sync MightPulse Bem-Sucedida',
    csvFallback: 'Backup CSV Local',
    syncError: 'Erro de Sincronizacao',
    syncingLive: 'Sincronizando dados reino 2323...',
    confirmResetAllocations: 'Reiniciar todos os grupos de batalha para Nao Atribuido?',
    confirmClearGroup: 'Remover todos jogadores deste grupo para reserva?',
    language: 'Idioma',
    adminAuth: 'Autenticacao Admin',
    enterAdminPasswordDesc: 'Digite a senha de admin para desbloquear edicao e distribuicoes.',
    adminPasswordLabel: 'Senha Admin',
    enterPasswordPlaceholder: 'Digite a senha...',
    cancel: 'Cancelar',
    authenticate: 'Entrar',
    incorrectPassword: 'Senha incorreta. Tente novamente.',
    pleaseEnterPassword: 'Por favor digite a senha de admin',
    drawerAll: 'Todos',
    quickAssign: 'Atribuicao Rapida',
    noPlayersFound: 'Nenhum jogador encontrado.',
    close: 'Fechar',
    centerCamera: 'Centralizar Camera',
    counterTeam: 'Equipe Contra',
    counterTeamShort: 'CT',
    toggleCounterTeam: 'Alternar Equipe Contra',
    addToCounterTeam: 'Adicionar Equipe Contra',
    removeFromCounterTeam: 'Remover Equipe Contra',
    counterTeamFilter: 'Equipe Contra',
    allCounterTeam: 'Todos',
    ctOnly: 'Somente CT',
    nonCT: 'Nao-CT',
    markAsCounterTeam: 'Marcar Equipe Contra',
    removeFromCTBulk: 'Remover Status CT',
  },
};
