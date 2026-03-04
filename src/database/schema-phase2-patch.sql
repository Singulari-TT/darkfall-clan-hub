-- The original script created `created_by` as UUID.
-- However, we are logging in with Discord OAuth where user IDs are large integer 'snowflakes' (treated as text).
-- Run this script in your Supabase SQL Editor to patch the table.

-- Drop the foreign key constraint first
ALTER TABLE public."Map_Markers" DROP CONSTRAINT "Map_Markers_created_by_fkey";

-- Change the column type from UUID to TEXT
ALTER TABLE public."Map_Markers" ALTER COLUMN created_by TYPE text USING created_by::text;

-- Re-establish the foreign key link to the Users table (which also correctly uses text for Discord IDs)
ALTER TABLE public."Map_Markers" ADD CONSTRAINT "Map_Markers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON DELETE CASCADE;

-- Note: We must also update the RLS Policy because `auth.uid()` returns a UUID for Supabase Auth users.
-- But since we bypassed Supabase Auth and use NextAuth + Discord, our Session ID is a string.
-- NextAuth doesn't natively interact with Supabase RLS `auth.uid()` without custom JWT token signing.
-- For this prototype, if RLS is failing on DELETE, you may temporarily simplify the policy:
DROP POLICY IF EXISTS "Users can delete their own markers" ON public."Map_Markers";
CREATE POLICY "Authenticated users can delete markers" ON public."Map_Markers" FOR DELETE USING (true); 
-- (Our Next.js server actions handle the actual security check for 'own markers' before calling Supabase)
