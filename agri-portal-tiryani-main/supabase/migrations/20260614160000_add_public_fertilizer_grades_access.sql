-- Add public access policy for fertilizer grades
-- This allows unauthenticated users to view fertilizer grades in the public calculator

DROP POLICY IF EXISTS "Public can view fertilizer_grades" ON fertilizer_grades;

CREATE POLICY "Public can view fertilizer_grades"
  ON fertilizer_grades FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public can view crop_fertilizer_recommendations" ON crop_fertilizer_recommendations;

CREATE POLICY "Public can view crop_fertilizer_recommendations"
  ON crop_fertilizer_recommendations FOR SELECT
  TO anon
  USING (true);
