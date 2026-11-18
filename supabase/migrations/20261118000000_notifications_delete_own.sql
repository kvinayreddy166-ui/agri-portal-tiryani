-- AGRONIX — allow users to clear their own notifications
--
-- The notifications table only had SELECT and UPDATE policies, so the
-- "Clear all" action in the notification bell could not delete rows.
-- This adds a DELETE policy scoped to the owner, matching the existing
-- read/update policies.

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
