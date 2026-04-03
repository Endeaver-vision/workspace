-- Migration: 006_collaboration
-- Description: Real-time collaboration features (comments, presence, activity, mentions)
-- Phase 5 of the Notion features implementation

-- Enhance comments table with threaded replies and mentions
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS mentioned_users uuid[] DEFAULT '{}';
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id);

-- Presence tracking for real-time collaboration
CREATE TABLE IF NOT EXISTS public.presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  cursor_position jsonb,
  selection jsonb,
  last_seen_at timestamptz DEFAULT now(),
  color text DEFAULT '#3b82f6',
  UNIQUE(user_id, page_id)
);

-- Activity feed for workspace
CREATE TABLE IF NOT EXISTS public.activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Mentions and notifications
CREATE TABLE IF NOT EXISTS public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentioned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  block_id text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_page_block ON public.comments(page_id, block_id);
CREATE INDEX IF NOT EXISTS idx_presence_page ON public.presence(page_id);
CREATE INDEX IF NOT EXISTS idx_presence_user ON public.presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON public.activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_page ON public.activity(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON public.mentions(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_page ON public.mentions(page_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presence
CREATE POLICY "Users can see presence on pages they can access"
  ON public.presence FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own presence"
  ON public.presence FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for activity
CREATE POLICY "Users can view activity in their workspace"
  ON public.activity FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity in their workspace"
  ON public.activity FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for mentions
CREATE POLICY "Users can view their own mentions"
  ON public.mentions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create mentions"
  ON public.mentions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own mentions"
  ON public.mentions FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_workspace_id uuid,
  p_user_id uuid,
  p_action text,
  p_page_id uuid DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO public.activity (workspace_id, user_id, action, page_id, target_type, target_id, metadata)
  VALUES (p_workspace_id, p_user_id, p_action, p_page_id, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification from mention
CREATE OR REPLACE FUNCTION notify_on_mention()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    NEW.user_id,
    'mention',
    'You were mentioned',
    'Someone mentioned you in a comment',
    jsonb_build_object(
      'page_id', NEW.page_id,
      'comment_id', NEW.comment_id,
      'mentioned_by', NEW.mentioned_by
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_mention
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_mention();

-- Function to cleanup old presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM public.presence
  WHERE last_seen_at < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;
