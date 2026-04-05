-- Training Platform Migration
-- Transforms workspace app into corporate training platform

-- ============================================
-- SOP Categories (hierarchical)
-- ============================================
CREATE TABLE sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES sop_categories(id) ON DELETE SET NULL,
  icon TEXT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOPs (Standard Operating Procedures)
-- ============================================
CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  category_id UUID REFERENCES sop_categories(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Quizzes
-- ============================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pass_threshold INTEGER DEFAULT 70 CHECK (pass_threshold >= 0 AND pass_threshold <= 100),
  is_graded BOOLEAN DEFAULT true,
  time_limit_minutes INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Quiz Questions
-- ============================================
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'fill_blank')),
  question TEXT NOT NULL,
  options JSONB, -- For multiple choice: [{id, text, isCorrect}]
  correct_answer TEXT, -- For fill_blank and true_false
  points INTEGER DEFAULT 1 CHECK (points > 0),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- User Roles (extend profiles)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'learner'
      CHECK (role IN ('admin', 'trainer', 'learner'));
  END IF;
END $$;

-- ============================================
-- Assignments
-- ============================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sop_id, user_id)
);

-- ============================================
-- Completions
-- ============================================
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  answers JSONB -- Store submitted answers for review
);

-- ============================================
-- Certificates
-- ============================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT
);

-- ============================================
-- SOP Documents (uploaded files)
-- ============================================
CREATE TABLE sop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  extracted_text TEXT, -- For search indexing
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies (permissive for testing)
-- ============================================
CREATE POLICY "Allow all sop_categories for testing" ON sop_categories
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all sops for testing" ON sops
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all quizzes for testing" ON quizzes
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all quiz_questions for testing" ON quiz_questions
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all assignments for testing" ON assignments
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all completions for testing" ON completions
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all certificates for testing" ON certificates
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all sop_documents for testing" ON sop_documents
  FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_sop_categories_workspace ON sop_categories(workspace_id);
CREATE INDEX idx_sop_categories_parent ON sop_categories(parent_id);
CREATE INDEX idx_sops_category ON sops(category_id);
CREATE INDEX idx_sops_workspace ON sops(workspace_id);
CREATE INDEX idx_sops_status ON sops(status);
CREATE INDEX idx_sops_created_by ON sops(created_by);
CREATE INDEX idx_quizzes_sop ON quizzes(sop_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_sop ON assignments(sop_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_completions_user ON completions(user_id);
CREATE INDEX idx_completions_sop ON completions(sop_id);
CREATE INDEX idx_completions_date ON completions(completed_at);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_sop ON certificates(sop_id);
CREATE INDEX idx_sop_documents_sop ON sop_documents(sop_id);

-- ============================================
-- Full-text search on SOPs
-- ============================================
CREATE INDEX idx_sops_title_search ON sops USING gin(to_tsvector('english', title));
CREATE INDEX idx_sops_content_search ON sops USING gin(to_tsvector('english', content::text));

-- ============================================
-- Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sop_categories_updated_at BEFORE UPDATE ON sop_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Certificate number generator
-- ============================================
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.certificate_number = 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                             UPPER(SUBSTRING(NEW.id::text, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_cert_number BEFORE INSERT ON certificates
  FOR EACH ROW EXECUTE FUNCTION generate_certificate_number();
