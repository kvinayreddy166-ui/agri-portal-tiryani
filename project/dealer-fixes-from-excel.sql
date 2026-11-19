-- ===== SAFE: small date corrections (<=40 days), license unchanged =====
-- 1231483 Keshava ARSK Talandi | was issue=2021-05-19 exp=2024-05-18 lic=KMB/36/ADA/FR/2021/29228 -> file issue=2021-05-20 exp=2024-05-19 lic=-
UPDATE public.dealers SET issue_date = '2021-05-20', expiry_date = '2024-05-19', updated_at = now() WHERE id = '410ac554-87ed-4706-8cfc-bb2ae4000ef4';

-- 1244210 PACS Tiryani | was issue=2021-07-15 exp=2026-07-14 lic=KMB/36/ADA/FR/2021/30027 -> file issue=2021-07-16 exp=2026-07-15 lic=-
UPDATE public.dealers SET issue_date = '2021-07-16', expiry_date = '2026-07-15', updated_at = now() WHERE id = 'cbc7649f-21cd-426a-8562-7ae0496837de';

-- 1414164 Sri Vegneshwara Traders | was issue=2023-04-17 exp=2028-04-15 lic=3162001 -> file issue=2023-04-18 exp=2028-04-16 lic=-
UPDATE public.dealers SET issue_date = '2023-04-18', expiry_date = '2028-04-16', updated_at = now() WHERE id = 'ec33ce54-4d50-4011-a3fe-032e11f758d2';

-- 1490843 Sri Sai Fertilizers | was issue=2023-09-04 exp=2028-09-02 lic=3162032 -> file issue=2023-09-05 exp=2028-09-03 lic=-
UPDATE public.dealers SET issue_date = '2023-09-05', expiry_date = '2028-09-03', updated_at = now() WHERE id = '5c61e6fe-1912-48e7-b895-ee13d3f0396b';

-- 1517486 Sridhar Traders | was issue=2024-07-16 exp=2029-07-15 lic=3162058 -> file issue=2024-07-17 exp=2029-07-16 lic=-
UPDATE public.dealers SET issue_date = '2024-07-17', expiry_date = '2029-07-16', updated_at = now() WHERE id = '11a589f2-3604-46b6-a3ad-2d8eafe7eb77';

-- ===== REVIEW NEEDED: license change or large date conflict (file may be stale) =====
-- 1078889 Vasavi Fertilizers | was issue=2017-08-17 exp=2028-08-14 lic=3163086 -> file issue=2023-08-16 exp=2028-08-15 lic=-
-- UPDATE public.dealers SET issue_date = '2023-08-16', expiry_date = '2028-08-15', updated_at = now() WHERE id = 'ea9119ca-22aa-4ed2-b57b-c938a4124a23';

-- 1083785 Srinivasa Fertilizers | was issue=2018-06-21 exp=2026-06-19 lic=KMB/36/ADA/FR/2018/21985 -> file issue=2018-06-22 exp=2021-06-22 lic=ADA/FR/2018/21985
-- UPDATE public.dealers SET issue_date = '2018-06-22', expiry_date = '2021-06-22', license_number = 'ADA/FR/2018/21985', updated_at = now() WHERE id = 'f8fc226a-0cd8-4c60-a5db-081fc346297c';

-- 1133556 Thirumala Fertilizers | was issue=2019-07-16 exp=2027-07-14 lic=KMB/36/ADA/FR/2019/23911 -> file issue=2022-07-16 exp=2027-07-15 lic=-
-- UPDATE public.dealers SET issue_date = '2022-07-16', expiry_date = '2027-07-15', updated_at = now() WHERE id = 'f75566e3-dc6e-4ad6-a2ea-ed78840f4e00';

-- 1165703 TRN Farmers Producer Comp | was issue=2023-09-04 exp=2028-09-02 lic=3162033 -> file issue=2020-02-11 exp=2025-02-11 lic=ADA/FR/2020/25048
-- UPDATE public.dealers SET issue_date = '2020-02-11', expiry_date = '2025-02-11', license_number = 'ADA/FR/2020/25048', updated_at = now() WHERE id = '9e43e1fd-d517-4120-8a45-753025bdb273';

