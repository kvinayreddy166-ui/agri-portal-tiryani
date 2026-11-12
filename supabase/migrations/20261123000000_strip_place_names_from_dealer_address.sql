-- Strip trailing mandal/district place names from dealer addresses.
-- e.g. '1-58/a/1, Main Road, Tiryani, Kumurambheem Asifabad' -> '1-58/a/1, Main Road'
-- Only removes comma-separated suffix segments that exactly match an official
-- Telangana district/division/mandal name; street addresses are untouched.

UPDATE public.dealers
SET location = btrim(regexp_replace(location, '(,\s*(\);
\}

function lookupLocationMapping\(mapping: Record<string, string\[\]>, key: string\): string\[\] \{
  const canonical = normalizeDistrictName\(key\);
  const direct = mapping\[canonical\] \?\? mapping\[key\];
  if \(direct\) return direct;
  const squashed = squashLocationKey\(canonical \|\| key\);
  const match = Object\.keys\(mapping\)\.find\(\(k\) => squashLocationKey\(k\) === squashed\);
  return match \? mapping\[match\] : \[\];
\}

function sortLocationNames\(names: string\[\]\): string\[\] \{
  return \[\.\.\.names\]\.sort\(\(a, b\) => a\.localeCompare\(b, |\)\] = district;
  \}
  return \{ \.\.\.lookup, \.\.\.DISTRICT_NAME_ALIASES \};
\}\)\(\);

/\*\*
 \* Returns the canonical TELANGANA_DISTRICTS spelling for a district name,
 \* resolving spelling variants \(e\.g\. "Kumrambheem Asifabad", "Kumuram Bheem"\)
 \* to "Kumurambheem Asifabad"\. Unknown names are returned trimmed as-is\.
 \*/
export function normalizeDistrictName\(district: string \| null \| undefined\): string \{
  const trimmed = String\(district \?\? |\);
  return SQUASHED_DISTRICT_LOOKUP\[key\] \|\| trimmed;
\}

