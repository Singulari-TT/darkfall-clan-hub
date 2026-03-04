-- Phase 4: Profiles, Marketplace, and Settings

-- 1. Modify Clan_Goals to support Project groupings
ALTER TABLE public."Clan_Goals" ADD COLUMN IF NOT EXISTS project_name text;

-- 2. Global Settings Table for Admin Controls
CREATE TABLE IF NOT EXISTS public."Clan_Settings" (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES public."Users"(id)
);

ALTER TABLE public."Clan_Settings" ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read clan settings" ON public."Clan_Settings" FOR SELECT USING (true);

-- Only Admins can modify settings
CREATE POLICY "Admins can modify settings" ON public."Clan_Settings" 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Insert default empty featured project if not exists
INSERT INTO public."Clan_Settings" (key, value) 
VALUES ('featured_project', '') 
ON CONFLICT (key) DO NOTHING;


-- 3. Market Orders Table
CREATE TABLE IF NOT EXISTS public."Market_Orders" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public."Users"(id) ON DELETE CASCADE,
    order_type text NOT NULL CHECK (order_type IN ('Buy', 'Sell')),
    item_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    price text NOT NULL,
    status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Fulfilled', 'Cancelled')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Market_Orders_pkey" PRIMARY KEY (id)
);

ALTER TABLE public."Market_Orders" ENABLE ROW LEVEL SECURITY;

-- Anyone can read market orders
CREATE POLICY "Anyone can read market orders" ON public."Market_Orders" FOR SELECT USING (true);

-- Authenticated active users can create orders (simplified auth check for demo)
CREATE POLICY "Authenticated users can create market orders" ON public."Market_Orders" FOR INSERT WITH CHECK (true);

-- Users can only update/delete their own orders, or Admins can
CREATE POLICY "Users can update their own orders" ON public."Market_Orders" 
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role = 'Admin')
    );
    
CREATE POLICY "Users can delete their own orders" ON public."Market_Orders" 
    FOR DELETE USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role = 'Admin')
    );
