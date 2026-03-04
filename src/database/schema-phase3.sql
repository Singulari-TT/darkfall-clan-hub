-- Phase 3: Clan Goals Table
-- This table tracks abstract, strategic objectives for the clan

DROP TABLE IF EXISTS public."Clan_Goals";

CREATE TABLE public."Clan_Goals" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed'
    priority text NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    -- Reverting this back to UUID since `Users` doesn't store Discord names directly
    created_by uuid NOT NULL, 
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Clan_Goals_pkey" PRIMARY KEY (id),
    CONSTRAINT "Clan_Goals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public."Clan_Goals" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Active members can view clan goals" ON public."Clan_Goals" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clan goals" ON public."Clan_Goals" FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update clan goals" ON public."Clan_Goals" FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete clan goals" ON public."Clan_Goals" FOR DELETE USING (true);
