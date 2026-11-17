-- Lock district/mandal/division on officer_profiles for non-admin self-updates.
-- Officers may still update other profile fields; jurisdiction is admin-managed.
-- Admin JWT (is_portal_admin) and service-role/edge-function writes (auth.uid() IS NULL) are unaffected.

CREATE OR REPLACE FUNCTION public.protect_officer_jurisdiction_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.id = auth.uid()
     AND NOT public.is_portal_admin() THEN
    NEW.district := OLD.district;
    NEW.mandal := OLD.mandal;
    NEW.division := OLD.division;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_officer_jurisdiction ON public.officer_profiles;
CREATE TRIGGER protect_officer_jurisdiction
  BEFORE UPDATE ON public.officer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_officer_jurisdiction_fields();
