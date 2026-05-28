ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ai_platforms text[] DEFAULT '{}';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS implementation_notes TEXT;
