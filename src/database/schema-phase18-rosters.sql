-- Phase 18: External Clan Rosters & Intel Update

-- 1. Create ExternalClanRosters table
CREATE TABLE IF NOT EXISTS public."ExternalClanRosters" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_name TEXT UNIQUE NOT NULL,
    member_count INTEGER NOT NULL DEFAULT 0,
    top_member TEXT, -- most frequently appearing member name
    top_member_activity INTEGER DEFAULT 0,
    total_activity INTEGER NOT NULL DEFAULT 0,
    members JSONB NOT NULL DEFAULT '[]'::jsonb, -- full member list snapshot: [{name, count, lastSeen}]
    last_scanned TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add clan_name to Intel table for filtering
ALTER TABLE public."Intel" ADD COLUMN IF NOT EXISTS clan_name TEXT;

-- 3. RLS Policies for ExternalClanRosters
ALTER TABLE public."ExternalClanRosters" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view external rosters"
    ON public."ExternalClanRosters" FOR SELECT
    USING (true);

-- Only service role (admin) should be able to upsert these, or we can allow authenticated users if we want them to refresh?
-- The plan says Admin-only refresh via API, so we'll use service role in the API.
-- For safety, we keep it restricted.

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_external_clan_rosters_clan_name ON public."ExternalClanRosters"(clan_name);
CREATE INDEX IF NOT EXISTS idx_external_clan_rosters_total_activity ON public."ExternalClanRosters"(total_activity DESC);
CREATE INDEX IF NOT EXISTS idx_intel_clan_name ON public."Intel"(clan_name);