-- 1168064 Praneeth Fertilizers | was issue=2022-05-08 exp=2027-05-07 lic=KMB/36/ADA/FR/2022/31764 -> file issue=2022-05-09 exp=2027-05-09 lic=3162054
-- UPDATE public.dealers SET issue_date = '2022-05-09', expiry_date = '2027-05-09', license_number = '3162054', updated_at = now() WHERE id = '3c6d75d7-a7d1-4d39-b851-dbf54dffde56';

-- 1322429 Akhil Krushi Kendram | was issue=2021-08-24 exp=2031-08-23 lic=KMRD/28/ADA/FR/2021/30467 -> file issue=- exp=2026-08-23 lic=-
-- UPDATE public.dealers SET expiry_date = '2026-08-23', updated_at = now() WHERE id = 'ad112ab6-14ae-469f-9a35-ac58961b4ec8';

-- 1596289 MGC Tiryani | was issue=2024-07-16 exp=2030-07-17 lic=3162096 -> file issue=2025-07-19 exp=2030-07-18 lic=-
-- UPDATE public.dealers SET issue_date = '2025-07-19', expiry_date = '2030-07-18', updated_at = now() WHERE id = 'aa20abe7-8465-4b2f-993d-efa716a36924';

-- 1654486 Hanuman Traders | was issue=2023-09-19 exp=2030-07-01 lic=3162094 -> file issue=2025-07-03 exp=2030-07-03 lic=-
-- UPDATE public.dealers SET issue_date = '2025-07-03', expiry_date = '2030-07-03', updated_at = now() WHERE id = '433705bd-df89-4e84-9a19-b775b74e5ae2';

-- 264256 Sri Rajarajeshwara FERT.KONDUR | was issue=2022-06-08 exp=2027-06-06 lic=NZB/23/ADA/FR/2016/17617 -> file issue=- exp=2027-06-08 lic=NZB/23ADAFR2013/3853
-- UPDATE public.dealers SET expiry_date = '2027-06-08', license_number = 'NZB/23ADAFR2013/3853', updated_at = now() WHERE id = '05f5d999-3162-415c-9b5f-52a45d264136';

-- 282449 MGC Pitlam | was issue=2021-06-12 exp=2031-03-04 lic=NZB/28/ADA/FR/2015/14845 -> file issue=- exp=2026-03-04 lic=-
-- UPDATE public.dealers SET expiry_date = '2026-03-04', updated_at = now() WHERE id = '2e2cb6aa-cdf6-4364-9633-ffd4af7913f8';

-- 329960 Laxmi Narasimha Swamy Fertilizers | was issue=2022-03-30 exp=2027-03-30 lic=NZB/23/ADA/FR/2013/3772 -> file issue=- exp=- lic=178/R
-- UPDATE public.dealers SET license_number = '178/R', updated_at = now() WHERE id = 'e07a7cab-31f7-477a-a86a-a59965991b0f';

-- 386411 Sri Ramakrishna Fertilizers | was issue=2024-02-22 exp=2029-03-07 lic=53113007 -> file issue=- exp=2029-02-22 lic=5/R-12
-- UPDATE public.dealers SET expiry_date = '2029-02-22', license_number = '5/R-12', updated_at = now() WHERE id = '72e89d4e-e28e-4101-b743-bf4d7746613e';

-- 776822 DCMS FSC Areguda | was issue=2015-07-09 exp=2026-07-07 lic=ADB/36/ADA/FR/2015/16058 -> file issue=2024-08-08 exp=2029-08-07 lic=3162066
-- UPDATE public.dealers SET issue_date = '2024-08-08', expiry_date = '2029-08-07', license_number = '3162066', updated_at = now() WHERE id = 'b2cc7951-cb51-45a4-b863-cb8568971e33';

-- 984293 Ganesh Fertilizers | was issue=2017-08-17 exp=2028-08-14 lic=3163087 -> file issue=- exp=- lic=KMB/36/FR/2017/20043
-- UPDATE public.dealers SET license_number = 'KMB/36/FR/2017/20043', updated_at = now() WHERE id = 'd4d068b2-1c3b-419f-a375-f99f5c8ed754';

-- 984299 Santhosh Kumar Fertilizers | was issue=2023-04-23 exp=2028-04-21 lic=3162003 -> file issue=2021-03-31 exp=2026-03-31 lic=ADB/36/FR/2015/16467
-- UPDATE public.dealers SET issue_date = '2021-03-31', expiry_date = '2026-03-31', license_number = 'ADB/36/FR/2015/16467', updated_at = now() WHERE id = '125d5d89-d1db-485e-9fd1-b599d938a48e';
