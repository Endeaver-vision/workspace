-- Migration: 003_databases
-- Description: Core database tables for Notion-like databases with multiple views
-- Phase 2 of the Notion features implementation

-- Databases table (inline or full-page databases)
CREATE TABLE IF NOT EXISTS public.databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  title text DEFAULT 'Untitled Database',
  description text,
  is_inline boolean DEFAULT false,
  icon text,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Database properties (columns)
CREATE TABLE IF NOT EXISTS public.database_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid REFERENCES public.databases(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'title', 'text', 'number', 'select', 'multi_select',
    'date', 'person', 'files', 'checkbox', 'url',
    'email', 'phone', 'formula', 'relation', 'rollup',
    'created_time', 'created_by', 'last_edited_time', 'last_edited_by'
  )),
  config jsonb DEFAULT '{}',
  position integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  width integer DEFAULT 200,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Database rows (entries)
CREATE TABLE IF NOT EXISTS public.database_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid REFERENCES public.databases(id) ON DELETE CASCADE NOT NULL,
  properties jsonb DEFAULT '{}',
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_edited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Database views (table, board, calendar, gallery, timeline, list)
CREATE TABLE IF NOT EXISTS public.database_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid REFERENCES public.databases(id) ON DELETE CASCADE NOT NULL,
  name text DEFAULT 'Default View',
  type text NOT NULL CHECK (type IN ('table', 'board', 'calendar', 'gallery', 'timeline', 'list')),
  filters jsonb DEFAULT '[]',
  sorts jsonb DEFAULT '[]',
  group_by uuid REFERENCES public.database_properties(id) ON DELETE SET NULL,
  group_config jsonb DEFAULT '{}',
  visible_properties uuid[] DEFAULT '{}',
  property_widths jsonb DEFAULT '{}',
  position integer DEFAULT 0,
  is_default boolean DEFAULT false,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Database relations (linking databases)
CREATE TABLE IF NOT EXISTS public.database_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_property_id uuid REFERENCES public.database_properties(id) ON DELETE CASCADE NOT NULL,
  target_database_id uuid REFERENCES public.databases(id) ON DELETE CASCADE NOT NULL,
  relation_type text DEFAULT 'one_to_many' CHECK (relation_type IN ('one_to_one', 'one_to_many', 'many_to_many')),
  reverse_property_id uuid REFERENCES public.database_properties(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Select options for select/multi_select properties
CREATE TABLE IF NOT EXISTS public.select_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.database_properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'gray',
  position integer DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_databases_workspace ON public.databases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_databases_page ON public.databases(page_id);
CREATE INDEX IF NOT EXISTS idx_database_properties_database ON public.database_properties(database_id);
CREATE INDEX IF NOT EXISTS idx_database_properties_position ON public.database_properties(database_id, position);
CREATE INDEX IF NOT EXISTS idx_database_rows_database ON public.database_rows(database_id);
CREATE INDEX IF NOT EXISTS idx_database_rows_position ON public.database_rows(database_id, position);
CREATE INDEX IF NOT EXISTS idx_database_views_database ON public.database_views(database_id);
CREATE INDEX IF NOT EXISTS idx_select_options_property ON public.select_options(property_id);

-- Enable RLS
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.select_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for databases (workspace members can access)
CREATE POLICY "Users can view databases in their workspaces" ON public.databases
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create databases in their workspaces" ON public.databases
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update databases in their workspaces" ON public.databases
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete databases in their workspaces" ON public.databases
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for database_properties
CREATE POLICY "Users can manage database properties" ON public.database_properties
  FOR ALL USING (
    database_id IN (
      SELECT id FROM public.databases WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for database_rows
CREATE POLICY "Users can manage database rows" ON public.database_rows
  FOR ALL USING (
    database_id IN (
      SELECT id FROM public.databases WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for database_views
CREATE POLICY "Users can manage database views" ON public.database_views
  FOR ALL USING (
    database_id IN (
      SELECT id FROM public.databases WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for database_relations
CREATE POLICY "Users can manage database relations" ON public.database_relations
  FOR ALL USING (
    source_property_id IN (
      SELECT id FROM public.database_properties WHERE database_id IN (
        SELECT id FROM public.databases WHERE workspace_id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for select_options
CREATE POLICY "Users can manage select options" ON public.select_options
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.database_properties WHERE database_id IN (
        SELECT id FROM public.databases WHERE workspace_id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER databases_updated_at
  BEFORE UPDATE ON public.databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER database_properties_updated_at
  BEFORE UPDATE ON public.database_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER database_rows_updated_at
  BEFORE UPDATE ON public.database_rows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER database_views_updated_at
  BEFORE UPDATE ON public.database_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
