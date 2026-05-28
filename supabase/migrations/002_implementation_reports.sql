CREATE TABLE IF NOT EXISTS implementation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('working', 'not_working', 'stuck')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, person_name)
);
ALTER TABLE implementation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON implementation_reports FOR ALL USING (true) WITH CHECK (true);
