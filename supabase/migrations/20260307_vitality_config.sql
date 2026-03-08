-- Expand SystemConfig with scraper vitality trackers
INSERT INTO public."SystemConfig" (key, value, updated_at)
VALUES 
('last_roster_sync', 'Success', now()),
('last_gank_intel_sync', 'Success', now()),
('last_harvest_scraper_sync', 'Success', now())
ON CONFLICT (key) DO UPDATE SET updated_at = now();
