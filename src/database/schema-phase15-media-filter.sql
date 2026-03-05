-- Create Hidden_Media table to store Youtube video IDs that have been flagged for removal
CREATE TABLE public."Hidden_Media" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    youtube_id text NOT NULL,
    hidden_by uuid NOT NULL, -- User who hid the video
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Hidden_Media_pkey" PRIMARY KEY (id),
    CONSTRAINT "Hidden_Media_youtube_id_key" UNIQUE (youtube_id),
    CONSTRAINT "Hidden_Media_hidden_by_fkey" FOREIGN KEY (hidden_by) REFERENCES public."Users"(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public."Hidden_Media" ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to view the hidden media list
CREATE POLICY "Authenticated users can view hidden media" ON public."Hidden_Media" FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert a new hidden media record
CREATE POLICY "Authenticated users can hide media" ON public."Hidden_Media" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
