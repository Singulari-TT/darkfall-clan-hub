-- Create Users table
CREATE TABLE public."Users" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    discord_id text NOT NULL,
    role text NOT NULL DEFAULT 'Member'::text,
    status text NOT NULL DEFAULT 'Pending'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Users_pkey" PRIMARY KEY (id),
    CONSTRAINT "Users_discord_id_key" UNIQUE (discord_id)
);

-- Create Characters table
CREATE TABLE public."Characters" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    is_visible boolean NOT NULL DEFAULT true,
    admin_only boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Characters_pkey" PRIMARY KEY (id),
    CONSTRAINT "Characters_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE
);

-- Create Bank_Inventory table
CREATE TABLE public."Bank_Inventory" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    item_name text NOT NULL,
    icon_path text,
    current_quantity integer NOT NULL DEFAULT 0,
    target_quantity integer,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Bank_Inventory_pkey" PRIMARY KEY (id)
);

-- Create Intel table
CREATE TABLE public."Intel" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Intel_pkey" PRIMARY KEY (id),
    CONSTRAINT "Intel_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE
);

-- Row Level Security (RLS) setup

-- Enable RLS
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Characters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Bank_Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Intel" ENABLE ROW LEVEL SECURITY;

-- Add basic policies (Needs more refinement based on specific app logic)
-- Example: Allow users to read their own data, and admins to read all
CREATE POLICY "Users can view their own record" ON public."Users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Members can view everyone's visible characters" ON public."Characters" FOR SELECT USING (is_visible = true AND admin_only = false);
-- Note: Further complex logic (e.g., distinguishing Admins to view admin_only characters) typically requires 
-- creating a secure Postgres function (security definer) to query the user's role safely from the Users table,
-- or handling the filtering server-side in API routes via service role key.
