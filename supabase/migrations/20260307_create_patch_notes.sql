-- Create Patch Notes table
CREATE TABLE IF NOT EXISTS public.patch_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Feature', 'Bugfix', 'Security', 'Maintenance')),
    content TEXT NOT NULL, -- Markdown supported
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patch_notes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (it's a public patch notes page!)
CREATE POLICY "Allow public read access to patch notes"
ON public.patch_notes FOR SELECT
TO public
USING (true);

-- Allow Admins to manage patch notes (if we use the auth system, otherwise user can edit in DB)
-- For now, we'll assume the user adds them via the Supabase dashboard until we build a CMS.

-- Insert a test entry
INSERT INTO public.patch_notes (title, version, category, content)
VALUES (
    'The Dreadkrew Hub Alpha - Theme Standardization',
    '1.0.0',
    'Feature',
    '### Initial Release of the Unified Theme Pack\n\n- Standardized all colors to **Social Cobalt** and **Charcoal**.\n- Implemented glassmorphism aesthetics across all modules.\n- Added AI-powered Loot Scanning v2.'
);
