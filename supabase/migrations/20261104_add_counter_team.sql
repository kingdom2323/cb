-- Migration: Add is_counter_team boolean column to players table for Dual Categorization
-- Primary group remains battle_group (Castle, Turret 1, Turret 2, Turret 3, Inactive, Unassigned)
-- Secondary role is is_counter_team (true/false)

ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_counter_team BOOLEAN DEFAULT FALSE;

-- Optional index for high-performance queries
CREATE INDEX IF NOT EXISTS idx_players_is_counter_team 
ON public.players(is_counter_team);

-- Optional comment explaining dual categorization
COMMENT ON COLUMN public.players.is_counter_team IS 'Dual categorization: flag indicating membership in the tactical Counter Team';
