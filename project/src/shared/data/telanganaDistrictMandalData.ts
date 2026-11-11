export const TELANGANA_DISTRICTS = [
  'Adilabad',
  'Bhadradri Kothagudem',
  'Hanumakonda',
  'Hyderabad',
  'Jagtial',
  'Jangaon',
  'Jayashankar Bhupalpally',
  'Jogulamba Gadwal',
  'Kamareddy',
  'Karimnagar',
  'Khammam',
  'Kumurambheem Asifabad',
  'Mahabubabad',
  'Mahabubnagar',
  'Mancherial',
  'Medak',
  'Medchal–Malkajgiri',
  'Mulugu',
  'Nagarkurnool',
  'Nalgonda',
  'Narayanpet',
  'Nirmal',
  'Nizamabad',
  'Peddapalli',
  'Rajanna Sircilla',
  'Ranga Reddy',
  'Sangareddy',
  'Siddipet',
  'Suryapet',
  'Vikarabad',
  'Wanaparthy',
  'Warangal',
  'Yadadri Bhuvanagiri',
] as const;

export const TELANGANA_DISTRICT_MANDAL_MAPPING: Record<string, string[]> = {
  'Adilabad': [
    'Adilabad Rural', 'Adilabad Urban', 'Bazarhatnoor', 'Bela', 'Boath', 'Bheempur', 'Gudihatnoor', 'Ichoda', 'Jainath', 'Mavala', 'Neradigonda', 'Sirikonda', 'Talamadugu', 'Tamsi', 'Gadiguda', 'Inderavelly', 'Narnoor', 'Utnoor',
  ],
  'Bhadradri Kothagudem': [
    'Allapalli', 'Annapureddypalli', 'Aswaraopeta', 'Chandrugonda', 'Chunchupalli', 'Dammapeta', 'Gundala', 'Julurpadu', 'Kothagudem', 'Laxmidevipalli', 'Mulkalapally', 'Palvoncha', 'Sujathanagar', 'Tekulapalli', 'Yellandu', 'Aswapuram', 'Bhadrachalam', 'Cherla', 'Burgampahad', 'Dummugudem', 'Karakagudem', 'Manuguru', 'Pinapaka',
  ],
  'Hanumakonda': [
    'Bheemadevarpalli', 'Dharmasagar', 'Elkathurthy', 'Hanamkonda', 'Hasanparthy', 'Inavole', 'Kamalapur', 'Khazipet', 'Velair', 'Athmakur', 'Damera', 'Nadikuda', 'Parkal', 'Shayampet',
  ],
  'Hanamkonda': [
    'Bheemadevarpalli', 'Dharmasagar', 'Elkathurthy', 'Hanamkonda', 'Hasanparthy', 'Inavole', 'Kamalapur', 'Khazipet', 'Velair', 'Athmakur', 'Damera', 'Nadikuda', 'Parkal', 'Shayampet',
  ],
  'Hyderabad': [
    'Amberpet', 'Asif Nagar', 'Bahadurpura', 'Bandlaguda', 'Charminar', 'Golkonda', 'Himayathnagar', 'Nampally', 'Saidabad', 'Ameerpet', 'Khairtabad', 'Maredpally', 'Musheerabad', 'Secunderabad', 'Shaikpet', 'Tirumalgiri',
  ],
  'Jagtial': [
    'Beerpur', 'Bheemaram', 'Buggaram', 'Dharmapuri', 'Endapalli', 'Gollapalli', 'Jagtial', 'Jagtial Rural', 'Kodimial', 'Mallial', 'Pegadapalli', 'Raikal', 'Sarangapur', 'Velgatur', 'Ibrahimpatnam', 'Mallapur', 'Metpalli', 'Kathlapur', 'Korutla', 'Medipalli',
  ],
  'Jangaon': [
    'Bachannapet', 'Devaruppula', 'Jangoan', 'Lingalaghanpur', 'Narmetta', 'Ragunathpally', 'Tharigoppula', 'Chilpur', 'Kodakandla', 'Palakurthy', 'Ghanpur (Station)', 'Zaffergadh',
  ],
  'Jayashankar Bhupalpally': [
    'Bhupalpally', 'Chityal', 'Ghanpur (Mulug)', 'Kataram', 'Mahadevpur', 'Mutharam Mahadevpur', 'Malharrao', 'Mogullapally', 'Palimela', 'Regonda', 'Tekumatla',
  ],
  'Jogulamba Gadwal': [
    'Kaloor Thimmandoddi', 'Dharoor', 'Gadwal', 'Itikyala', 'Maldakal', 'Ghattu', 'Rajoli', 'Waddepally', 'Manopad', 'Undavelly', 'Alampur', 'Ieeja',
  ],
  'Kamareddy': [
    'Banswada', 'Bichkunda', 'Birkur', 'Jukkal', 'Madnoor', 'Nasurullabad', 'Nizamsagar', 'Pedda Kodapgal', 'Pitlam', 'Dongli', 'Bhiknoor', 'Bibipet', 'Domakonda', 'Kamareddy', 'Machareddy', 'Rajampet', 'Ramareddy', 'Sadashivanagar', 'Tadwai', 'Palvancha', 'Gandhari', 'Lingampet', 'Nagireddypet', 'Yellareddy',
  ],
  'Karimnagar': [
    'Chigurumamidi', 'Choppadandi', 'Gangadhara', 'Ganneruvaram', 'Karimnagar', 'Karimnagar Rural', 'Kothapally', 'Manakondur', 'Ramadugu', 'Thimmapur Lmd', 'Ellandakunta', 'Huzurabad', 'Jammikunta', 'Shankarapatnam', 'V.Saidapur', 'Veenavanka',
  ],
  'Khammam': [
    'Enkoor', 'Kalluru', 'Penuballi', 'Sathupalli', 'Thallada', 'Vemsoor', 'Bonakal', 'Chinthakani', 'Kamepalli', 'Khammam (Rural)', 'Khammam (Urban)', 'Konijerla', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapalli', 'Raghunadhapalem', 'Singareni', 'Tirumalayapalem', 'Wyra', 'Yerrupalem',
  ],
  'Kumurambheem Asifabad': [
    'Asifabad', 'Jainoor', 'Kerameri', 'Lingapur', 'Rebbena', 'Sirpur U', 'Tiryani', 'Wankidi', 'Bejjur', 'Chintalamanepally', 'Dahegoan', 'Kagaznagar', 'Koutala', 'Penchicalpet', 'Sirpur (T)',
  ],
  'Kumrambheem Asifabad': [
    'Asifabad', 'Jainoor', 'Kerameri', 'Lingapur', 'Rebbena', 'Sirpur U', 'Tiryani', 'Wankidi', 'Bejjur', 'Chintalamanepally', 'Dahegoan', 'Kagaznagar', 'Koutala', 'Penchicalpet', 'Sirpur (T)',
  ],
  'Mahabubabad': [
    'Bayyaram', 'Dornakal', 'Gangaram', 'Garla', 'Gudur', 'Kesamudram', 'Kothaguda', 'Kuravi', 'Mahabubabad', 'Seerole', 'Inugurthy', 'Chinnagudur', 'Danthalapalle', 'Maripeda', 'Narsimhulapet', 'Nellikudur', 'Peddavangara', 'Thorrur',
  ],
  'Mahabubnagar': [
    'Addakal', 'Balanagar', 'Bhoothpur', 'Chinnachintakunta', 'Devarakadra', 'Gandeed', 'Hanwada', 'Jadcherla', 'Koilkonda', 'Mahabubnagar Rural', 'Mahabubnagar Urban', 'Midjil', 'Mohammadabad', 'Moosapet', 'Nawabpet', 'Rajapur',
  ],
  'Mancherial': [
    'Bheemaram', 'Chennur', 'Dandepally', 'Hajipur', 'Jaipur', 'Jannaram', 'Kotapally', 'Luxettipet', 'Mancherial', 'Mandamarri', 'Naspur', 'Bellampally', 'Bheemini', 'Kannepally', 'Kasipet', 'Nennel', 'Tandur', 'Vemanpally',
  ],
  'Medak': [
    'Alladurg', 'Havelighanapur', 'Medak', 'Nizampet', 'Papannapet', 'Ramayampet', 'Regode', 'Shankarampet (A)', 'Shankarampet (R)', 'Tekmal', 'Chilpched', 'Kowdipally', 'Kulcharam', 'Narsapur', 'Shivampet', 'Chegunta', 'Manoharabad', 'Masaipet', 'Narsingi', 'Toopran', 'Yeldurthy',
  ],
  'Medchal–Malkajgiri': [
    'Alwal', 'Bachupally', 'Balanagar', 'Gandimaisamma Dundiga', 'Kukatpally', 'Malkajgiri', 'Qutballapur', 'Ghatkesar', 'Kapra', 'Keesara', 'Medchal', 'Medipally', 'Muduchinthalapally', 'Shamirpet', 'Uppal',
  ],
  'Mulugu': [
    'Eturunagaram', 'Govindaraopet', 'Kannaigudem', 'Mangapet', 'Mulug', 'Tadvai', 'Venkatapur', 'Venkatapuram', 'Wajedu',
  ],
  'Nagarkurnool': [
    'Achampet', 'Amrabad', 'Balmoor', 'Lingal', 'Padara', 'Uppununthala', 'Charakonda', 'Kalwakurthy', 'Urkonda', 'Vangoor', 'Veldanda', 'Kodair', 'Kollapur', 'Peddakothapally', 'Pentlavelli', 'Bijinapally', 'Nagarkurnool', 'Tadoor', 'Telkapally', 'Thimmajipet',
  ],
  'Nalgonda': [
    'Chandampeta', 'Chinthapally', 'Devarakonda', 'Gattuppal', 'Gudipally', 'Gundlapally', 'Gurrampode', 'Kondamallepally', 'Marriguda', 'Nampally', 'Neredugommu', 'Pedda Adesherlapally', 'Adavidevulapalli', 'Anumula', 'Dameracherla', 'Madugulapally', 'Miryalaguda', 'Nidmanoor', 'Peddavoora', 'Tripuraram', 'Tirumalagiri Sagar', 'Vemulapally', 'Chandur', 'Chityal', 'Kanagal', 'Kattangur', 'Kethepally', 'Munugode', 'Nakrekal', 'Narketpally', 'Nalgonda', 'Shaligouraram', 'Thipparthy',
  ],
  'Narayanpet': [
    'Damargidda', 'Dhanwada', 'Gundumal', 'Kosgi', 'Krishna', 'Kotthapally', 'Maddur', 'Maganoor', 'Makthal', 'Marikal', 'Narayanpet', 'Narwa', 'Utkoor',
  ],
  'Nirmal': [
    'Basar', 'Bhainsa', 'Kubeer', 'Kuntala', 'Lokeswaram', 'Mudhole', 'Tanoor', 'Dasturabad', 'Dilawarpur', 'Kaddam Peddur', 'Khanapur', 'Laxmanchanda', 'Mamada', 'Narsapur G', 'Nirmal Rural', 'Nirmal U', 'Pembi', 'Sarangapur', 'Soan',
  ],
  'Nizamabad': [
    'Aloor', 'Armoor', 'Balkonda', 'Bheemgal', 'Donkeshwar', 'Jakranpally', 'Kammarpally', 'Mendora', 'Morthad', 'Mupkal', 'Nandipet', 'Vailpoor', 'Yergatla', 'Bodhan', 'Chandur', 'Kotagiri', 'Pothangal', 'Mosara', 'Renjal', 'Rudrur', 'Saloora', 'Varni', 'Yedapally', 'Dharpally', 'Dichpally', 'Indalwai', 'Makloor', 'Mugpal', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Sirikonda',
  ],
  'Peddapalli': [
    'Kamanpur', 'Manthani', 'Mutharam (Manthani)', 'Ramagiri', 'Anthergaon', 'Dharmaram', 'Eligaid', 'Julapalli', 'Palakurthy', 'Peddapalli', 'Ramagundam', 'Srirampur', 'Sulthanabad', 'Odela',
  ],
  'Rajanna Sircilla': [
    'Illanthakunta', 'Gambhiraopet', 'Mustabad', 'Sircilla', 'Thangallapalli', 'Veernapalli', 'Yellareddipet', 'Boinpalli', 'Chandurthi', 'Konaraopet', 'Rudrangi', 'Vemulawada', 'Vemulawada Rural',
  ],
  'Rangareddy': [
    'Chevella', 'Moinabad', 'Shabad', 'Shankarpalle', 'Abdullapurmet', 'Hayathnagar', 'Ibrahimpatnam', 'Madgul', 'Manchal', 'Yacharam', 'Amangal', 'Balapur', 'Kadthal', 'Kandukur', 'Maheshwaram', 'Saroornagar', 'Thalakondapally', 'Gandipet', 'Rajendranagar', 'Serilingampally', 'Shamshabad', 'Farooqnagar', 'Jilled Chowdergudem', 'Keshampet', 'Kondurg', 'Kothur', 'Nandigama', 'Shadnagar',
  ],
  'Sangareddy': [
    'Kalher', 'Kangti', 'Manoor', 'Nagalgidda', 'Narayankhed', 'Sirgapoor', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal', 'Raikode', 'Zahirabad', 'Chowtakur',
  ],
  'Siddipet': [
    'Dubbak', 'Siddipet Rural', 'Chinnakodur', 'Nangnoor', 'Siddipet Urban', 'Thoguta', 'Mirdoddi', 'Doultabad', 'Komuravelli', 'Cherial', 'Narayanaraopet', 'Akberpet Bhoompally', 'Raipole', 'Wargal', 'Mulug', 'Markook', 'Jagdevpur', 'Gajwel', 'Kondapak', 'Kukunoorpally', 'Akkannapet', 'Bejjanki', 'Dhoolmitta', 'Husnabad', 'Koheda', 'Maddur',
  ],
  'Suryapet': [
    'Atmakur (S)', 'Chivemla', 'Jajireddygudem', 'Maddirala', 'Mothey', 'Nagaram', 'Nuthanakal', 'Penpahad', 'Thirumalagiri', 'Thungaturthy', 'Suryapet', 'Ananthagiri', 'Chilkur', 'Chinthalapalem', 'Kodad', 'Munagala', 'Nadigudem', 'Garidepally', 'Huzurnagar', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Nereducherla', 'Palakeedu',
  ],
  'Vikarabad': [
    'Basheerabad', 'Bomaraspeta', 'Doulathabad', 'Kodangal', 'Peddemul', 'Tandur', 'Yelal', 'Bantwaram', 'Doma', 'Dharur', 'Kotepally', 'Kulkacharla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur', 'Vikarabad', 'Chowdapur',
  ],
  'Wanaparthy': [
    'Amarchintha', 'Atmakur', 'Chinnambavi', 'Ghanpur', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Weepangandla', 'Wanaparthy', 'Yedula',
  ],
  'Warangal': [
    'Geesugonda', 'Khila Warangal', 'Parvathagiri', 'Rayaparthy', 'Wardhannapet', 'Warangal', 'Sangem', 'Chennaraopet', 'Duggondi', 'Khanapur', 'Nallabelli', 'Narsampet', 'Nekkonda',
  ],
  'Yadadri Bhuvanagiri': [
    'Adda Guduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakonduru', 'Mothkur', 'Rajapeta', 'Thurkapally', 'Yadagirigutta', 'B Pochampally', 'Choutuppal', 'Narayanpur', 'Ramannapet', 'Valigonda',
  ],
  'Others': [],
};

