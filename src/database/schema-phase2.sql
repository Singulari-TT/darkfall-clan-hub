-- Create Map_Markers table to persist tactical markers placed by users
CREATE TABLE public."Map_Markers" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL, -- e.g., 'attack', 'defend', 'rally', 'enemy'
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Map_Markers_pkey" PRIMARY KEY (id),
    CONSTRAINT "Map_Markers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON DELETE CASCADE
);

-- Note: Ensure Supabase Realtime is enabled for this table in your Supabase Dashboard
-- Database -> Replication -> Click the 1 Table -> Enable Map_Markers

-- Enable RLS
ALTER TABLE public."Map_Markers" ENABLE ROW LEVEL SECURITY;

-- Add basic policies (Everyone can read, authenticated users can insert/delete)
CREATE POLICY "Active members can view markers" ON public."Map_Markers" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create markers" ON public."Map_Markers" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own markers" ON public."Map_Markers" FOR DELETE USING (auth.uid() = created_by);
