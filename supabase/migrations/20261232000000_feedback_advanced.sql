-- =====================================================================
-- AGRONIX Feedback — advanced features
--   1. duplicate_of linking on feedback
--   2. authenticated read of feature_request tickets (roadmap + upvotes)
--   3. notifications table + triggers (status change, admin response,
--      new submission -> admin)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Duplicate linking
-- ---------------------------------------------------------------------
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.feedback(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_duplicate_of ON public.feedback(duplicate_of);

-- ---------------------------------------------------------------------
-- 2. Let any authenticated user read feature requests (public roadmap
--    and upvote list). Other categories remain owner/admin only.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read feature requests" ON public.feedback;
CREATE POLICY "Authenticated can read feature requests"
  ON public.feedback FOR SELECT
  USING (auth.role() = 'authenticated' AND category = 'feature_request');

-- ---------------------------------------------------------------------
-- 3. Notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users may only flip read_at on their own rows; a trigger below blocks
-- edits to every other column.
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notifications_guard_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at may be modified on notifications';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_guard_update_trigger ON public.notifications;
CREATE TRIGGER notifications_guard_update_trigger
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_guard_update();

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Status / resolution changes on a ticket -> notify the submitter.
CREATE OR REPLACE FUNCTION public.feedback_notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_label TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT DISTINCT FROM NEW.user_id THEN RETURN NEW; END IF;

  v_label := CASE NEW.status
    WHEN 'submitted' THEN 'Submitted'
    WHEN 'under_review' THEN 'Under Review'
    WHEN 'in_progress' THEN 'In Progress'
    WHEN 'planned' THEN 'Planned'
    WHEN 'resolved' THEN 'Resolved'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'closed' THEN 'Closed'
    WHEN 'implemented' THEN 'Added to AGRONIX'
    ELSE NEW.status
  END;

  PERFORM public.notify_user(
    NEW.user_id,
    'feedback_status',
    'Feedback ' || COALESCE(NEW.ticket_number, '') || ' updated',
    'Status changed to ' || v_label || CASE WHEN NEW.assigned_label IS NOT NULL THEN ' · Assigned to ' || NEW.assigned_label ELSE '' END,
    '/feedback'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_notify_status_change_trigger ON public.feedback;
CREATE TRIGGER feedback_notify_status_change_trigger
  AFTER UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_notify_status_change();

-- Admin response -> notify the submitter.
CREATE OR REPLACE FUNCTION public.feedback_notify_response()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket public.feedback%ROWTYPE;
BEGIN
  IF NOT NEW.is_official THEN RETURN NEW; END IF;
  SELECT * INTO v_ticket FROM public.feedback WHERE id = NEW.feedback_id;
  IF v_ticket.id IS NULL THEN RETURN NEW; END IF;
  IF NEW.responder_id IS NOT DISTINCT FROM v_ticket.user_id THEN RETURN NEW; END IF;

  PERFORM public.notify_user(
    v_ticket.user_id,
    'feedback_response',
    'New response on ' || COALESCE(v_ticket.ticket_number, 'your feedback'),
    left(NEW.message, 140),
    '/feedback'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_notify_response_trigger ON public.feedback_responses;
CREATE TRIGGER feedback_notify_response_trigger
  AFTER INSERT ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.feedback_notify_response();

-- ---------------------------------------------------------------------
-- 4. Restrict upvotes to feature-request tickets only
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can vote on feedback" ON public.feedback_votes;
CREATE POLICY "Users can vote on feedback"
  ON public.feedback_votes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_votes.feedback_id
        AND f.category = 'feature_request'
    )
  );

-- New submission -> notify the portal admin.
CREATE OR REPLACE FUNCTION public.feedback_notify_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'k.vinayreddy166@gmail.com' LIMIT 1;
  PERFORM public.notify_user(
    v_admin_id,
    'feedback_new',
    'New feedback ' || COALESCE(NEW.ticket_number, ''),
    COALESCE(NEW.submitter_name, 'A user') || ' · ' || NEW.subject,
    '/admin/feedback'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_notify_admin_trigger ON public.feedback;
CREATE TRIGGER feedback_notify_admin_trigger
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_notify_admin();
