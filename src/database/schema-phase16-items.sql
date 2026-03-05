-- Create Game_Items table to store known items and their icon paths
CREATE TABLE public."Game_Items" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    icon_url text NOT NULL,
    is_verified boolean NOT NULL DEFAULT true,
    added_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Game_Items_pkey" PRIMARY KEY (id),
    CONSTRAINT "Game_Items_name_key" UNIQUE (name),
    CONSTRAINT "Game_Items_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public."Users"(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public."Game_Items" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read items
CREATE POLICY "Anyone can view game items" ON public."Game_Items" FOR SELECT USING (true);

-- Allow authenticated users to add new items
CREATE POLICY "Authenticated users can insert game items" ON public."Game_Items" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
