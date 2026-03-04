-- Phase 10 Patch: Fix Map_Markers UUID constraint mismatch for Discord accounts
-- Since Discord user IDs are long text strings, they cannot be stored in a UUID column.

-- 0. Drop the existing policies that depend on the column so we can alter it
DROP POLICY IF EXISTS "Users can delete their own markers" ON public."Map_Markers";
DROP POLICY IF EXISTS "Authenticated users can delete markers" ON public."Map_Markers";

-- 1. Drop the existing foreign key constraint
ALTER TABLE public."Map_Markers" DROP CONSTRAINT IF EXISTS "Map_Markers_created_by_fkey";

-- 2. Change the column type from UUID to TEXT
ALTER TABLE public."Map_Markers" ALTER COLUMN created_by TYPE text USING created_by::text;

-- 3. Re-apply the foreign key constraint pointing back to the Users table
ALTER TABLE public."Map_Markers" ADD CONSTRAINT "Map_Markers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON DELETE CASCADE;

-- 4. Recreate the policy so users can delete their own markers (casting the uuid to text to match)
CREATE POLICY "Users can delete their own markers" ON public."Map_Markers" FOR DELETE USING (auth.uid()::text = created_by);
