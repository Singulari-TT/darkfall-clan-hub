-- Phase 17: Identity Codex & Character Main Flag
ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Index for performance in lookups
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public."Characters"(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_is_main ON public."Characters"(is_main);
