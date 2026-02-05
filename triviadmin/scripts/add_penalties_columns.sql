
-- Run this in Supabase SQL Editor
ALTER TABLE chango_config 
ADD COLUMN penalties_music_url TEXT,
ADD COLUMN penalties_difficulty INTEGER DEFAULT 5,
ADD COLUMN penalties_max_shots INTEGER DEFAULT 5;
