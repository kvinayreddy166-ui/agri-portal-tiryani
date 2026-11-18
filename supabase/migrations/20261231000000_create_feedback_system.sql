-- =====================================================================
-- AGRONIX Feedback & Suggestions System
-- =====================================================================
-- Tables: feedback, feedback_responses, feedback_activity, feedback_votes
-- Storage: private bucket `feedback-attachments`
-- Admin rule mirrors public.is_knowledge_admin() (k.vinayreddy166@gmail.com)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Ticket number sequence (AGF-1001, AGF-1002, ...)
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.feedback_ticket_seq START 1001;

-- ---------------------------------------------------------------------
-- feedback — main ticket table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitter_name TEXT,
  submitter_designation TEXT,
  submitter_district TEXT,
  submitter_mandal TEXT,
  submitter_phone TEXT,
  submitter_email TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  module TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'submitted',
  attachment_path TEXT,
  app_version TEXT,
  device_info JSONB DEFAULT '{}'::JSONB,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_label TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_ticket_number ON public.feedback(ticket_number);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_module ON public.feedback(module);

-- Auto-assign AGF-XXXX ticket numbers on insert
CREATE OR REPLACE FUNCTION public.feedback_assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR btrim(NEW.ticket_number) = '' THEN
    NEW.ticket_number := 'AGF-' || lpad(nextval('public.feedback_ticket_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_assign_ticket_number_trigger ON public.feedback;
CREATE TRIGGER feedback_assign_ticket_number_trigger
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_assign_ticket_number();

-- updated_at maintenance (handle_updated_at is defined by earlier migrations;
-- redefine defensively so this migration is self-contained)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at_feedback ON public.feedback;
CREATE TRIGGER handle_updated_at_feedback
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------
-- feedback_responses — admin replies / communication history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responder_name TEXT,
  message TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback ON public.feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_created ON public.feedback_responses(created_at);

-- ---------------------------------------------------------------------
-- feedback_activity — audit trail of status/assignment/response events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_activity_feedback ON public.feedback_activity(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_activity_created ON public.feedback_activity(created_at);

-- ---------------------------------------------------------------------
-- feedback_votes — upvotes on feature requests / suggestions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON public.feedback_votes(feedback_id);

-- ---------------------------------------------------------------------
-- Activity logging triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.feedback_log_ticket_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_actor_name TEXT;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.feedback_activity (feedback_id, actor_id, actor_name, action, details)
    VALUES (NEW.id, COALESCE(v_actor, NEW.user_id), NEW.submitter_name, 'submitted', 'Feedback submitted');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.feedback_activity (feedback_id, actor_id, actor_name, action, details)
    VALUES (
      NEW.id,
      v_actor,
      COALESCE((SELECT email FROM auth.users WHERE id = v_actor), 'Administrator'),
      'status_changed',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status
    );
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
     OR NEW.assigned_label IS DISTINCT FROM OLD.assigned_label THEN
    INSERT INTO public.feedback_activity (feedback_id, actor_id, actor_name, action, details)
    VALUES (
      NEW.id,
      v_actor,
      COALESCE((SELECT email FROM auth.users WHERE id = v_actor), 'Administrator'),
      'assigned',
      CASE
        WHEN NEW.assigned_label IS NULL OR NEW.assigned_label = '' THEN 'Assignment removed'
        ELSE 'Assigned to ' || NEW.assigned_label
      END
    );
  END IF;

  IF NEW.resolved_at IS DISTINCT FROM OLD.resolved_at AND NEW.resolved_at IS NOT NULL THEN
    INSERT INTO public.feedback_activity (feedback_id, actor_id, actor_name, action, details)
    VALUES (NEW.id, v_actor, 'System', 'resolved', 'Ticket marked as resolved');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_log_ticket_activity_trigger ON public.feedback;
CREATE TRIGGER feedback_log_ticket_activity_trigger
  AFTER INSERT OR UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_log_ticket_activity();

CREATE OR REPLACE FUNCTION public.feedback_log_response_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.feedback_activity (feedback_id, actor_id, actor_name, action, details)
  VALUES (NEW.feedback_id, NEW.responder_id, NEW.responder_name, 'response_added', 'Administrator responded');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_log_response_activity_trigger ON public.feedback_responses;
CREATE TRIGGER feedback_log_response_activity_trigger
  AFTER INSERT ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.feedback_log_response_activity();

-- Keep vote_count in sync with feedback_votes
CREATE OR REPLACE FUNCTION public.feedback_sync_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feedback SET vote_count = vote_count + 1 WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feedback SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS feedback_sync_vote_count_trigger ON public.feedback_votes;
CREATE TRIGGER feedback_sync_vote_count_trigger
  AFTER INSERT OR DELETE ON public.feedback_votes
  FOR EACH ROW EXECUTE FUNCTION public.feedback_sync_vote_count();

-- =====================================================================
-- Row Level Security
-- =====================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- Portal admin helper (same rule as is_knowledge_admin)
CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com', FALSE);
$$ LANGUAGE sql STABLE;

-- ----- feedback -----
-- Any authenticated user can submit feedback for themselves only.
CREATE POLICY "Authenticated users can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users see only their own tickets; admins see everything.
CREATE POLICY "Users can read own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id OR public.is_portal_admin());

-- Only admins can modify tickets (status, assignment, priority).
CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admins can delete feedback"
  ON public.feedback FOR DELETE
  USING (public.is_portal_admin());

-- ----- feedback_responses -----
-- Ticket owner or admin can read responses.
CREATE POLICY "Owners and admins can read responses"
  ON public.feedback_responses FOR SELECT
  USING (
    public.is_portal_admin()
    OR EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_responses.feedback_id
        AND f.user_id = auth.uid()
    )
  );

-- Only admins post official responses.
CREATE POLICY "Admins can insert responses"
  ON public.feedback_responses FOR INSERT
  WITH CHECK (public.is_portal_admin() AND responder_id = auth.uid());

-- No updates/deletes by regular users; admins may delete inappropriate replies.
CREATE POLICY "Admins can delete responses"
  ON public.feedback_responses FOR DELETE
  USING (public.is_portal_admin());

-- ----- feedback_activity -----
CREATE POLICY "Owners and admins can read activity"
  ON public.feedback_activity FOR SELECT
  USING (
    public.is_portal_admin()
    OR EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_activity.feedback_id
        AND f.user_id = auth.uid()
    )
  );

-- Activity rows are written by SECURITY DEFINER triggers; admins may also insert manually.
CREATE POLICY "Admins can insert activity"
  ON public.feedback_activity FOR INSERT
  WITH CHECK (public.is_portal_admin());

-- ----- feedback_votes -----
-- Authenticated users can vote once per ticket; anyone authenticated can read counts.
CREATE POLICY "Authenticated can read votes"
  ON public.feedback_votes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can vote on feedback"
  ON public.feedback_votes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket for feedback attachments (private)
-- Path layout: tickets/{user_id}/{timestamp}_{filename}
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-attachments', 'feedback-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Upload: authenticated users may only write inside their own folder.
CREATE POLICY "Users can upload own feedback attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'feedback-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'tickets'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Read: owner folder or admin. Client uses signed URLs.
CREATE POLICY "Owners and admins can read feedback attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'feedback-attachments'
    AND (
      public.is_portal_admin()
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "Owners and admins can update feedback attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'feedback-attachments'
    AND (
      public.is_portal_admin()
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "Owners and admins can delete feedback attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'feedback-attachments'
    AND (
      public.is_portal_admin()
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );
