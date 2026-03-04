-- ==========================================
-- Phase 11: Dreadkrew Thematics & Directives
-- ==========================================

-- 1. Profiles Update
-- Add bio to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Lootpack Submissions
CREATE TABLE IF NOT EXISTS "Lootpack_Submissions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    week_identifier TEXT NOT NULL, -- e.g., '2023-W41'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Lootpacks
ALTER TABLE "Lootpack_Submissions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lootpacks"
ON "Lootpack_Submissions" FOR SELECT
USING (true);

-- Admins handle insertions via Server Actions bypass (Service Role),
-- but we can let authenticated users insert their own:
CREATE POLICY "Users can submit their own lootpacks"
ON "Lootpack_Submissions" FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM "Users" WHERE discord_id = auth.jwt()->>'sub' OR id = auth.uid()));

-- 3. Directives (Goals) Overhaul
ALTER TABLE "Clan_Goals" ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE "Clan_Goals" ADD COLUMN IF NOT EXISTS directive_type TEXT DEFAULT 'General';
ALTER TABLE "Clan_Goals" ADD COLUMN IF NOT EXISTS target_ingredients JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "Clan_Goals" ADD COLUMN IF NOT EXISTS current_ingredients JSONB DEFAULT '{}'::jsonb;

-- 4. Directive Contributions (Members submitting resources)
CREATE TABLE IF NOT EXISTS "Directive_Contributions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES "Clan_Goals"(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE NOT NULL,
    ingredient_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Verified', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES "Users"(id)
);

-- Enable RLS for Contributions
ALTER TABLE "Directive_Contributions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contributions"
ON "Directive_Contributions" FOR SELECT
USING (true);

CREATE POLICY "Users can create their own contributions"
ON "Directive_Contributions" FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM "Users" WHERE discord_id = auth.jwt()->>'sub' OR id = auth.uid()));

-- 5. Directive Views (Unique Eyeballs tracking)
CREATE TABLE IF NOT EXISTS "Directive_Views" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES "Clan_Goals"(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(goal_id, user_id)
);

-- Enable RLS for Views
ALTER TABLE "Directive_Views" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view directive views"
ON "Directive_Views" FOR SELECT
USING (true);

-- Server actions will handle view insertions to avoid RLS complexity with unique constraints during fast navigation.
