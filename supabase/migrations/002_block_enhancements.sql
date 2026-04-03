-- Migration: 002_block_enhancements.sql
-- Block metadata for advanced features (synced blocks, custom properties)

CREATE TABLE IF NOT EXISTS public.block_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  block_id text NOT NULL,
  block_type text NOT NULL,
  properties jsonb DEFAULT '{}',
  position integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, block_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_block_metadata_page ON public.block_metadata(page_id);
CREATE INDEX IF NOT EXISTS idx_block_metadata_type ON public.block_metadata(block_type);

-- Enable RLS
ALTER TABLE public.block_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies: workspace members can manage block metadata
CREATE POLICY "Workspace members can view block metadata"
  ON public.block_metadata FOR SELECT
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM public.pages
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can insert block metadata"
  ON public.block_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    page_id IN (
      SELECT id FROM public.pages
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can update block metadata"
  ON public.block_metadata FOR UPDATE
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM public.pages
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can delete block metadata"
  ON public.block_metadata FOR DELETE
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM public.pages
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_block_metadata_updated_at
  BEFORE UPDATE ON public.block_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
