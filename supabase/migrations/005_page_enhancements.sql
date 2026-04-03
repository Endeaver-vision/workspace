-- Migration: 005_page_enhancements
-- Description: Page access tracking, favorites, recent pages
-- Phase 4 of the Notion features implementation

-- Add position column to pages for ordering
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Page access tracking (favorites, recent pages)
CREATE TABLE IF NOT EXISTS public.page_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  is_favorited boolean DEFAULT false,
  last_accessed_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Page shortcuts/quick access
CREATE TABLE IF NOT EXISTS public.page_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Page breadcrumb cache (for faster navigation)
CREATE TABLE IF NOT EXISTS public.page_paths (
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE PRIMARY KEY,
  path_ids uuid[] NOT NULL DEFAULT '{}',
  path_titles text[] NOT NULL DEFAULT '{}',
  depth integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_page_access_user ON public.page_access(user_id);
CREATE INDEX IF NOT EXISTS idx_page_access_page ON public.page_access(page_id);
CREATE INDEX IF NOT EXISTS idx_page_access_favorited ON public.page_access(user_id, is_favorited) WHERE is_favorited = true;
CREATE INDEX IF NOT EXISTS idx_page_access_recent ON public.page_access(user_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_shortcuts_user ON public.page_shortcuts(user_id, position);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON public.pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_position ON public.pages(workspace_id, position);

-- Enable RLS
ALTER TABLE public.page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_access
CREATE POLICY "Users can manage their own page access"
  ON public.page_access FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for page_shortcuts
CREATE POLICY "Users can manage their own shortcuts"
  ON public.page_shortcuts FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for page_paths
CREATE POLICY "Users can view page paths in their workspace"
  ON public.page_paths FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update page access
CREATE OR REPLACE FUNCTION update_page_access(p_user_id uuid, p_page_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.page_access (user_id, page_id, last_accessed_at, access_count)
  VALUES (p_user_id, p_page_id, now(), 1)
  ON CONFLICT (user_id, page_id)
  DO UPDATE SET
    last_accessed_at = now(),
    access_count = page_access.access_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rebuild page path cache
CREATE OR REPLACE FUNCTION rebuild_page_path(p_page_id uuid)
RETURNS void AS $$
DECLARE
  v_path_ids uuid[] := ARRAY[]::uuid[];
  v_path_titles text[] := ARRAY[]::text[];
  v_current_id uuid;
  v_current_title text;
  v_parent_id uuid;
  v_depth integer := 0;
BEGIN
  -- Start with the page itself
  SELECT id, title, parent_id INTO v_current_id, v_current_title, v_parent_id
  FROM public.pages WHERE id = p_page_id;

  IF v_current_id IS NULL THEN
    RETURN;
  END IF;

  -- Walk up the tree
  WHILE v_parent_id IS NOT NULL LOOP
    SELECT id, title, parent_id INTO v_current_id, v_current_title, v_parent_id
    FROM public.pages WHERE id = v_parent_id;

    IF v_current_id IS NOT NULL THEN
      v_path_ids := v_current_id || v_path_ids;
      v_path_titles := v_current_title || v_path_titles;
      v_depth := v_depth + 1;
    END IF;

    -- Safety: prevent infinite loop
    IF v_depth > 50 THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insert or update the path
  INSERT INTO public.page_paths (page_id, path_ids, path_titles, depth, updated_at)
  VALUES (p_page_id, v_path_ids, v_path_titles, v_depth, now())
  ON CONFLICT (page_id)
  DO UPDATE SET
    path_ids = EXCLUDED.path_ids,
    path_titles = EXCLUDED.path_titles,
    depth = EXCLUDED.depth,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to rebuild paths when page changes
CREATE OR REPLACE FUNCTION trigger_rebuild_page_path()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM rebuild_page_path(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER page_path_update
  AFTER INSERT OR UPDATE OF parent_id, title ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_page_path();
