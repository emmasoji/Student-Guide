-- Placeholder for Supabase / PostGIS setup
-- Enable PostGIS when ready:
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Example places table (run only after connecting a real Supabase project)
/*
CREATE TABLE campus_places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  entrance GEOGRAPHY(POINT, 4326),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX campus_places_location_idx ON campus_places USING GIST (location);

-- RLS example
ALTER TABLE campus_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read places" ON campus_places FOR SELECT USING (true);
*/
