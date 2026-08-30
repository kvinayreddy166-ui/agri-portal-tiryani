-- Insert DAO contacts into officer_contacts table
-- Data provided: 32 districts with DAO mobile numbers

INSERT INTO officer_contacts (officer_type, district, phone, active, created_at, updated_at) VALUES
('DAO', 'ADILABAD', '8977742697', true, now(), now()),
('DAO', 'BHADRADRI KOTHAGUDEM', '8977743066', true, now(), now()),
('DAO', 'HANMAKONDA', '8977756346', true, now(), now()),
('DAO', 'JAGTIAL', '8977745435', true, now(), now()),
('DAO', 'JANGOAN', '8977745480', true, now(), now()),
('DAO', 'JAYASHANKAR BHUPALPALLY', '8977745518', true, now(), now()),
('DAO', 'JOGULAMBA GADWAL', '8977745995', true, now(), now()),
('DAO', 'KAMAREDDY', '8977746046', true, now(), now()),
('DAO', 'KARIMNAGAR', '8977746334', true, now(), now()),
('DAO', 'KHAMMAM', '8977747500', true, now(), now()),
('DAO', 'KUMURAM BHEEM ASIFABAD', '8977748730', true, now(), now()),
('DAO', 'MAHABUBABAD', '8977749210', true, now(), now()),
('DAO', 'MAHABUBNAGAR', '8977749229', true, now(), now()),
('DAO', 'MANCHERIAL', '8977750735', true, now(), now()),
('DAO', 'MEDAK', '8977750785', true, now(), now()),
('DAO', 'MEDCHAL-MALKAJIGIRI', '8977751031', true, now(), now()),
('DAO', 'MULUG', '8977751139', true, now(), now()),
('DAO', 'NAGARKURNOOL', '8977751163', true, now(), now()),
('DAO', 'NALGONDA', '8977751294', true, now(), now()),
('DAO', 'NARAYANPET', '8977751549', true, now(), now()),
('DAO', 'NIRMAL', '8977751748', true, now(), now()),
('DAO', 'NIZAMABAD', '8977751940', true, now(), now()),
('DAO', 'PEDDAPALLI', '8977752780', true, now(), now()),
('DAO', 'RAJANNA SIRCILLA', '8977755264', true, now(), now()),
('DAO', 'RANGAREDDY', '8977753329', true, now(), now()),
('DAO', 'SANGAREDDY', '8977754689', true, now(), now()),
('DAO', 'SIDDIPET', '8977754775', true, now(), now()),
('DAO', 'SURYAPET', '8977755833', true, now(), now()),
('DAO', 'VIKARABAD', '8977755890', true, now(), now()),
('DAO', 'WANAPARTHY', '8977756108', true, now(), now()),
('DAO', 'WARANGAL', '8977756214', true, now(), now()),
('DAO', 'YADADRI BHUVANAGIRI', '8977756419', true, now(), now())
ON CONFLICT (officer_type, district) DO UPDATE SET
  phone = EXCLUDED.phone,
  updated_at = now();