export const TELANGANA_DISTRICT_MANDAL_MAPPING: Record<string, string\[\]> = \{
  |;
  const key = trimmed\.toLowerCase\(\)\.replace\(/\[\^a-z0-9\]/g, |\)\.trim\(\);
  if \(!trimmed\) return |Jayashankar Bhupalpally|Kumurambheem Asifabad|Bhadradri Kothagudem|Yadadri Bhuvanagiri|Mutharam \(Manthani\)|Jilled Chowdergudem|Medchal–Malkajgiri|Mahabubnagar Rural|Medchal-Malkajgiri|Ghanpur \(Station\)|, \{ sensitivity: |Bheemadevarapalli|ChinnaChintakunta|Gundlapochampally|Jogulamba Gadwal|Rajanna Sircilla|Annapureddypalli|Karimnagar Rural|Vemulawada Rural|Nizamabad Rural|Nizamabad South|Tirumalayapalem|Kondamallepally|Nizamabad North|Thalakondapally|Serilingampally|Ramchandrapuram|Mallareddygudem|Adilabad Rural|Laxmidevipalli|Lingalaghanpur|Shankarapatnam|Bheemunipatnam|Nelakondapally|Thangallapalli|Siddipet Rural|Siddipet Urban|Jajireddygudem|Khila Warangal|Bommalaramaram|Khammam Urban|Ibrahimpatnam|Rajendranagar|Yadagirigutta|Mulakalapalle|Jagtial Rural|Ragunathpally|Shankarapally|Moranchapalle|Chigurumamidi|Thimmapur Lmd|Thirumalagiri|Illanthakunta|Yellareddipet|Kukunoorpally|Mahabubnagar|Nagarkurnool|Bhadrachalam|Penchicalpet|Eturunagaram|Thungaturthy|Wardhannapet|Bazarhatnoor|Chandrugonda|Mulkalapalli|Venkatapuram|Chunchupalli|Sujathanagar|Mogullapally|Tirumalagiri|Ramannagudem|Peddamandadi|Ellandakunta|Ganneruvaram|PeddaVangara|Shankarpally|Chinthapally|Nirmal Rural|Gambhiraopet|Shankarpalle|Mogudampally|Nereducherla|Weepangandla|Chennaraopet|Parvathagiri|Hanumakonda|Mahabubabad|Ranga Reddy|,
  \],
  |Aswaraopeta|Bhupalpally|Choppadandi|Devarakadra|Bellampally|Kalwakurthy|Devarakonda|Miryalaguda|Maheshwaram|Narayankhed|Gudihatnoor|Neradigonda|Inderavelly|Kannaigudem|Mallampalli|Tekulapalli|Tekulapalle|Hasanparthy|Devaruppula|Pochannapet|Bachannapet|Dharmasagar|Amarchintha|Qutballapur|Gundlapally|Narketpally|Vemulapally|Kammarpally|Sulthanabad|Veernapalli|Saroornagar|Hayathnagar|Farooqnagar|Gummadidala|Jharasangam|Chinnakodur|Ananthagiri|Garidepally|Mattampally|Mellachervu|Atmakur \(S\)|Basheerabad|Bomaraspeta|Kulkacharla|Doulathabad|Chinnambavi|Srirangapur|Adda Guduru|Atmakur \(M\)|Motakonduru|Thurkapally|Karimnagar|Mancherial|Narayanpet|Peddapalli|Sangareddy|Wanaparthy|Kothagudem|Hanamkonda|Dharmapuri|Palakurthy|Mahadevpur|Yellareddy|Manakondur|Kusumanchi|Sathupalli|Kagaznagar|Kowdipally|Ramayampet|Malkajgiri|Ramagundam|Vemulawada|Patancheru|Huzurnagar|Talamadugu|Laxmipuram|Yerrupalem|Burgumpadu|Dummagudem|Koonavaram|Temurpuram|Gollapalli|Sarangapur|Kodakandla|Zaffergadh|Kesamudram|Venkatapur|Damargidda|Gangadhara|Vijayapura|Jammikunta|Kothapally|Chintakani|Luxettipet|Mandamarri|Papannapet|Bachupally|Turkapally|Nuthanakal|Lokeswaram|Narsapur G|Anthergaon|Chandurthi|Konaraopet|Sadasivpet|Nagalgidda|Geesugonda|Nallabelli|Rayaparthy|Hyderabad|Kamareddy|Nizamabad|Vikarabad|: \[
    |Bichkunda|Huzurabad|Jadcherla|Shadnagar|Zahirabad|Kothakota|Narsampet|Sirikonda|Aswapuram|Dammapeta|Kamepalli|Singareni|Parnasala|Allapalli|Julurpadu|Palvoncha|Shayampet|Kathlapur|Medipalli|Chillakal|Bheemaram|Kotapalle|Madanapur|Undavelly|Mudigonda|Penuballi|Balanagar|Bomraspet|Hathnoora|Kulcharam|Yeldurthy|Bowrampet|Ghatkesar|Narapally|Shamirpet|Nidmanoor|Peddavura|Dharpally|Dichpally|Pothangal|Dharmaram|Julapalli|Srirampur|Boinpalli|Keshampet|Nandigama|Munipally|Sirgapoor|Nadigudem|Palakeedu|Maddirala|Kotepally|Bantwaram|Gopalpeta|Bibinagar|Adilabad|Nalgonda|Siddipet|Suryapet|Warangal|Manuguru|Yellandu|Banswada|Asifabad|Sirpur U|Maripeda|Bheemini|Narsapur|Achampet|Kollapur|Munugode|Nakrekal|Khanapur|Balkonda|Bheemgal|Indalwai|Manthani|Sircilla|Chevella|Husnabad|Kodangal|Gadiguda|Sarapaka|Vemunuru|Yetapaka|Khazipet|Athmakur|Nadikuda|Kodimial|Mallapur|Metpalli|Lingapur|Narmetta|Yellapur|Gopalpur|Kondapur|Mutharam|Sarvaram|Itikyala|Arepalle|Ramadugu|Kerameri|Vempalle|Bayyaram|Dhanwada|Amarabad|Gopalpet|Sirsilla|Alladurg|Chegunta|Kondapak|Dundigal|Jinnaram|Kompally|Pocharam|Nampally|Nirmal U|Kotagiri|Nandipet|Vailpoor|Yergatla|Kamanpur|Ramagiri|Mustabad|Rudrangi|Kandukur|Moinabad|Yacharam|Gandipet|Ameenpur|Vatpally|Nangnoor|Munagala|Chivemla|Penpahad|Marpalle|Mominpet|Nawabpet|Peddemul|Duggondi|Nekkonda|Rajapeta|Jagtial|Jangaon|Khammam|Korutla|Jangoan|Alampur|Madhira|Chennur|Medchal|Anumula|Makthal|Bhainsa|Mudhole|Amangal|Raikode|Cherial|Bhongir|Narnoor|Rebbana|Gundala|Mallial|Regonda|Atmakur|Chityal|Vangara|Kannala|Kataram|Manopad|Pebbair|Ghanpur|Bonakal|Vemsoor|Koutala|Tiryani|Thorrur|Balmoor|Kasipet|Toopran|Taduvai|Chandur|Kuntala|Makloor|Mendora|Morthad|Navipet|Saloora|Eligaid|Balapur|Kadthal|Manchal|Kondurg|Nyalkal|Thoguta|Chilkur|Nagaram|Revally|Mothkur|Mulugu|Nirmal|Ichoda|Utnoor|Parkal|Gadwal|Armoor|Bodhan|Rudrur|Andole|Dubbak|Gajwel|Tandur|Pangal|Jainad|Mavala|Charla|Cherla|Velair|Damera|Raikal|Sangem|Maddur|Rajoli|Enkoor|Kallur|Nennel|Kuravi|Dharur|Jaipur|Kollur|Tekmal|Tadvai|Kubeer|Tanoor|Mugpal|Mupkal|Renjal|Shabad|Madgul|Kothur|Pulkal|Kalher|Kangti|Manoor|Wargal|Mothey|Medak|Boath|Tamsi|Ieeja|Kosgi|Mulug|Kodad|Pargi|Alair|Garla|Gudur|Alwal|Basar|Aloor|Odela|Kandi|Kohir|Pudur|Yelal|Wyra|Bela|Doma))+\s*$', '', 'i'))
