-- Migration: 007_synced_blocks_api
-- Description: Synced blocks, embeds, API keys, and webhooks
-- Phase 6 of the Notion features implementation

-- Synced blocks (transclusion)
CREATE TABLE IF NOT EXISTS public.synced_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '[]',
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- References to synced blocks on pages
CREATE TABLE IF NOT EXISTS public.synced_block_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_block_id uuid REFERENCES public.synced_blocks(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  block_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, block_id)
);

-- API keys for programmatic access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL, -- First 8 chars for identification
  scopes text[] DEFAULT ARRAY['read'],
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Webhooks for event notifications
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  secret text, -- For signature verification
  events text[] NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  delivered_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Embeds from external services
CREATE TABLE IF NOT EXISTS public.embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  block_id text NOT NULL,
  service text NOT NULL,
  original_url text NOT NULL,
  embed_url text,
  embed_data jsonb DEFAULT '{}',
  thumbnail_url text,
  title text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, block_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synced_blocks_workspace ON public.synced_blocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_synced_block_refs_synced ON public.synced_block_references(synced_block_id);
CREATE INDEX IF NOT EXISTS idx_synced_block_refs_page ON public.synced_block_references(page_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON public.api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_webhooks_workspace ON public.webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_embeds_page ON public.embeds(page_id);

-- Enable RLS
ALTER TABLE public.synced_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_block_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for synced_blocks
CREATE POLICY "Users can view synced blocks in their workspace"
  ON public.synced_blocks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create synced blocks in their workspace"
  ON public.synced_blocks FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update synced blocks in their workspace"
  ON public.synced_blocks FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete synced blocks they created"
  ON public.synced_blocks FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for synced_block_references
CREATE POLICY "Users can view synced block references on their pages"
  ON public.synced_block_references FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage synced block references"
  ON public.synced_block_references FOR ALL
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for api_keys
CREATE POLICY "Users can view their workspace API keys"
  ON public.api_keys FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON public.api_keys FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for webhooks
CREATE POLICY "Admins can view webhooks"
  ON public.webhooks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for webhook_deliveries
CREATE POLICY "Admins can view webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM public.webhooks WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- RLS Policies for embeds
CREATE POLICY "Users can view embeds on their pages"
  ON public.embeds FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage embeds on their pages"
  ON public.embeds FOR ALL
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash text)
RETURNS TABLE (
  workspace_id uuid,
  user_id uuid,
  scopes text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT ak.workspace_id, ak.user_id, ak.scopes
  FROM public.api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());

  -- Update last_used_at
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dispatch webhook
CREATE OR REPLACE FUNCTION dispatch_webhook(
  p_workspace_id uuid,
  p_event text,
  p_payload jsonb
)
RETURNS void AS $$
DECLARE
  v_webhook record;
BEGIN
  FOR v_webhook IN
    SELECT * FROM public.webhooks
    WHERE workspace_id = p_workspace_id
      AND is_active = true
      AND p_event = ANY(events)
  LOOP
    -- Log the delivery attempt (actual HTTP call handled by edge function)
    INSERT INTO public.webhook_deliveries (webhook_id, event, payload)
    VALUES (v_webhook.id, p_event, p_payload);

    -- Update last triggered
    UPDATE public.webhooks
    SET last_triggered_at = now()
    WHERE id = v_webhook.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync synced_block content across references
CREATE OR REPLACE FUNCTION sync_block_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify connected clients about the update
  PERFORM pg_notify(
    'synced_block_update',
    json_build_object(
      'synced_block_id', NEW.id,
      'workspace_id', NEW.workspace_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_block_content
  AFTER UPDATE ON public.synced_blocks
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION sync_block_content();

-- Trigger to dispatch webhooks on page changes
CREATE OR REPLACE FUNCTION dispatch_page_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  v_event text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'page.created';
    PERFORM dispatch_webhook(NEW.workspace_id, v_event, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_event := 'page.updated';
    PERFORM dispatch_webhook(NEW.workspace_id, v_event, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'page.deleted';
    PERFORM dispatch_webhook(OLD.workspace_id, v_event, to_jsonb(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_page_webhooks
  AFTER INSERT OR UPDATE OR DELETE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_page_webhooks();
