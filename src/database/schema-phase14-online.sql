-- Add online tracking to Characters table
ALTER TABLE public."Characters" ADD COLUMN is_online boolean NOT NULL DEFAULT false;
ALTER TABLE public."Characters" ADD COLUMN last_online timestamp with time zone;
