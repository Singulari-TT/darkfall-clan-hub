-- Phase 10: Intel Loot Submissions Schema

-- 1. Create the Intel_Loot table
CREATE TABLE IF NOT EXISTS public."Intel_Loot" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public."Users"(id) ON DELETE CASCADE,
    monster_name TEXT NOT NULL,
    gold_dropped INTEGER DEFAULT 0,
    items_dropped JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Fire Rune", "Iron Ingot"]
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS Policies
ALTER TABLE public."Intel_Loot" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own loot submissions
CREATE POLICY "Users can insert their own loot intel"
    ON public."Intel_Loot" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow everyone (or at least authenticated users) to view all loot intel
CREATE POLICY "Anyone can view loot intel"
    ON public."Intel_Loot" FOR SELECT
    USING (true);

-- Allow users to delete their own mistakes
CREATE POLICY "Users can delete their own loot intel"
    ON public."Intel_Loot" FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Create indexes for performance on common queries
-- We index monster_name primarily since we will be fetching all loot for a specific monster often
CREATE INDEX IF NOT EXISTS idx_intel_loot_monster_name ON public."Intel_Loot"(monster_name);
CREATE INDEX IF NOT EXISTS idx_intel_loot_user_id ON public."Intel_Loot"(user_id);
CREATE INDEX IF NOT EXISTS idx_intel_loot_created_at ON public."Intel_Loot"(created_at DESC);
