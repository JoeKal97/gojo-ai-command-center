-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);

-- Insert default General project
INSERT INTO projects (name, type) VALUES ('General', 'default') ON CONFLICT DO NOTHING;

-- Insert default templates
INSERT INTO templates (name, content, category) VALUES
('Facebook Ad', 'Write a compelling Facebook ad for [BUSINESS NAME]. Target audience: [TARGET AUDIENCE]. Key benefits: [BENEFITS]. Include a strong call-to-action and emphasize urgency.', 'Marketing'),
('SEO Article', 'Write a comprehensive SEO-optimized article about [TOPIC]. Target keyword: [KEYWORD]. Include: engaging introduction, H2 and H3 subheadings, actionable tips, and a compelling conclusion. Aim for 800-1200 words.', 'Content'),
('Cold Email', 'Write a personalized cold email to [PROSPECT NAME] at [COMPANY]. Subject: [SUBJECT LINE]. Goal: [GOAL - e.g., book a meeting, introduce service]. Keep it concise, friendly, and include a clear call-to-action.', 'Sales'),
('Local Business Audit', 'Perform a comprehensive local business audit for [BUSINESS NAME] in [CITY]. Analyze: Google Business Profile optimization, local SEO factors, online reputation, website mobile-friendliness, and provide actionable recommendations.', 'Audit')
ON CONFLICT DO NOTHING;
