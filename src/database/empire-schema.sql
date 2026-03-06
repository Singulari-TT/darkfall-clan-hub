-- Empire: Resource & Holding Tracking Schema

-- Create Holdings table (Cities/Hamlets)
CREATE TABLE IF NOT EXISTS public."Holdings" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('City', 'Hamlet')),
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Holdings_pkey" PRIMARY KEY (id),
    CONSTRAINT "Holdings_name_key" UNIQUE (name)
);

-- Create Resource_Nodes table
CREATE TABLE IF NOT EXISTS public."Resource_Nodes" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    holding_id uuid NOT NULL,
    node_type text NOT NULL CHECK (node_type IN ('Timber Grove', 'Quarry', 'Mine', 'Herb Patch')),
    last_harvested_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Resource_Nodes_pkey" PRIMARY KEY (id),
    CONSTRAINT "Resource_Nodes_holding_id_fkey" FOREIGN KEY (holding_id) REFERENCES public."Holdings"(id) ON DELETE CASCADE
);

-- Create Harvest_Logs table (Derived from News Reel)
CREATE TABLE IF NOT EXISTS public."Harvest_Logs" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    node_id uuid NOT NULL,
    character_name text NOT NULL, -- Name from News Reel text
    hit_milestone integer NOT NULL, -- 1st, 10th, 20th etc.
    timestamp timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Harvest_Logs_pkey" PRIMARY KEY (id),
    CONSTRAINT "Harvest_Logs_node_id_fkey" FOREIGN KEY (node_id) REFERENCES public."Resource_Nodes"(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public."Holdings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Resource_Nodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Harvest_Logs" ENABLE ROW LEVEL SECURITY;

-- Basic Read Policies
CREATE POLICY "Allow public read of holdings" ON public."Holdings" FOR SELECT USING (true);
CREATE POLICY "Allow public read of nodes" ON public."Resource_Nodes" FOR SELECT USING (true);
CREATE POLICY "Allow public read of logs" ON public."Harvest_Logs" FOR SELECT USING (true);
