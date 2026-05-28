-- Add views column
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Update status values for existing rows
UPDATE ideas SET status = 'Idea' WHERE status IN ('Active', 'Draft');

-- Atomic view increment function (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_views(idea_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ideas SET views = views + 1 WHERE id = idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon;
