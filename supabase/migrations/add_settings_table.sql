-- Settings table for blog configuration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  categories JSONB DEFAULT '["기타"]'::jsonb,
  site_name VARCHAR(255) DEFAULT '블로그',
  site_description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (id, categories, site_name, site_description)
VALUES (
  1,
  '["AI_Tools", "휴대폰", "노트북", "로봇청소기", "모니터", "세탁기", "에어콘", "PC", "테블렛", "이어폰"]'::jsonb,
  '테크매니아',
  '최신 테크 트렌드와 리뷰'
)
ON CONFLICT (id) DO NOTHING;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Public can read settings"
  ON settings
  FOR SELECT
  USING (true);

-- Policy: Service role can update settings
CREATE POLICY "Service role can update settings"
  ON settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
