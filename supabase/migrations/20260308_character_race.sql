-- 20260308_character_race.sql
-- Add race to Characters

ALTER TABLE public."Characters" ADD COLUMN IF NOT EXISTS race TEXT;

-- Add check constraint for valid races
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_race') THEN
        ALTER TABLE public."Characters" 
        ADD CONSTRAINT check_valid_race 
        CHECK (race IN ('Alfar', 'Mahirim', 'Mirdain', 'Ork', 'Dwarf', 'Human') OR race IS NULL);
    END IF;
END $$;

-- Documentation
COMMENT ON COLUMN public."Characters".race IS 'The character''s race (Alfar, Mahirim, Mirdain, Ork, Dwarf, Human).';
