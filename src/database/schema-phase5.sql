-- Phase 5: User Display Names
-- Adds a display_name column to Users so they can set a readable name in their profile

ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS display_name text;
