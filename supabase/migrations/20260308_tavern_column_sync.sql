-- Standardize tavern_posts column naming
-- Renames 'message' to 'content' if it exists, ensuring compatibility with the database constraint error report.

DO $$
BEGIN
    -- Rename column message to content IF message exists and content does not
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='message') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='content') THEN
        ALTER TABLE "tavern_posts" RENAME COLUMN "message" TO "content";
    END IF;

    -- Ensure content is NOT NULL with a default
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tavern_posts' AND column_name='content') THEN
        ALTER TABLE "tavern_posts" ALTER COLUMN "content" SET NOT NULL;
        ALTER TABLE "tavern_posts" ALTER COLUMN "content" SET DEFAULT '';
    ELSE
        -- Create it if for some reason neither existed
        ALTER TABLE "tavern_posts" ADD COLUMN "content" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;