WHERE location ~* '(,\s*(\);
\}

function lookupLocationMapping\(mapping: Record<string, string\[\]>, key: string\): string\[\] \{
  const canonical = normalizeDistrictName\(key\);
  const direct = mapping\[canonical\] \?\? mapping\[key\];
  if \(direct\) return direct;
  const squashed = squashLocationKey\(canonical \|\| key\);
  const match = Object\.keys\(mapping\)\.find\(\(k\) => squashLocationKey\(k\) === squashed\);
  return match \? mapping\[match\] : \[\];
\}

function sortLocationNames\(names: string\[\]\): string\[\] \{
  return \[\.\.\.names\]\.sort\(\(a, b\) => a\.localeCompare\(b, |\)\] = district;
  \}
  return \{ \.\.\.lookup, \.\.\.DISTRICT_NAME_ALIASES \};
\}\)\(\);

/\*\*
 \* Returns the canonical TELANGANA_DISTRICTS spelling for a district name,
 \* resolving spelling variants \(e\.g\. "Kumrambheem Asifabad", "Kumuram Bheem"\)
 \* to "Kumurambheem Asifabad"\. Unknown names are returned trimmed as-is\.
 \*/
export function normalizeDistrictName\(district: string \| null \| undefined\): string \{
  const trimmed = String\(district \?\? |\);
  return SQUASHED_DISTRICT_LOOKUP\[key\] \|\| trimmed;
\}

