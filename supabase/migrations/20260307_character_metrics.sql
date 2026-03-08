-- 20260307_character_metrics_v2.sql
-- Enriched tactical metrics for Characters

-- 1. Adding Combat & Session columns
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_gank_given TIMESTAMP WITH TIME ZONE;
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_gank_received TIMESTAMP WITH TIME ZONE;
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_gank_opponent_given TEXT; -- Name of the victim
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_gank_opponent_received TEXT; -- Name of the killer
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_harvest TIMESTAMP WITH TIME ZONE;
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS last_session_length INTEGER; -- In minutes

-- 2. Performance Indices
CREATE INDEX IF NOT EXISTS idx_characters_name_lookup ON public."Characters" (LOWER(name));

-- 3. Documentation
COMMENT ON COLUMN public."Characters".last_gank_opponent_given IS 'Who this character last defeated in PvP.';
COMMENT ON COLUMN public."Characters".last_gank_opponent_received IS 'Who last defeated this character in PvP.';
COMMENT ON COLUMN public."Characters".last_session_length IS 'Duration of the last recorded session in minutes.';