export const QUALIFICATION_OPTIONS = [
  { label: 'Diploma (Ag.)', value: 'Diploma (Ag.)' },
  { label: 'B.Sc (Ag.)', value: 'B.Sc (Ag.)' },
  { label: 'M.Sc (Ag.)', value: 'M.Sc (Ag.)' },
  { label: 'Ph.D (Ag.)', value: 'Ph.D (Ag.)' },
  { label: 'Others', value: 'Others' },
];

export const DESIGNATION_OPTIONS = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture (R)', value: 'Asst. Director of Agriculture' },
  { label: 'Asst. Director of Agriculture (T)', value: 'Asst. Director of Agriculture (T)' },
  { label: 'Insecticide Inspector', value: 'Insecticide Inspector' },
];

export const SEED_DESIGNATION_OPTIONS = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture (R)', value: 'Asst. Director of Agriculture' },
  { label: 'District Agriculture Officer', value: 'District Agriculture Officer' },
  { label: 'Others', value: 'Others' },
];

// Designation options for Seed Sample Drawal (Seed Inspector replaces District Agriculture Officer)
export const SEED_SAMPLE_DRAWAL_DESIGNATION_OPTIONS = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture (R)', value: 'Asst. Director of Agriculture' },
  { label: 'Asst. Director of Agriculture (T)', value: 'Asst. Director of Agriculture (T)' },
  { label: 'Seed Inspector', value: 'Seed Inspector' },
];

