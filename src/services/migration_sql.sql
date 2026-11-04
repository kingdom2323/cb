-- Migration: Add /migrate page columns to the players table
-- Run this in the Supabase SQL Editor for project: lediaqcbbdiesfvnmawo
-- These columns are ISOLATED from the main /cb roster logic.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'TEA'
    CHECK (migration_status IN ('TEA', 'VIK', 'ONX')),
  ADD COLUMN IF NOT EXISTS cb_status TEXT DEFAULT 'full'
    CHECK (cb_status IN ('full', 'partial', 'none')),
  ADD COLUMN IF NOT EXISTS infantry_tier TEXT DEFAULT NULL
    CHECK (infantry_tier IN ('t10', 'tg1', 'tg2', 'tg3') OR infantry_tier IS NULL),
  ADD COLUMN IF NOT EXISTS cavalry_tier TEXT DEFAULT NULL
    CHECK (cavalry_tier IN ('t10', 'tg1', 'tg2', 'tg3') OR cavalry_tier IS NULL),
  ADD COLUMN IF NOT EXISTS archer_tier TEXT DEFAULT NULL
    CHECK (archer_tier IN ('t10', 'tg1', 'tg2', 'tg3') OR archer_tier IS NULL);
