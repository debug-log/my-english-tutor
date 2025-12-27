-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Optional: Link to auth.users if you use Supabase Auth
  date DATE NOT NULL,
  original_text TEXT NOT NULL,
  correction TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create analysis_history table
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow full access for now, or restrict to user if Auth is enabled)
-- For simple personal use without Auth enforcement yet:
CREATE POLICY "Enable all access for anon" ON entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON analysis_history FOR ALL USING (true) WITH CHECK (true);

-- If you want to use Auth later, you would switch to:
-- CREATE POLICY "Enable access for users based on user_id" ON entries
-- FOR ALL USING (auth.uid() = user_id);
