-- =====================================================================
-- AGRONIX Feedback — allow owners to delete their own tickets
-- Children (responses, activity, votes) cascade via FK ON DELETE CASCADE.
-- =====================================================================

CREATE POLICY "Owners can delete own feedback"
  ON public.feedback FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);
