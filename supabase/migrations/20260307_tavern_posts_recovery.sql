-- Tavern Posts Table Recovery Migration
-- Ensures the table exists with the correct lowercase name and permissions.

-- 1. Rename existing PascalCase table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Tavern_Posts') THEN
        ALTER TABLE "Tavern_Posts" RENAME TO "tavern_posts";
    END IF;
END $$;

-- 2. Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public."tavern_posts" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    author_discord_id text,
    author_name text,
    message text,
    color text DEFAULT 'indigo',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT "tavern_posts_pkey" PRIMARY KEY (id)
);

-- 3. Robust column verification (in case it was renamed from an old schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='author_discord_id') THEN
        ALTER TABLE "tavern_posts" ADD COLUMN "author_discord_id" TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='author_name') THEN
        ALTER TABLE "tavern_posts" ADD COLUMN "author_name" TEXT NOT NULL DEFAULT 'Anonymous';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='message') THEN
        ALTER TABLE "tavern_posts" ADD COLUMN "message" TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='color') THEN
        ALTER TABLE "tavern_posts" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'indigo';
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public."tavern_posts" ENABLE ROW LEVEL SECURITY;

-- 5. Set up Policies
DROP POLICY IF EXISTS "Anyone can view tavern posts" ON public."tavern_posts";
CREATE POLICY "Anyone can view tavern posts" ON public."tavern_posts" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tavern posts" ON public."tavern_posts";
CREATE POLICY "Authenticated users can insert tavern posts" ON public."tavern_posts" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own posts or admins any" ON public."tavern_posts";
CREATE POLICY "Users can delete their own posts or admins any" ON public."tavern_posts" FOR DELETE USING (
    (auth.jwt() ->> 'sub'::text) = author_discord_id OR 
    EXISTS (
        SELECT 1 FROM "Users" 
        WHERE discord_id = (auth.jwt() ->> 'sub'::text) 
        AND role = 'Admin'
    )
);

-- 6. Commentary
COMMENT ON TABLE public."tavern_posts" IS 'Tavern bulletin board for clan members.';
