-- Migration: 004_templates
-- Description: Templates system for pages, databases, and database rows
-- Phase 3 of the Notion features implementation

-- Templates table (stores reusable templates)
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('page', 'database', 'database_row')),
  content jsonb NOT NULL DEFAULT '{}',
  icon text,
  cover_url text,
  is_public boolean DEFAULT false,
  is_default boolean DEFAULT false,
  category text,
  tags text[] DEFAULT '{}',
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Template buttons (inline blocks that create from templates)
CREATE TABLE IF NOT EXISTS public.template_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  block_id text NOT NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  label text DEFAULT 'New from template',
  style jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, block_id)
);

-- Template categories for organization
CREATE TABLE IF NOT EXISTS public.template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS public.template_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT now()
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_workspace ON public.templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_template_buttons_page ON public.template_buttons(page_id);
CREATE INDEX IF NOT EXISTS idx_template_buttons_template ON public.template_buttons(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON public.template_usage(template_id);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view templates in their workspace"
  ON public.templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can create templates in their workspace"
  ON public.templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates they created"
  ON public.templates FOR UPDATE
  USING (
    created_by = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete templates they created"
  ON public.templates FOR DELETE
  USING (
    created_by = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for template_buttons
CREATE POLICY "Users can view template buttons on accessible pages"
  ON public.template_buttons FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage template buttons on pages they can edit"
  ON public.template_buttons FOR ALL
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for template_categories
CREATE POLICY "Users can view categories in their workspace"
  ON public.template_categories FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage categories"
  ON public.template_categories FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for template_usage
CREATE POLICY "Users can view and create usage records"
  ON public.template_usage FOR ALL
  USING (true);

-- Function to increment template use count
CREATE OR REPLACE FUNCTION increment_template_use_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.templates
  SET use_count = use_count + 1,
      updated_at = now()
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment use count
CREATE TRIGGER trigger_increment_template_use_count
  AFTER INSERT ON public.template_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_use_count();

-- Insert some default templates for new workspaces
-- (These would be system templates available to all)
