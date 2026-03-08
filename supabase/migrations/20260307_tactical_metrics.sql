-- Add tactical metric columns to Characters table
ALTER TABLE public."Characters" 
ADD COLUMN IF NOT EXISTS last_gank_given TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_gank_received TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_online TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_harvest TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance if needed (though usually we fetch by user_id/char_id)
CREATE INDEX IF NOT EXISTS idx_characters_last_online ON public."Characters"(last_online);
