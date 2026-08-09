/*
  Import IFMS fertilizer dealers and restrict Office Files records to admin users.
*/

INSERT INTO dealers (
  dealer_name,
  ifms_id,
  phone_number,
  license_number,
  issue_date,
  expiry_date,
  location,
  dealer_category
)
SELECT seed.dealer_name, seed.ifms_id, seed.phone_number, seed.license_number, seed.issue_date::date, seed.expiry_date::date, seed.location, seed.dealer_category
FROM (VALUES
  ('DCMS FARMER SERVICES CENTRE', '776822', '9949497506', 'ADB/36/ADA/FR/2015/16058', '2015-07-09', '2026-07-07', 'CHINTEPALLY', 'fertilizer'),
  ('KESHAVA ARSK', '1231483', '9866634734', 'KMB/36/ADA/FR/2021/29228', '2021-05-19', '2024-05-18', 'TALANDI', 'fertilizer'),
  ('PRANEETH FERTILIZERS', '1168064', '9949601013', 'KMB/36/ADA/FR/2022/31764', '2022-05-08', '2027-05-07', 'GINNEDHARI', 'fertilizer'),
  ('PACS', '1244210', '8008177201', 'KMB/36/ADA/FR/2021/30027', '2021-07-15', '2026-07-14', 'TALANDI', 'fertilizer'),
  ('RAJARAJESHWARA FERTILIZERS', '383681', '8008798228', '3163085', '2017-08-17', '2028-08-14', 'GINNEDHARI', 'fertilizer'),
  ('SRINIVASA FERTILIZERS', '1083785', '9949920746', 'KMB/36/ADA/FR/2018/21985', '2018-06-21', '2026-06-19', 'GAMBHIRAOPET', 'fertilizer'),
  ('THIRUMALA FERTILIZER', '1133556', '7013881446', 'KMB/36/ADA/FR/2019/23911', '2019-07-16', '2027-07-14', 'TIRYANI', 'fertilizer'),
  ('VASAVI TRADING', '1078889', '9866564360', '3163086', '2017-08-17', '2028-08-14', 'TALANDI', 'fertilizer'),
  ('SRI SAI FERTILIZERS', '1490843', '8897585559', '3162032', '2023-09-04', '2028-09-02', 'GAMBHIRAOPET', 'fertilizer'),
  ('GANESH FERTILIZERS', '984293', '8897449557', '3163087', '2017-08-17', '2028-08-14', 'TALANDI', 'fertilizer'),
  ('SANTHOSH KUMAR FERTILIZERS', '984299', '9441611087', '3162003', '2023-04-23', '2028-04-21', 'KANNEPALLY', 'fertilizer'),
  ('SRI VIGNESHWARA TRADERS', '1414164', '6304434423', '3162001', '2023-04-17', '2028-04-15', 'PERKAPALLY', 'fertilizer'),
  ('TIRYANI FARMERS PRODUCERS PRIVATE LIMITED', '1165703', '9381065911', '3162033', '2023-09-04', '2028-09-02', 'TIRYANI', 'fertilizer'),
  ('AGROS RYTHU SEVA KENDRAM', '133045', '8106277602', 'KMB/36/ADA/FR/2022/32118', '2022-06-08', '2027-06-07', 'GAMBHIRAOPET', 'fertilizer'),
  ('SRIDHAR FERTILIZERS', '1517486', '7093399709', '3162058', '2024-07-16', '2029-07-15', 'SONAPUR', 'fertilizer'),
  ('SREE SITARAMA FERTILIZERS', '', '9441559814', '3162035', '2023-09-19', '2028-09-17', 'GAMBHIRAOPET', 'fertilizer'),
  ('HANUMAN TRADERS', '1654486', '8106510412', '3162094', '2023-09-19', '2030-07-01', 'MANIKYAPUR', 'fertilizer'),
  ('MANA GROMOR CENTER', '1596289', '8297055258', '3162096', '2024-07-16', '2030-07-17', 'TIRYANI', 'fertilizer')
) AS seed(dealer_name, ifms_id, phone_number, license_number, issue_date, expiry_date, location, dealer_category)
WHERE NOT EXISTS (
  SELECT 1
  FROM dealers existing
  WHERE existing.license_number = seed.license_number
    OR (seed.ifms_id <> '' AND existing.ifms_id = seed.ifms_id)
);

DROP POLICY IF EXISTS "Anyone can view excel_uploads" ON excel_uploads;
DROP POLICY IF EXISTS "Admin can view excel_uploads" ON excel_uploads;

CREATE POLICY "Admin can view excel_uploads"
  ON excel_uploads FOR SELECT
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
