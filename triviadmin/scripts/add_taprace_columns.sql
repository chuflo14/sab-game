
-- Run this in Supabase SQL Editor
ALTER TABLE chango_config 
ADD COLUMN taprace_music_url TEXT,
ADD COLUMN taprace_duration INTEGER DEFAULT 30,
ADD COLUMN taprace_difficulty INTEGER DEFAULT 100;