export const TELANGANA_DISTRICT_MANDAL_MAPPING: Record<string, string\[\]> = \{
  |;
  const key = trimmed\.toLowerCase\(\)\.replace\(/\[\^a-z0-9\]/g, |\)\.trim\(\);
  if \(!trimmed\) return |Jayashankar Bhupalpally|Kumurambheem Asifabad|Bhadradri Kothagudem|Yadadri Bhuvanagiri|Mutharam \(Manthani\)|Jilled Chowdergudem|Medchal–Malkajgiri|Mahabubnagar Rural|Medchal-Malkajgiri|Ghanpur \(Station\)|, \{ sensitivity: |Bheemadevarapalli|ChinnaChintakunta|Gundlapochampally|Jogulamba Gadwal|Rajanna Sircilla|Annapureddypalli|Karimnagar Rural|Vemulawada Rural|Nizamabad Rural|Nizamabad South|Tirumalayapalem|Kondamallepally|Nizamabad North|Thalakondapally|Serilingampally|Ramchandrapuram|Mallareddygudem|Adilabad Rural|Laxmidevipalli|Lingalaghanpur|Shankarapatnam|Bheemunipatnam|Nelakondapally|Thangallapalli|Siddipet Rural|Siddipet Urban|Jajireddygudem|Khila Warangal|Bommalaramaram|Khammam Urban|Ibrahimpatnam|Rajendranagar|Yadagirigutta|Mulakalapalle|Jagtial Rural|Ragunathpally|Shankarapally|Moranchapalle|Chigurumamidi|Thimmapur Lmd|Thirumalagiri|Illanthakunta|Yellareddipet|Kukunoorpally|Mahabubnagar|Nagarkurnool|Bhadrachalam|Penchicalpet|Eturunagaram|Thungaturthy|Wardhannapet|Bazarhatnoor|Chandrugonda|Mulkalapalli|Venkatapuram|Chunchupalli|Sujathanagar|Mogullapally|Tirumalagiri|Ramannagudem|Peddamandadi|Ellandakunta|Ganneruvaram|PeddaVangara|Shankarpally|Chinthapally|Nirmal Rural|Gambhiraopet|Shankarpalle|Mogudampally|Nereducherla|Weepangandla|Chennaraopet|Parvathagiri|Hanumakonda|Mahabubabad|Ranga Reddy|,
  \],
  |Aswaraopeta|Bhupalpally|Choppadandi|Devarakadra|Bellampally|Kalwakurthy|Devarakonda|Miryalaguda|Maheshwaram|Narayankhed|Gudihatnoor|Neradigonda|Inderavelly|Kannaigudem|Mallampalli|Tekulapalli|Tekulapalle|Hasanparthy|Devaruppula|Pochannapet|Bachannapet|Dharmasagar|Amarchintha|Qutballapur|Gundlapally|Narketpally|Vemulapally|Kammarpally|Sulthanabad|Veernapalli|Saroornagar|Hayathnagar|Farooqnagar|Gummadidala|Jharasangam|Chinnakodur|Ananthagiri|Garidepally|Mattampally|Mellachervu|Atmakur \(S\)|Basheerabad|Bomaraspeta|Kulkacharla|Doulathabad|Chinnambavi|Srirangapur|Adda Guduru|Atmakur \(M\)|Motakonduru|Thurkapally|Karimnagar|Mancherial|Narayanpet|Peddapalli|Sangareddy|Wanaparthy|Kothagudem|Hanamkonda|Dharmapuri|Palakurthy|Mahadevpur|Yellareddy|Manakondur|Kusumanchi|Sathupalli|Kagaznagar|Kowdipally|Ramayampet|Malkajgiri|Ramagundam|Vemulawada|Patancheru|Huzurnagar|Talamadugu|Laxmipuram|Yerrupalem|Burgumpadu|Dummagudem|Koonavaram|Temurpuram|Gollapalli|Sarangapur|Kodakandla|Zaffergadh|Kesamudram|Venkatapur|Damargidda|Gangadhara|Vijayapura|Jammikunta|Kothapally|Chintakani|Luxettipet|Mandamarri|Papannapet|Bachupally|Turkapally|Nuthanakal|Lokeswaram|Narsapur G|Anthergaon|Chandurthi|Konaraopet|Sadasivpet|Nagalgidda|Geesugonda|Nallabelli|Rayaparthy|Hyderabad|Kamareddy|Nizamabad|Vikarabad|: \[
    |Bichkunda|Huzurabad|Jadcherla|Shadnagar|Zahirabad|Kothakota|Narsampet|Sirikonda|Aswapuram|Dammapeta|Kamepalli|Singareni|Parnasala|Allapalli|Julurpadu|Palvoncha|Shayampet|Kathlapur|Medipalli|Chillakal|Bheemaram|Kotapalle|Madanapur|Undavelly|Mudigonda|Penuballi|Balanagar|Bomraspet|Hathnoora|Kulcharam|Yeldurthy|Bowrampet|Ghatkesar|Narapally|Shamirpet|Nidmanoor|Peddavura|Dharpally|Dichpally|Pothangal|Dharmaram|Julapalli|Srirampur|Boinpalli|Keshampet|Nandigama|Munipally|Sirgapoor|Nadigudem|Palakeedu|Maddirala|Kotepally|Bantwaram|Gopalpeta|Bibinagar|Adilabad|Nalgonda|Siddipet|Suryapet|Warangal|Manuguru|Yellandu|Banswada|Asifabad|Sirpur U|Maripeda|Bheemini|Narsapur|Achampet|Kollapur|Munugode|Nakrekal|Khanapur|Balkonda|Bheemgal|Indalwai|Manthani|Sircilla|Chevella|Husnabad|Kodangal|Gadiguda|Sarapaka|Vemunuru|Yetapaka|Khazipet|Athmakur|Nadikuda|Kodimial|Mallapur|Metpalli|Lingapur|Narmetta|Yellapur|Gopalpur|Kondapur|Mutharam|Sarvaram|Itikyala|Arepalle|Ramadugu|Kerameri|Vempalle|Bayyaram|Dhanwada|Amarabad|Gopalpet|Sirsilla|Alladurg|Chegunta|Kondapak|Dundigal|Jinnaram|Kompally|Pocharam|Nampally|Nirmal U|Kotagiri|Nandipet|Vailpoor|Yergatla|Kamanpur|Ramagiri|Mustabad|Rudrangi|Kandukur|Moinabad|Yacharam|Gandipet|Ameenpur|Vatpally|Nangnoor|Munagala|Chivemla|Penpahad|Marpalle|Mominpet|Nawabpet|Peddemul|Duggondi|Nekkonda|Rajapeta|Jagtial|Jangaon|Khammam|Korutla|Jangoan|Alampur|Madhira|Chennur|Medchal|Anumula|Makthal|Bhainsa|Mudhole|Amangal|Raikode|Cherial|Bhongir|Narnoor|Rebbana|Gundala|Mallial|Regonda|Atmakur|Chityal|Vangara|Kannala|Kataram|Manopad|Pebbair|Ghanpur|Bonakal|Vemsoor|Koutala|Tiryani|Thorrur|Balmoor|Kasipet|Toopran|Taduvai|Chandur|Kuntala|Makloor|Mendora|Morthad|Navipet|Saloora|Eligaid|Balapur|Kadthal|Manchal|Kondurg|Nyalkal|Thoguta|Chilkur|Nagaram|Revally|Mothkur|Mulugu|Nirmal|Ichoda|Utnoor|Parkal|Gadwal|Armoor|Bodhan|Rudrur|Andole|Dubbak|Gajwel|Tandur|Pangal|Jainad|Mavala|Charla|Cherla|Velair|Damera|Raikal|Sangem|Maddur|Rajoli|Enkoor|Kallur|Nennel|Kuravi|Dharur|Jaipur|Kollur|Tekmal|Tadvai|Kubeer|Tanoor|Mugpal|Mupkal|Renjal|Shabad|Madgul|Kothur|Pulkal|Kalher|Kangti|Manoor|Wargal|Mothey|Medak|Boath|Tamsi|Ieeja|Kosgi|Mulug|Kodad|Pargi|Alair|Garla|Gudur|Alwal|Basar|Aloor|Odela|Kandi|Kohir|Pudur|Yelal|Wyra|Bela|Doma))+\s*$';
