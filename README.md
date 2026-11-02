# KvK Roster

A clean, high-density, mobile-responsive React web application for managing Kingshot alliance players across the 4 main alliances: **ERA**, **FFF**, **TEA**, and **VIK**, fully integrated with **Supabase database persistence**.

## Live Configuration
- **Supabase Project URL**: `https://lediaqcbbdiesfvnmawo.supabase.co`
- **Supabase Publishable Key**: `sb_publishable_4Gg-31CLsKPP7VVYBRijuQ_iO_zbeif`
- **Database Table**: `players`
- **Initial Sync**: All 391 verified players from `ERA_members.csv`, `FFF_members.csv`, `TEA_members.csv`, and `VIK_members.csv` are synced in Supabase.

## Database Schema (`players` table)
- `id` (Text, Primary Key): Player ID from CSV
- `name` (Text): Player Name
- `alliance` (Text): 'ERA', 'FFF', 'TEA', or 'VIK' (auto-tagged based on CSV file)
- `rank` (Text): R1 to R5 (or Leader)
- `current_power` (Bigint / Number): Player power
- `tg_level` (Text): Formatted as TG1, TG2, TG3, or standard TC1 to TC30
- `battle_group` (Text, nullable): 'Castle', 'Turret 1', 'Turret 2', 'Turret 3', 'Inactive' (or null when unassigned)

## Features

### 1. Supabase Persistence & Real-time Sync
- **Automatic Load**: Fetches and loads all player records from Supabase on initial application boot.
- **Instant Updates**: Moving a player to Castle, Turret 1, Turret 2, Turret 3, or Inactive immediately updates local React state and issues an `UPDATE` query to Supabase.
- **Real-Time Subscription**: Subscribed to Supabase Postgres changes via WebSocket channel (`public:players`) so multi-user updates reflect live without page refresh.
- **Batch CSV Upsert**: Uploading new or updated CSVs executes an `upsert` on `id` in Supabase, updating power and TC levels while preserving existing battle group allocations.

### 2. Header & View Navigation
- Brand header strictly displays **KVK ROSTER** in bold Montserrat font.
- Navigation tabs for **All Players** (Global Roster) and **Castle Battle** (Tactical View).
- **Import CSVs** button to batch upload alliance files with automatic alliance tagging.
- Real-time Supabase connection indicator in the footer.

### 3. All Players View (Global Roster)
- **High-Density Table on Desktop**: Sortable columns, checkboxes, and inline battle group assignment.
- **Mobile Card View**: Compact cards with quick reassignment.
- **Search & Filters**:
  - Global real-time search by Name or ID
  - Filter by Alliance (`ERA`, `FFF`, `TEA`, `VIK`)
  - Filter by Rank (`Leader / R5`, `R4`, `R3`, `R2`, `R1`)
  - Filter by TC level (`TG3`, `TG2`, `TG1`, `TC Standard`)
  - Filter by Battle Group
- **Bulk Action Toolbar**: Select multiple players to batch-assign them to Castle, Turret 1, Turret 2, Turret 3, Inactive, or Unassign with real-time Supabase sync.

### 4. Castle Battle View (5 Active Buckets)
- Displays strictly the 5 active battle groups:
  1. **Castle**
  2. **Turret 1**
  3. **Turret 2**
  4. **Turret 3**
  5. **Inactive**
- **No Unassigned Column**: Unassigned players are kept in the reserve pool without cluttering the board.
- **Assign Reserves**: Quick modal in the toolbar to search unallocated players and assign them into any battle group with 1 click.
- **Summary Cards**: Displays player count, combined power, and alliance ratio indicator.

## Running Locally

```bash
npm run dev
```

Build for production:
```bash
npm run build
```
