-- Empire Schema Fix
-- Adds missing columns and constraints to Resource_Nodes for live scraper compatibility.

-- 1. Ensure extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Resource_Nodes Table
-- Adding total_hits and unique constraint for upsert efficiency
DO $$
BEGIN
    -- Add total_hits if it's missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Resource_Nodes' AND column_name='total_hits') THEN
        ALTER TABLE public."Resource_Nodes" ADD COLUMN "total_hits" INTEGER DEFAULT 0;
    END IF;

    -- Standardize node_type check constraint (ensure all scraper node types are included)
    ALTER TABLE public."Resource_Nodes" DROP CONSTRAINT IF EXISTS "Resource_Nodes_node_type_check";
    ALTER TABLE public."Resource_Nodes" ADD CONSTRAINT "Resource_Nodes_node_type_check" 
        CHECK (node_type IN ('Timber Grove', 'Quarry', 'Mine', 'Herb Patch'));

    -- Add UNIQUE constraint for (holding_id, node_type) to support UPSERT (Request 103/104 in scraper)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Resource_Nodes_holding_node_unique') THEN
        ALTER TABLE public."Resource_Nodes" ADD CONSTRAINT "Resource_Nodes_holding_node_unique" UNIQUE (holding_id, node_type);
    END IF;
END $$;

-- 3. Verify Holdings constraints
ALTER TABLE public."Holdings" DROP CONSTRAINT IF EXISTS "Holdings_type_check";
ALTER TABLE public."Holdings" ADD CONSTRAINT "Holdings_type_check" 
    CHECK (type IN ('City', 'Hamlet', 'Outpost')); -- Added Outpost just in case

-- 4. Enable RLS and Policies (Final Audit)
ALTER TABLE public."Holdings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Resource_Nodes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of holdings" ON public."Holdings";
CREATE POLICY "Allow public read of holdings" ON public."Holdings" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read of nodes" ON public."Resource_Nodes";
CREATE POLICY "Allow public read of nodes" ON public."Resource_Nodes" FOR SELECT USING (true);

-- 5. Add Commentary
COMMENT ON COLUMN public."Resource_Nodes".total_hits IS 'Aggregated hits detected from News Reel milestones.';