// District to Division mapping
export const DISTRICT_DIVISION_MAPPING: Record<string, string[]> = {
  'Adilabad': ['Adilabad Rural', 'Boath', 'Ichoda', 'Tamsi', 'Utnoor'],
  'Bhadradri Kothagudem': ['Aswaraopeta', 'Bhadrachalam', 'Kothagudem', 'Manuguru', 'Yellandu'],
  'Hanumakonda': ['Hanamkonda', 'Parkal'],
  'Hanamkonda': ['Hanamkonda', 'Parkal'],
  'Jagtial': ['Dharmapuri', 'Jagtial', 'Korutla'],
  'Jangaon': ['Ghanpur (Station)', 'Jangoan', 'Palakurthy'],
  'Jayashankar Bhupalpally': ['Bhupalpally', 'Mahadevpur'],
  'Jogulamba Gadwal': ['Alampur', 'Gadwal', 'Ieeja'],
  'Kamareddy': ['Banswada', 'Bichkunda', 'Kamareddy', 'Yellareddy'],
  'Karimnagar': ['Choppadandi', 'Huzurabad', 'Karimnagar', 'Manakondur'],
  'Khammam': ['Khammam Urban', 'Kusumanchi', 'Madhira', 'Sathupalli', 'Wyra'],
  'Kumurambheem Asifabad': ['Asifabad', 'Kagaznagar', 'Penchicalpet', 'Sirpur U'],
  'Kumrambheem Asifabad': ['Asifabad', 'Kagaznagar', 'Penchicalpet', 'Sirpur U'],
  'Hyderabad': [],
  'Mahabubabad': ['Mahabubabad', 'Maripeda'],
  'Mahabubnagar': ['Devarakadra', 'Jadcherla', 'Mahabubnagar Rural'],
  'Mancherial': ['Bellampally', 'Bheemini', 'Chennur', 'Mancherial'],
  'Medak': ['Kowdipally', 'Medak', 'Narsapur', 'Ramayampet'],
  'Medchal-Malkajgiri': ['Malkajgiri', 'Medchal'],
  'Mulugu': ['Eturunagaram', 'Mulugu'],
  'Nagarkurnool': ['Achampet', 'Kalwakurthy', 'Kollapur', 'Nagarkurnool'],
  'Nalgonda': ['Anumula', 'Devarakonda', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nalgonda'],
  'Narayanpet': ['Kosgi', 'Makthal', 'Narayanpet'],
  'Nirmal': ['Bhainsa', 'Khanapur', 'Mudhole', 'Nirmal'],
  'Nizamabad': ['Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Indalwai', 'Nizamabad Rural', 'Nizamabad South', 'Rudrur'],
  'Peddapalli': ['Manthani', 'Peddapalli', 'Ramagundam'],
  'Rajanna Sircilla': ['Sircilla', 'Vemulawada'],
  'Ranga Reddy': ['Amangal', 'Chevella', 'Ibrahimpatnam', 'Maheshwaram', 'Rajendranagar', 'Shadnagar'],
  'Sangareddy': ['Andole', 'Narayankhed', 'Patancheru', 'Raikode', 'Sangareddy', 'Zahirabad'],
  'Siddipet': ['Cherial', 'Dubbak', 'Gajwel', 'Husnabad', 'Mulug', 'Siddipet'],
  'Suryapet': ['Huzurnagar', 'Kodad', 'Suryapet', 'Thungaturthy'],
  'Vikarabad': ['Kodangal', 'Pargi', 'Tandur', 'Vikarabad'],
  'Wanaparthy': ['Kothakota', 'Pangal', 'Wanaparthy'],
  'Warangal': ['Narsampet', 'Wardhannapet'],
  'Yadadri Bhuvanagiri': ['Alair', 'Bhongir', 'Yadagirigutta'],
};

function squashLocationKey(value: string): string {
  return value.toLowerCase().replace(/[\s\-–—]+/g, '');
}

function lookupLocationMapping(mapping: Record<string, string[]>, key: string): string[] {
  const direct = mapping[key];
  if (direct) return direct;
  const squashed = squashLocationKey(key);
  const match = Object.keys(mapping).find((k) => squashLocationKey(k) === squashed);
  return match ? mapping[match] : [];
}

function sortLocationNames(names: string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

export function getDivisionsForDistrict(district: string): string[] {
  return sortLocationNames(lookupLocationMapping(DISTRICT_DIVISION_MAPPING, district));
}

export function getMandalsForDistrict(district: string): string[] {
  return sortLocationNames(lookupLocationMapping(TELANGANA_DISTRICT_MANDAL_MAPPING, district));
}

// Division to Mandal mapping
export const DIVISION_MANDAL_MAPPING: Record<string, string[]> = {
  // Adilabad District
  'Adilabad Rural': ['Adilabad Rural', 'Bazarhatnoor', 'Bela', 'Gudihatnoor', 'Neradigonda', 'Sirikonda', 'Talamadugu'],
  'Boath': ['Boath', 'Gadiguda', 'Inderavelly', 'Narnoor', 'Utnoor'],
  'Ichoda': ['Ichoda', 'Jainad', 'Mavala'],
  'Tamsi': ['Tamsi'],
  'Utnoor': ['Utnoor'],
  
  // Bhadradri Kothagudem District
  'Aswaraopeta': ['Aswaraopeta', 'Aswapuram', 'Chandrugonda', 'Dammapeta', 'Kamepalli', 'Kothagudem', 'Laxmipuram', 'Mulkalapalli', 'Sarapaka', 'Singareni', 'Tirumalayapalem', 'Yerrupalem'],
  'Bhadrachalam': ['Bhadrachalam', 'Burgumpadu', 'Charla', 'Cherla', 'Dummagudem', 'Kannaigudem', 'Koonavaram', 'Mallampalli', 'Manuguru', 'Narsapur', 'Parnasala', 'Rebbana', 'Tekulapalli', 'Temurpuram', 'Vemunuru', 'Venkatapuram', 'Yetapaka'],
  'Kothagudem': ['Allapalli', 'Annapureddypalli', 'Chunchupalli', 'Gundala', 'Julurpadu', 'Kothagudem', 'Laxmidevipalli', 'Mulakalapalle', 'Palvoncha', 'Sujathanagar', 'Tekulapalle'],
  'Manuguru': ['Manuguru'],
  'Yellandu': ['Yellandu'],
  
  // Hanamkonda District
  'Hanamkonda': ['Hanamkonda', 'Hasanparthy', 'Khazipet', 'Velair'],
  'Parkal': ['Athmakur', 'Damera', 'Nadikuda', 'Parkal', 'Shayampet'],
  
  // Jagtial District
  'Dharmapuri': ['Dharmapuri', 'Gollapalli', 'Sarangapur'],
  'Jagtial': ['Jagtial', 'Jagtial Rural', 'Kodimial', 'Mallial', 'Raikal'],
  'Korutla': ['Ibrahimpatnam', 'Mallapur', 'Metpalli', 'Kathlapur', 'Korutla', 'Medipalli'],
  
  // Jangaon District
  'Ghanpur (Station)': ['Ghanpur (Station)', 'Kodakandla', 'Lingalaghanpur', 'Regonda', 'Ragunathpally', 'Zaffergadh'],
  'Jangoan': ['Jangoan', 'Chillakal', 'Devaruppula', 'Kesamudram', 'Lingapur', 'Narmetta', 'Pochannapet', 'Ragunathpally', 'Sangem', 'Yellapur'],
  'Palakurthy': ['Palakurthy', 'Atmakur', 'Bachannapet', 'Bheemadevarapalli', 'Chityal', 'Dharmasagar', 'Gopalpur', 'Kondapur', 'Maddur', 'Maripeda', 'Mogullapally', 'Narmetta', 'Palakurthy', 'Ragunathpally', 'Shankarapally', 'Tirumalagiri', 'Vangara', 'Venkatapur'],
  
  // Jayashankar Bhupalpally District
  'Bhupalpally': ['Bhupalpally', 'Bheemaram', 'Chityal', 'Damargidda', 'Gangadhara', 'Kannala', 'Kataram', 'Kotapalle', 'Mahadevpur', 'Mallapur', 'Moranchapalle', 'Mutharam', 'Narsampet', 'Ramannagudem', 'Sarvaram', 'Shankarapally', 'Venkatapur'],
  'Mahadevpur': ['Mahadevpur', 'Bheemaram', 'Bhupalpally', 'Chityal', 'Damargidda', 'Gangadhara', 'Kannala', 'Kataram', 'Kotapalle', 'Mallapur', 'Moranchapalle', 'Mutharam', 'Narsampet', 'Ramannagudem', 'Sarvaram', 'Shankarapally', 'Venkatapur'],
  
  // Jogulamba Gadwal District
  'Alampur': ['Alampur', 'Itikyala', 'Kollapur', 'Manopad', 'Pebbair', 'Peddamandadi', 'Wanaparthy'],
  'Gadwal': ['Gadwal', 'Arepalle', 'Ghanpur', 'Ieeja', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Ieeja': ['Ieeja', 'Arepalle', 'Ghanpur', 'Gadwal', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  
  // Kamareddy District
  'Banswada': ['Banswada', 'Bichkunda', 'Kamareddy', 'Yellareddy'],
  'Bichkunda': ['Bichkunda', 'Banswada', 'Kamareddy', 'Yellareddy'],
  'Kamareddy': ['Kamareddy', 'Banswada', 'Bichkunda', 'Yellareddy'],
  'Yellareddy': ['Yellareddy', 'Banswada', 'Bichkunda', 'Kamareddy'],
  
  // Karimnagar District
  'Choppadandi': ['Chigurumamidi', 'Choppadandi', 'Gangadhara'],
  'Huzurabad': ['Ellandakunta', 'Huzurabad', 'Jammikunta', 'Shankarapatnam'],
  'Karimnagar': ['Ganneruvaram', 'Karimnagar', 'Karimnagar Rural', 'Kothapally'],
  'Manakondur': ['Kothapally', 'Manakondur', 'Ramadugu', 'Thimmapur Lmd'],
  
  // Khammam District
  'Khammam Urban': ['Khammam', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalli', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Kusumanchi': ['Kusumanchi', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalli', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Madhira': ['Madhira', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalli', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Sathupalli': ['Sathupalli', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Wyra': ['Wyra', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalli', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Yerrupalem'],
  
  // Kumurambheem Asifabad District
  'Asifabad': ['Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Penchicalpet', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Kagaznagar': ['Kagaznagar', 'Asifabad', 'Bheemini', 'Kerameri', 'Koutala', 'Nennel', 'Penchicalpet', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Penchicalpet': ['Penchicalpet', 'Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Sirpur U': ['Sirpur U', 'Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Penchicalpet', 'Tiryani', 'Vempalle'],
  
  // Mahabubabad District
  'Mahabubabad': ['Mahabubabad', 'Bayyaram', 'Dhanwada', 'Garla', 'Gudur', 'Kesamudram', 'Kuravi', 'Maripeda', 'Narsampet', 'PeddaVangara', 'Thorrur'],
  'Maripeda': ['Maripeda', 'Bayyaram', 'Dhanwada', 'Garla', 'Gudur', 'Kesamudram', 'Kuravi', 'Mahabubabad', 'Narsampet', 'PeddaVangara', 'Thorrur'],
  
  // Mahabubnagar District
  'Devarakadra': ['Devarakadra', 'Amarabad', 'Balmoor', 'ChinnaChintakunta', 'Gopalpet', 'Kollapur', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Jadcherla': ['Jadcherla', 'Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Mahabubnagar Rural': ['Mahabubnagar Rural', 'Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  
  // Mancherial District
  'Bellampally': ['Bellampally', 'Bheemini', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Bheemini': ['Bheemini', 'Asifabad', 'Bellampally', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Chennur': ['Chennur', 'Asifabad', 'Bellampally', 'Bheemini', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Mancherial': ['Mancherial', 'Asifabad', 'Bellampally', 'Bheemini', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  
  // Medak District
  'Kowdipally': ['Kowdipally', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Medak', 'Narsapur', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Medak': ['Medak', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipally', 'Narsapur', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Narsapur': ['Narsapur', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipally', 'Medak', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Ramayampet': ['Ramayampet', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipally', 'Medak', 'Narsapur', 'Papannapet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  
  // Medchal–Malkajgiri District
  'Malkajgiri': ['Malkajgiri', 'Alwal', 'Bachupally', 'Bowrampet', 'Dundigal', 'Ghatkesar', 'Gundlapochampally', 'Jinnaram', 'Kompally', 'Kothapally', 'Medchal', 'Narapally', 'Pocharam', 'Qutballapur', 'Shamirpet', 'Turkapally'],
  'Medchal': ['Medchal', 'Alwal', 'Bachupally', 'Bowrampet', 'Dundigal', 'Ghatkesar', 'Gundlapochampally', 'Jinnaram', 'Kompally', 'Kothapally', 'Malkajgiri', 'Narapally', 'Pocharam', 'Qutballapur', 'Shamirpet', 'Turkapally'],
  
  // Mulugu District
  'Eturunagaram': ['Eturunagaram', 'Kannaigudem', 'Kollapur', 'Mallampalli', 'Narsampet', 'Taduvai', 'Tadvai', 'Venkatapur'],
  'Mulugu': ['Mulugu', 'Kannaigudem', 'Kollapur', 'Mallampalli', 'Narsampet', 'Taduvai', 'Tadvai', 'Venkatapur'],
  
  // Nagarkurnool District
  'Achampet': ['Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Kalwakurthy': ['Kalwakurthy', 'Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Kollapur': ['Kollapur', 'Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  'Nagarkurnool': ['Nagarkurnool', 'Achampet', 'Alampur', 'Amarchintha', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelly', 'Vijayapura', 'Wanaparthy'],
  
  // Nalgonda District
  'Anumula': ['Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Devarakonda': ['Devarakonda', 'Anumula', 'Chandur', 'Chinthapally', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Miryalaguda': ['Miryalaguda', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Munugode': ['Munugode', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Nakrekal': ['Nakrekal', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Nalgonda': ['Nalgonda', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nampally', 'Narketpally', 'Nidmanoor', 'Nuthanakal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  
  // Narayanpet District
  'Kosgi': ['Kosgi', 'Kollapur', 'Kothakota', 'Makthal', 'Narayanpet', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelly', 'Wanaparthy'],
  'Makthal': ['Makthal', 'Kosgi', 'Kollapur', 'Kothakota', 'Narayanpet', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelly', 'Wanaparthy'],
  'Narayanpet': ['Narayanpet', 'Kosgi', 'Kollapur', 'Kothakota', 'Makthal', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelly', 'Wanaparthy'],
  
  // Nirmal District
  'Bhainsa': ['Bhainsa', 'Basar', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeswaram', 'Mudhole', 'Narsapur G', 'Nirmal Rural', 'Nirmal U', 'Tanoor'],
  'Khanapur': ['Khanapur', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeswaram', 'Mudhole', 'Narsapur G', 'Nirmal Rural', 'Nirmal U', 'Tanoor'],
  'Mudhole': ['Mudhole', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeswaram', 'Narsapur G', 'Nirmal Rural', 'Nirmal U', 'Tanoor'],
  'Nirmal': ['Nirmal Rural', 'Nirmal U', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeswaram', 'Mudhole', 'Narsapur G', 'Tanoor'],
  
  // Nizamabad District
  'Armoor': ['Armoor', 'Aloor', 'Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Balkonda': ['Balkonda', 'Aloor', 'Armoor', 'Armoor', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Bheemgal': ['Bheemgal', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Bodhan': ['Bodhan', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bheemgal', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Indalwai': ['Indalwai', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Nizamabad Rural': ['Nizamabad Rural', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad South', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Nizamabad South': ['Nizamabad South', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Pothangal', 'Renjal', 'Rudrur', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  'Rudrur': ['Rudrur', 'Aloor', 'Armoor', 'Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpally', 'Dichpally', 'Indalwai', 'Kammarpally', 'Kotagiri', 'Makloor', 'Mendora', 'Morthad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad North', 'Nizamabad Rural', 'Nizamabad South', 'Pothangal', 'Renjal', 'Saloora', 'Sirikonda', 'Vailpoor', 'Yergatla'],
  
  // Peddapalli District
  'Manthani': ['Manthani', 'Anthergaon', 'Dharmaram', 'Eligaid', 'Julapalli', 'Kamanpur', 'Mutharam (Manthani)', 'Odela', 'Palakurthy', 'Peddapalli', 'Ramagiri', 'Ramagundam', 'Srirampur', 'Sulthanabad'],
  'Peddapalli': ['Peddapalli', 'Anthergaon', 'Dharmaram', 'Eligaid', 'Julapalli', 'Kamanpur', 'Manthani', 'Mutharam (Manthani)', 'Odela', 'Palakurthy', 'Ramagiri', 'Ramagundam', 'Srirampur', 'Sulthanabad'],
  'Ramagundam': ['Ramagundam', 'Anthergaon', 'Dharmaram', 'Eligaid', 'Julapalli', 'Kamanpur', 'Manthani', 'Mutharam (Manthani)', 'Odela', 'Palakurthy', 'Peddapalli', 'Ramagiri', 'Srirampur', 'Sulthanabad'],
  
  // Rajanna Sircilla District
  'Sircilla': ['Sircilla', 'Boinpalli', 'Chandurthi', 'Illanthakunta', 'Gambhiraopet', 'Konaraopet', 'Mustabad', 'Rudrangi', 'Thangallapalli', 'Veernapalli', 'Vemulawada', 'Vemulawada Rural', 'Yellareddipet'],
  'Vemulawada': ['Vemulawada', 'Vemulawada Rural', 'Boinpalli', 'Chandurthi', 'Illanthakunta', 'Gambhiraopet', 'Konaraopet', 'Mustabad', 'Rudrangi', 'Sircilla', 'Thangallapalli', 'Veernapalli', 'Yellareddipet'],
  
  // Ranga Reddy District
  'Amangal': ['Amangal', 'Balapur', 'Kadthal', 'Kandukur', 'Maheshwaram', 'Saroornagar', 'Thalakondapally'],
  'Chevella': ['Chevella', 'Moinabad', 'Shabad', 'Shankarpalle'],
  'Ibrahimpatnam': ['Ibrahimpatnam', 'Hayathnagar', 'Madgul', 'Manchal', 'Yacharam'],
  'Maheshwaram': ['Maheshwaram', 'Amangal', 'Balapur', 'Gandipet', 'Kadthal', 'Kandukur', 'Rajendranagar', 'Saroornagar', 'Serilingampally', 'Thalakondapally'],
  'Rajendranagar': ['Rajendranagar', 'Gandipet', 'Maheshwaram', 'Serilingampally'],
  'Shadnagar': ['Shadnagar', 'Farooqnagar', 'Jilled Chowdergudem', 'Keshampet', 'Kondurg', 'Kothur', 'Nandigama'],
  
  // Sangareddy District
  'Andole': ['Andole', 'Ameenpur', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally'],
  'Narayankhed': ['Narayankhed', 'Kalher', 'Kangti', 'Manoor', 'Nagalgidda', 'Sirgapoor'],
  'Patancheru': ['Patancheru', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally'],
  'Raikode': ['Raikode', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal'],
  'Sangareddy': ['Sangareddy', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Vatpally'],
  'Zahirabad': ['Zahirabad', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal', 'Raikode'],
  
  // Siddipet District
  'Cherial': ['Cherial', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Mulug', 'Nangnoor', 'Siddipet Rural', 'Siddipet Urban', 'Thoguta', 'Wargal'],
  'Dubbak': ['Dubbak', 'Cherial', 'Chinnakodur', 'Gajwel', 'Husnabad', 'Mulug', 'Nangnoor', 'Siddipet Rural', 'Siddipet Urban', 'Thoguta', 'Wargal'],
  'Gajwel': ['Gajwel', 'Cherial', 'Chinnakodur', 'Dubbak', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Siddipet Rural', 'Siddipet Urban', 'Thoguta', 'Wargal'],
  'Husnabad': ['Husnabad', 'Cherial', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Siddipet Rural', 'Siddipet Urban', 'Thoguta', 'Wargal'],
  'Mulug': ['Mulug', 'Cherial', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Nangnoor', 'Siddipet Rural', 'Siddipet Urban', 'Thoguta', 'Wargal'],
  'Siddipet': ['Siddipet Rural', 'Siddipet Urban', 'Cherial', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Thoguta', 'Wargal'],
  
  // Suryapet District
  'Huzurnagar': ['Huzurnagar', 'Ananthagiri', 'Chilkur', 'Garidepally', 'Kodad', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Munagala', 'Nadigudem', 'Nereducherla', 'Palakeedu'],
  'Kodad': ['Kodad', 'Ananthagiri', 'Chilkur', 'Garidepally', 'Huzurnagar', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Munagala', 'Nadigudem', 'Nereducherla', 'Palakeedu'],
  'Suryapet': ['Suryapet', 'Atmakur (S)', 'Chivemla', 'Garidepally', 'Huzurnagar', 'Jajireddygudem', 'Kodad', 'Maddirala', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Mothey', 'Munagala', 'Nadigudem', 'Nagaram', 'Nereducherla', 'Nuthanakal', 'Palakeedu', 'Penpahad', 'Thirumalagiri', 'Thungaturthy'],
  'Thungaturthy': ['Thungaturthy', 'Atmakur (S)', 'Chivemla', 'Garidepally', 'Huzurnagar', 'Jajireddygudem', 'Kodad', 'Maddirala', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Mothey', 'Munagala', 'Nadigudem', 'Nagaram', 'Nereducherla', 'Nuthanakal', 'Palakeedu', 'Penpahad', 'Suryapet', 'Thirumalagiri'],
  
  // Vikarabad District
  'Kodangal': ['Kodangal', 'Basheerabad', 'Bomaraspeta', 'Dharur', 'Kotepally', 'Kulkacharla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur'],
  'Pargi': ['Pargi', 'Basheerabad', 'Bomaraspeta', 'Dharur', 'Kodangal', 'Kotepally', 'Kulkacharla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pudur'],
  'Tandur': ['Tandur', 'Basheerabad', 'Bomaraspeta', 'Doulathabad', 'Kodangal', 'Peddemul', 'Yelal'],
  'Vikarabad': ['Vikarabad', 'Bantwaram', 'Doma', 'Dharur', 'Kotepally', 'Kulkacharla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur'],
  
  // Wanaparthy District
  'Kothakota': ['Kothakota', 'Amarchintha', 'Atmakur', 'Chinnambavi', 'Ghanpur', 'Gopalpeta', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Weepangandla', 'Wanaparthy'],
  'Pangal': ['Pangal', 'Amarchintha', 'Atmakur', 'Chinnambavi', 'Ghanpur', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Weepangandla', 'Wanaparthy'],
  'Wanaparthy': ['Wanaparthy', 'Amarchintha', 'Atmakur', 'Chinnambavi', 'Ghanpur', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Weepangandla'],
  
  // Warangal District
  'Narsampet': ['Narsampet', 'Chennaraopet', 'Duggondi', 'Geesugonda', 'Khila Warangal', 'Khanapur', 'Nallabelli', 'Nekkonda', 'Parvathagiri', 'Rayaparthy', 'Sangem', 'Wardhannapet', 'Warangal'],
  'Wardhannapet': ['Wardhannapet', 'Chennaraopet', 'Duggondi', 'Geesugonda', 'Khila Warangal', 'Khanapur', 'Nallabelli', 'Narsampet', 'Nekkonda', 'Parvathagiri', 'Rayaparthy', 'Sangem', 'Warangal'],
  
  // Yadadri Bhuvanagiri District
  'Alair': ['Alair', 'Adda Guduru', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakonduru', 'Mothkur', 'Rajapeta', 'Thurkapally', 'Yadagirigutta'],
  'Bhongir': ['Bhongir', 'Adda Guduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bommalaramaram', 'Gundala', 'Motakonduru', 'Mothkur', 'Rajapeta', 'Thurkapally', 'Yadagirigutta'],
  'Yadagirigutta': ['Yadagirigutta', 'Adda Guduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakonduru', 'Mothkur', 'Rajapeta', 'Thurkapally'],
};

export function getMandalsForDivision(division: string): string[] {
  return sortLocationNames(DIVISION_MANDAL_MAPPING[division] || []);
}

export function isValidDistrictMandalPair(district: string, mandal: string): boolean {
  if (district === 'Others') return true;
  const mandals = getMandalsForDistrict(district);
  return mandals.includes(mandal);
}
