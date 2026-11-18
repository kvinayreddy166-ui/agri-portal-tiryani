-- =====================================================================
-- AGRONIX — allow portal admins to send in-app notifications to users
-- =====================================================================

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_portal_admin());
