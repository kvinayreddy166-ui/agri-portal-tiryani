export const TELANGANA_DISTRICTS = [
  'Adilabad',
  'Bhadradri Kothagudem',
  'Hanamkonda',
  'Hyderabad',
  'Jagtial',
  'Jangaon',
  'Jayashankar Bhupalpally',
  'Jogulamba Gadwal',
  'Kamareddy',
  'Karimnagar',
  'Khammam',
  'Kumrambheem Asifabad',
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
    'Adilabad Rural', 'Adilabad Urban', 'Bazarhatnoor', 'Bela', 'Boath', 'Bheempoor', 'Gudihathnur', 'Ichoda', 'Jainad', 'Mavala', 'Neradigonda', 'Sirikonda', 'Talamadagu', 'Tamsi', 'Gadiguda', 'Inderavelly', 'Narnoor', 'Utnoor',
  ],
  'Bhadradri Kothagudem': [
    'Allapalli', 'Annapureddypally', 'Aswaraopeta', 'Chandrugonda', 'Chunchupally', 'Dammapeta', 'Gundala', 'Julurpad', 'Kothagudem', 'Laxmidevipalli', 'Mulakalapalle', 'Palvancha', 'Sujathanagar', 'Tekulapalle', 'Yellandu', 'Aswapuram', 'Bhadrachalam', 'Cherla', 'Burgampahad', 'Dummugudem', 'Karakagudem', 'Manuguru', 'Pinapaka',
  ],
  'Hanamkonda': [
    'Bheemadevarapalle', 'Dharmasagar', 'Elkathurthy', 'Hanamkonda', 'Hasanparthy', 'Inavole', 'Kamalapur', 'Kazipet', 'Velair', 'Atmakur', 'Damera', 'Nadikuda', 'Parkal', 'Shayampet',
  ],
  'Hyderabad': [
    'Amberpet', 'Asif Nagar', 'Bahadurpura', 'Bandlaguda', 'Charminar', 'Golkonda', 'Himayathnagar', 'Nampally', 'Saidabad', 'Ameerpet', 'Khairtabad', 'Maredpally', 'Musheerabad', 'Secunderabad', 'Shaikpet', 'Tirumalgiri',
  ],
  'Jagtial': [
    'Beerpur', 'Buggaram', 'Dharmapuri', 'Gollapalle', 'Jagtial', 'Jagtial Rural', 'Kodimial', 'Mallial', 'Pegadapalle', 'Raikal', 'Sarangapur', 'Velgatoor', 'Ibrahimpatnam', 'Mallapur', 'Metpalli', 'Kathlapur', 'Korutla', 'Medipalle',
  ],
  'Jangaon': [
    'Bachannapeta', 'Devaruppala', 'Jangaon', 'Lingalaghanpur', 'Narmetta', 'Raghunathapalle', 'Tharigoppula', 'Chilpur', 'Kodakandla', 'Palakurthi', 'Station Ghanpur', 'Zaffergadh',
  ],
  'Jayashankar Bhupalpally': [
    'Bhupalpalle', 'Chityal', 'Ghanpur', 'Kataram', 'Mahadevpur', 'Maha Mutharam', 'Malharrao', 'Mogullapalle', 'Palimela', 'Regonda', 'Tekumatla',
  ],
  'Jogulamba Gadwal': [
    'Kaloor Timmanododdi', 'Dharur', 'Gadwal', 'Itikyal', 'Maldakal', 'Ghattu', 'Aiza', 'Rajoli', 'Waddepalle', 'Manopad', 'Undavelli', 'Alampur',
  ],
  'Kamareddy': [
    'Banswada', 'Bichkunda', 'Birkoor', 'Jukkal', 'Madnur', 'Nasurullabad', 'Nizamsagar', 'Pedda Kodapgal', 'Pitlam', 'Dongli', 'Bhiknoor', 'Bibipet', 'Domakonda', 'Kamareddy', 'Machareddy', 'Rajampet', 'Ramareddy', 'Sadasivanagar', 'Tadwai', 'Palvancha', 'Gandhari', 'Lingampet', 'Naga Reddipet', 'Yellareddy',
  ],
  'Karimnagar': [
    'Chigurumamidi', 'Choppadandi', 'Gangadhara', 'Ganneruvaram', 'Karimnagar', 'Karimnagar Rural', 'Kothapally', 'Manakondur', 'Ramadugu', 'Thimmapur', 'Ellandakunta', 'Huzurabad', 'Jammikunta', 'Shankarapatnam', 'V Saidapur', 'Veenavanka',
  ],
  'Khammam': [
    'Enkuru', 'Kalluru', 'Penuballi', 'Sathupalli', 'Thallada', 'Vemsoor', 'Bonakal', 'Chinthakani', 'Kamepalle', 'Khammam (Rural)', 'Khammam (Urban)', 'Konijerla', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapalle', 'Raghunadhapalem', 'Singareni', 'Thirumalayapalem', 'Wyra', 'Yerrupalem',
  ],
  'Kumrambheem Asifabad': [
    'Asifabad', 'Jainoor', 'Kerameri', 'Lingapur', 'Rebbena', 'Sirpur(U)', 'Tiryani', 'Wankidi', 'Bejjur', 'Chintalamanepally', 'Dahegaon', 'Kagaznagar', 'Kouthala', 'Penchikalpet', 'Sirpur(T)',
  ],
  'Mahabubabad': [
    'Bayyaram', 'Dornakal', 'Gangaram', 'Garla', 'Gudur', 'Kesamudram', 'Kothaguda', 'Kuravi', 'Mahabubabad', 'Seerole', 'Inugurthy', 'Chinnagudur', 'Danthalapalle', 'Maripeda', 'Narsimhulapet', 'Nellikudur', 'Peddavangara', 'Thorrur',
  ],
  'Mahabubnagar': [
    'Addakal', 'Balanagar', 'Bhoothpur', 'Chinna Chinthakunta', 'Devarkadara', 'Gandeed', 'Hanwada', 'Jadcherla', 'Koilkonda', 'Mahabubnagar(Rural)', 'Mahabubnagar(Urban)', 'Midjil', 'Mohammadabad', 'Musapet', 'Nawabpet', 'Rajapur',
  ],
  'Mancherial': [
    'Bheemaram', 'Chennur', 'Dandepally', 'Hajipur', 'Jaipur', 'Jannaram', 'Kotapally', 'Luxettipet', 'Mancherial', 'Mandamarri', 'Naspur', 'Bellampally', 'Bheemini', 'Kannepally', 'Kasipet', 'Nennel', 'Tandur', 'Vempally',
  ],
  'Medak': [
    'Alladurg', 'Havelighanpur', 'Medak', 'Nizampet', 'Papannapet', 'Ramayampet', 'Regode', 'Shankarampet(A)', 'Shankarampet(R)', 'Tekmal', 'Chilipched', 'Kowdipalle', 'Kulcharam', 'Narsapur', 'Shivampet', 'Chegunta', 'Manoharabad', 'Masaipet', 'Narsingi', 'Tupran', 'Yeldurthy',
  ],
  'Medchal–Malkajgiri': [
    'Alwal', 'Bachupally', 'Balanagar', 'Dundigal Gandimaisamma', 'Kukatpally', 'Malkajgiri', 'Quthbullapur', 'Ghatkesar', 'Kapra', 'Keesara', 'Medchal', 'Medipally', 'Muduchintalpalli', 'Shamirpet', 'Uppal',
  ],
  'Mulugu': [
    'Eturnagaram', 'Govindaraopet', 'Kannaigudem', 'Mangapet', 'Mulugu', 'Sammakka Saralamma Tadvai', 'Venkatapur', 'Venkatapuram', 'Wazeed',
  ],
  'Nagarkurnool': [
    'Achampet', 'Amrabad', 'Balmoor', 'Lingal', 'Padra', 'Uppunuthala', 'Charakonda', 'Kalwakurthy', 'Urkonda', 'Vangoor', 'Veldanda', 'Kodair', 'Kollapur', 'Peddakothapalle', 'Pentlavelli', 'Bijinapalle', 'Nagarkurnool', 'Tadoor', 'Telkapalle', 'Thimmajipeta',
  ],
  'Nalgonda': [
    'Chandampet', 'Chinthapalle', 'Devarakonda', 'Gundlapalle', 'Gurrampode', 'Kondamallapally', 'Marriguda', 'Nampalle', 'Neredugommu', 'Pedda adiserlapalle', 'Adavi devula palli', 'Anumula Haliya', 'Damaracherla', 'Madugulapally', 'Miryalaguda', 'Nidamanur', 'Peddavoora', 'Thripuraram', 'Tirumalagiri Sagar', 'Vemulapalle', 'Chandur', 'Chityala', 'Kangal', 'Kattangoor', 'Kethepalle', 'Munugode', 'Nakrekal', 'Narketpalle', 'Nalgonda', 'Saligouraram', 'Thipparthi',
  ],
  'Narayanpet': [
    'Damaragidda', 'Dhanwada', 'Gundumal', 'Kosgi', 'Krishna', 'Kotthapally', 'Maddur', 'Maganoor', 'Makthal', 'Marikal', 'Narayanpet', 'Narva', 'Utkoor',
  ],
  'Nirmal': [
    'Basar', 'Bhainsa', 'Kubeer', 'Kuntala', 'Lokeshwaram', 'Mudhole', 'Tanoor', 'Dastuarabad', 'Dilawarpur', 'Kaddampeddur', 'Khanapur', 'Laxmanchanda', 'Mamada', 'Narsapur(G)', 'Nirmal Rural', 'Nirmal Urban', 'Pembi', 'Sarangapur', 'Soan',
  ],
  'Nizamabad': [
    'Aloor', 'Armur', 'Balkonda', 'Bheemgal', 'Donkeshwar', 'Jakranpalle', 'Kammarpalle', 'Mendora', 'Mortad', 'Mupkal', 'Nandipet', 'Vailpur', 'Yergatla', 'Bodhan', 'Chandur', 'Kotgiri', 'Pothangal', 'Mosra', 'Ranjal', 'Rudrur', 'Saloora', 'Varni', 'Yedapalle', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Makloor', 'Mugpal', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Sirkonda',
  ],
  'Peddapalli': [
    'Kamanpur', 'Manthani', 'Mutharam', 'Ramagiri', 'Anthergoan', 'Dharmaram', 'Elgaid', 'Julapalle', 'Palakurthy', 'Peddapalli', 'Ramagundam', 'Srirampur', 'Sultanabad', 'Odela',
  ],
  'Rajanna Sircilla': [
    'Ellanthakunta', 'Gambhiraopeta', 'Mustabad', 'Sircilla', 'Thangallapalle', 'Veernapalle', 'Yellareddypeta', 'Boinpalle', 'Chandurthi', 'Konaraopeta', 'Rudrangi', 'Vemulawada', 'Vemulawada(Rural)',
  ],
  'Rangareddy': [
    'Chevella', 'Moinabad', 'Shabad', 'Shankarpalle', 'Abdullapurmet', 'Hayathnagar', 'Ibrahimpatnam', 'Madgul', 'Manchal', 'Yacharam', 'Amangal', 'Balapur', 'Kadthal', 'Kandukur', 'Maheshwaram', 'Saroornagar', 'Talakonapally', 'Gandipet', 'Rajendranagar', 'Serilingampally', 'Shamshabad', 'Farooqnagar', 'Jilled Chowdergudem', 'Keshampeta', 'Kondurg', 'Kothur', 'Nandigam', 'Shadnagar',
  ],
  'Sangareddy': [
    'Kalher', 'Kangti', 'Manoor', 'Nagilgidda', 'Narayankhed', 'Sirgapoor', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal', 'Raikode', 'Zaheerabad',
  ],
  'Siddipet': [
    'Dubbak', 'Siddipet (Rural)', 'Chinnakodur', 'Nangnoor', 'Siddipet (Urban)', 'Thoguta', 'Mirdoddi', 'Doulthabad', 'Komuravelli', 'Cherial', 'Narayanaraopet', 'Akberpet Bhoompally', 'Raipole', 'Wargal', 'Mulugu', 'Markook', 'Jagdevpur', 'Gajwel', 'Kondapak', 'Kukunoorpally', 'Akkannapet', 'Bejjanki', 'Dhoolmitta', 'Husnabad', 'Koheda', 'Maddur',
  ],
  'Suryapet': [
    'Atmakur(s)', 'Chivvemla', 'Jajireddygudem', 'Maddirala', 'Mothey', 'Nagaram', 'Nuthankal', 'Penpahad', 'Thirumalagiri', 'Thungathurthy', 'Suryapet', 'Ananthagiri', 'Chilkur', 'Kodad', 'Munagala', 'Nadigudem', 'Garidepally', 'Huzurnagar', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Neredcherla', 'Palakeedu',
  ],
  'Vikarabad': [
    'Basheerabad', 'Bommaraspet', 'Doulthabad', 'Kodangal', 'Peddemul', 'Tandur', 'Yelal', 'Bantwaram', 'Doma', 'Dharur', 'Kotepally', 'Kulkacherla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur', 'Vikarabad',
  ],
  'Wanaparthy': [
    'Amarchinta', 'Atmakur', 'Chinnambavi', 'Ghanpur (Khilla)', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Veepanagandla', 'Wanaparthy',
  ],
  'Warangal': [
    'Geesugonda', 'Khila Warangal', 'Parvathagiri', 'Rayaparthy', 'Wardhannapet', 'Warangal', 'Sangem', 'Chennaraopet', 'Duggondi', 'Khanapur', 'Nallabelly', 'Narsampet', 'Nekkonda',
  ],
  'Yadadri Bhuvanagiri': [
    'Addaguduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakondur', 'Mothkur', 'Rajapet', 'Turkapally', 'Yadagirigutta', 'Bhoodan Pochampally', 'Choutuppal', 'Narayanpur', 'Ramannapet', 'Valigonda',
  ],
  'Others': [],
};

export const QUALIFICATION_OPTIONS = [
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
  { label: 'District Agriculture Officer', value: 'District Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Others', value: 'Others' },
];

// Designation options for Seed Sample Drawal (Seed Inspector replaces District Agriculture Officer)
export const SEED_SAMPLE_DRAWAL_DESIGNATION_OPTIONS = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture (R)', value: 'Asst. Director of Agriculture' },
  { label: 'Asst. Director of Agriculture (T)', value: 'Asst. Director of Agriculture (T)' },
  { label: 'Seed Inspector', value: 'Seed Inspector' },
  { label: 'Others', value: 'Others' },
];

// District to Division mapping
export const DISTRICT_DIVISION_MAPPING: Record<string, string[]> = {
  'Adilabad': ['Adilabad Rural', 'Boath', 'Ichoda', 'Tamsi', 'Utnoor'],
  'Bhadradri Kothagudem': ['Aswaraopeta', 'Bhadrachalam', 'Kothagudem', 'Manuguru', 'Yellandu'],
  'Hanamkonda': ['Hanamkonda', 'Parkal'],
  'Jagtial': ['Dharmapuri', 'Jagtial', 'Korutla'],
  'Jangaon': ['Ghanpur Station', 'Jangaon', 'Palakurthi'],
  'Jayashankar Bhupalpally': ['Bhupalpally', 'Mahadevpur'],
  'Jogulamba Gadwal': ['Alampur', 'Gadwal', 'Ieeja'],
  'Kamareddy': ['Banswada', 'Bichkunda', 'Kamareddy', 'Yellareddy'],
  'Karimnagar': ['Choppadandi', 'Huzurabad', 'Karimnagar', 'Manakondur'],
  'Khammam': ['Khammam Urban', 'Kusumanchi', 'Madhira', 'Sathupalle', 'Wyra'],
  'Kumrambheem Asifabad': ['Asifabad', 'Kagaznagar', 'Penchikalpet', 'Sirpur U'],
  'Hyderabad': [],
  'Mahabubabad': ['Mahabubabad', 'Maripeda'],
  'Mahabubnagar': ['Devarkadara', 'Jadcherla', 'Mahabubnagar Rural'],
  'Mancherial': ['Bellampalle', 'Bheemini', 'Chennur', 'Mancherial'],
  'Medak': ['Kowdipalle', 'Medak', 'Narsapur', 'Ramayampet'],
  'Medchal-Malkajgiri': ['Malkajgiri', 'Medchal'],
  'Mulugu': ['Eturnagaram', 'Mulugu'],
  'Nagarkurnool': ['Achampet', 'Kalwakurthy', 'Kollapur', 'Nagarkurnool'],
  'Nalgonda': ['Anumula', 'Devarakonda', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nalgonda'],
  'Narayanpet': ['Kosgi', 'Makthal', 'Narayanpet'],
  'Nirmal': ['Bhainsa', 'Khanapur', 'Mudhole', 'Nirmal'],
  'Nizamabad': ['Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Indalwai', 'Nizamabad Rural', 'Nizamabad South', 'Rudrur'],
  'Peddapalli': ['Manthani', 'Peddapalle', 'Ramagundam'],
  'Rajanna Sircilla': ['Sircilla', 'Vemulawada'],
  'Ranga Reddy': ['Amangal', 'Chevella', 'Ibrahimpatnam', 'Maheshwaram', 'Rajendranagar', 'Shadnagar'],
  'Sangareddy': ['Andole', 'Narayankhed', 'Patancheru', 'Raikode', 'Sangareddy', 'Zahirabad'],
  'Siddipet': ['Cheriyal', 'Dubbak', 'Gajwel', 'Husnabad', 'Mulug', 'Siddipet'],
  'Suryapet': ['Huzurnagar', 'Kodad', 'Suryapet', 'Thungathurthy'],
  'Vikarabad': ['Kodangal', 'Pargi', 'Tandur', 'Vikarabad'],
  'Wanaparthy': ['Kothakota', 'Pangal', 'Wanaparthy'],
  'Warangal': ['Narsampet', 'Wardhannapet'],
  'Yadadri Bhuvanagiri': ['Alair', 'Bhongir', 'Yadagirigutta'],
};

export function getDivisionsForDistrict(district: string): string[] {
  return DISTRICT_DIVISION_MAPPING[district] || [];
}

export function getMandalsForDistrict(district: string): string[] {
  return TELANGANA_DISTRICT_MANDAL_MAPPING[district] || [];
}

// Division to Mandal mapping
export const DIVISION_MANDAL_MAPPING: Record<string, string[]> = {
  // Adilabad District
  'Adilabad Rural': ['Adilabad Rural', 'Bazarhatnoor', 'Bela', 'Gudihathnur', 'Neradigonda', 'Sirikonda', 'Talamadagu'],
  'Boath': ['Boath', 'Gadiguda', 'Inderavelly', 'Narnoor', 'Utnoor'],
  'Ichoda': ['Ichoda', 'Jainad', 'Mavala'],
  'Tamsi': ['Tamsi'],
  'Utnoor': ['Utnoor'],
  
  // Bhadradri Kothagudem District
  'Aswaraopeta': ['Aswaraopeta', 'Aswapuram', 'Chandrugonda', 'Dammapeta', 'Kamepalli', 'Kothagudem', 'Laxmipuram', 'Mulkalapalli', 'Sarapaka', 'Singareni', 'Tirumalayapalem', 'Yerrupalem'],
  'Bhadrachalam': ['Bhadrachalam', 'Burgumpadu', 'Charla', 'Cherla', 'Dummagudem', 'Kannaigudem', 'Koonavaram', 'Mallampalli', 'Manuguru', 'Narsapur', 'Parnasala', 'Rebbana', 'Tekulapalli', 'Temurpuram', 'Vemunuru', 'Venkatapuram', 'Yetapaka'],
  'Kothagudem': ['Kothagudem', 'Palvoncha', 'Sathupalle', 'Tallada', 'Wyra'],
  'Manuguru': ['Manuguru'],
  'Yellandu': ['Yellandu'],
  
  // Hanamkonda District
  'Hanamkonda': ['Hanamkonda', 'Hasanparthy', 'Kazipet', 'Velair'],
  'Parkal': ['Atmakur', 'Damera', 'Nadikuda', 'Parkal', 'Shayampet'],
  
  // Jagtial District
  'Dharmapuri': ['Dharmapuri', 'Gollapalle', 'Sarangapur'],
  'Jagtial': ['Jagtial', 'Jagtial Rural', 'Kodimial', 'Mallial', 'Raikal'],
  'Korutla': ['Ibrahimpatnam', 'Mallapur', 'Metpalli', 'Kathlapur', 'Korutla', 'Medipalle'],
  
  // Jangaon District
  'Ghanpur Station': ['Ghanpur Station', 'Kodakandla', 'Lingalaghanpur', 'Regonda', 'Raghunathpally', 'Zaffergadh'],
  'Jangaon': ['Jangaon', 'Chillakal', 'Devaruppula', 'Kesamudram', 'Lingapur', 'Narmetta', 'Pochannapet', 'Raghunathpally', 'Sangem', 'Yellapur'],
  'Palakurthi': ['Palakurthi', 'Atmakur', 'Bachannapeta', 'Bheemadevarapalli', 'Chityal', 'Dharmasagar', 'Gopalpur', 'Kondapur', 'Maddur', 'Maripeda', 'Mogullapalle', 'Narmetta', 'Palakurthi', 'Raghunathpally', 'Shankarapally', 'Tirumalagiri', 'Vangara', 'Venkatapur'],
  
  // Jayashankar Bhupalpally District
  'Bhupalpally': ['Bhupalpally', 'Bheemaram', 'Chityal', 'Damaragidda', 'Gangadhara', 'Kannala', 'Kataram', 'Kotapalle', 'Mahadevpur', 'Mallapur', 'Moranchapalle', 'Mutharam', 'Narsampet', 'Ramannagudem', 'Sarvaram', 'Shankarapally', 'Venkatapur'],
  'Mahadevpur': ['Mahadevpur', 'Bheemaram', 'Bhupalpally', 'Chityal', 'Damaragidda', 'Gangadhara', 'Kannala', 'Kataram', 'Kotapalle', 'Mallapur', 'Moranchapalle', 'Mutharam', 'Narsampet', 'Ramannagudem', 'Sarvaram', 'Shankarapally', 'Venkatapur'],
  
  // Jogulamba Gadwal District
  'Alampur': ['Alampur', 'Itikyala', 'Kollapur', 'Manopad', 'Pebbair', 'Peddamandadi', 'Wanaparthy'],
  'Gadwal': ['Gadwal', 'Arepalle', 'Ghanpur', 'Ieeja', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Ieeja': ['Ieeja', 'Arepalle', 'Ghanpur', 'Gadwal', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  
  // Kamareddy District
  'Banswada': ['Banswada', 'Bichkunda', 'Kamareddy', 'Yellareddy'],
  'Bichkunda': ['Bichkunda', 'Banswada', 'Kamareddy', 'Yellareddy'],
  'Kamareddy': ['Kamareddy', 'Banswada', 'Bichkunda', 'Yellareddy'],
  'Yellareddy': ['Yellareddy', 'Banswada', 'Bichkunda', 'Kamareddy'],
  
  // Karimnagar District
  'Choppadandi': ['Chigurumamidi', 'Choppadandi', 'Gangadhara'],
  'Huzurabad': ['Ellandakunta', 'Huzurabad', 'Jammikunta', 'Shankarapatnam'],
  'Karimnagar': ['Ganneruvaram', 'Karimnagar', 'Karimnagar Rural', 'Kothapally'],
  'Manakondur': ['Kothapally', 'Manakondur', 'Ramadugu', 'Thimmapur'],
  
  // Khammam District
  'Khammam Urban': ['Khammam', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalle', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Kusumanchi': ['Kusumanchi', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalle', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Madhira': ['Madhira', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalle', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Sathupalle': ['Sathupalle', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Wyra', 'Yerrupalem'],
  'Wyra': ['Wyra', 'Bheemunipatnam', 'Bonakal', 'Chintakani', 'Enkoor', 'Kallur', 'Kamepalli', 'Kusumanchi', 'Madhira', 'Mudigonda', 'Nelakondapally', 'Penuballi', 'Sathupalle', 'Singareni', 'Tirumalayapalem', 'Vemsoor', 'Yerrupalem'],
  
  // Kumrambheem Asifabad District
  'Asifabad': ['Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Penchikalpet', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Kagaznagar': ['Kagaznagar', 'Asifabad', 'Bheemini', 'Kerameri', 'Koutala', 'Nennel', 'Penchikalpet', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Penchikalpet': ['Penchikalpet', 'Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Sirpur U', 'Tiryani', 'Vempalle'],
  'Sirpur U': ['Sirpur U', 'Asifabad', 'Bheemini', 'Kagaznagar', 'Kerameri', 'Koutala', 'Nennel', 'Penchikalpet', 'Tiryani', 'Vempalle'],
  
  // Mahabubabad District
  'Mahabubabad': ['Mahabubabad', 'Bayyaram', 'Dhanwada', 'Garla', 'Gudur', 'Kesamudram', 'Kuravi', 'Maripeda', 'Narsampet', 'PeddaVangara', 'Thorrur'],
  'Maripeda': ['Maripeda', 'Bayyaram', 'Dhanwada', 'Garla', 'Gudur', 'Kesamudram', 'Kuravi', 'Mahabubabad', 'Narsampet', 'PeddaVangara', 'Thorrur'],
  
  // Mahabubnagar District
  'Devarkadara': ['Devarkadara', 'Amarabad', 'Balmoor', 'ChinnaChintakunta', 'Gopalpet', 'Kollapur', 'Kothakota', 'Madanapur', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Jadcherla': ['Jadcherla', 'Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Mahabubnagar Rural': ['Mahabubnagar Rural', 'Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  
  // Mancherial District
  'Bellampalle': ['Bellampalle', 'Bheemini', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Bheemini': ['Bheemini', 'Asifabad', 'Bellampalle', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Chennur': ['Chennur', 'Asifabad', 'Bellampalle', 'Bheemini', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  'Mancherial': ['Mancherial', 'Asifabad', 'Bellampalle', 'Bheemini', 'Chennur', 'Jaipur', 'Kasipet', 'Luxettipet', 'Mandamarri', 'Nennel', 'Sirsilla', 'Tiryani'],
  
  // Medak District
  'Kowdipalle': ['Kowdipalle', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Medak', 'Narsapur', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Medak': ['Medak', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipalle', 'Narsapur', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Narsapur': ['Narsapur', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipalle', 'Medak', 'Papannapet', 'Ramayampet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  'Ramayampet': ['Ramayampet', 'Alladurg', 'Chegunta', 'Hathnoora', 'Kollur', 'Kondapak', 'Kulcharam', 'Kowdipalle', 'Medak', 'Narsapur', 'Papannapet', 'Sangareddy', 'Shankarpally', 'Tekmal', 'Toopran', 'Yeldurthy'],
  
  // Medchal–Malkajgiri District
  'Malkajgiri': ['Malkajgiri', 'Alwal', 'Bachupally', 'Bowrampet', 'Dundigal', 'Ghatkesar', 'Gundlapochampally', 'Jinnaram', 'Kompally', 'Kothapally', 'Medchal', 'Narapally', 'Pocharam', 'Quthbullapur', 'Shamirpet', 'Turkapally'],
  'Medchal': ['Medchal', 'Alwal', 'Bachupally', 'Bowrampet', 'Dundigal', 'Ghatkesar', 'Gundlapochampally', 'Jinnaram', 'Kompally', 'Kothapally', 'Malkajgiri', 'Narapally', 'Pocharam', 'Quthbullapur', 'Shamirpet', 'Turkapally'],
  
  // Mulugu District
  'Eturnagaram': ['Eturnagaram', 'Kannaigudem', 'Kollapur', 'Mallampalli', 'Narsampet', 'Taduvai', 'Tadvai', 'Venkatapur'],
  'Mulugu': ['Mulugu', 'Kannaigudem', 'Kollapur', 'Mallampalli', 'Narsampet', 'Taduvai', 'Tadvai', 'Venkatapur'],
  
  // Nagarkurnool District
  'Achampet': ['Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Kalwakurthy': ['Kalwakurthy', 'Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Kollapur': ['Kollapur', 'Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Nagarkurnool', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  'Nagarkurnool': ['Nagarkurnool', 'Achampet', 'Alampur', 'Amarchinta', 'Atmakur', 'Balanagar', 'Bomraspet', 'ChinnaChintakunta', 'Dharur', 'Ghanpur', 'Itikyala', 'Jadcherla', 'Kalwakurthy', 'Kollapur', 'Kothakota', 'Madanapur', 'Maddur', 'Manopad', 'Pangal', 'Peddamandadi', 'Pebbair', 'Rajoli', 'Undavelli', 'Vijayapura', 'Wanaparthy'],
  
  // Nalgonda District
  'Anumula': ['Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Devarakonda': ['Devarakonda', 'Anumula', 'Chandur', 'Chinthapally', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Miryalaguda': ['Miryalaguda', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Munugode': ['Munugode', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Nakrekal': ['Nakrekal', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nalgonda', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  'Nalgonda': ['Nalgonda', 'Anumula', 'Chandur', 'Chinthapally', 'Devarakonda', 'Gundlapally', 'Kondamallepally', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nampally', 'Narketpally', 'Nidamanur', 'Nuthankal', 'Peddavura', 'Suryapet', 'Thirumalagiri', 'Vemulapally'],
  
  // Narayanpet District
  'Kosgi': ['Kosgi', 'Kollapur', 'Kothakota', 'Makthal', 'Narayanpet', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelli', 'Wanaparthy'],
  'Makthal': ['Makthal', 'Kosgi', 'Kollapur', 'Kothakota', 'Narayanpet', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelli', 'Wanaparthy'],
  'Narayanpet': ['Narayanpet', 'Kosgi', 'Kollapur', 'Kothakota', 'Makthal', 'Pangal', 'Peddamandadi', 'Pebbair', 'Undavelli', 'Wanaparthy'],
  
  // Nirmal District
  'Bhainsa': ['Bhainsa', 'Basar', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeshwaram', 'Mudhole', 'Narsapur(G)', 'Nirmal Rural', 'Nirmal Urban', 'Tanoor'],
  'Khanapur': ['Khanapur', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeshwaram', 'Mudhole', 'Narsapur(G)', 'Nirmal Rural', 'Nirmal Urban', 'Tanoor'],
  'Mudhole': ['Mudhole', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeshwaram', 'Narsapur(G)', 'Nirmal Rural', 'Nirmal Urban', 'Tanoor'],
  'Nirmal': ['Nirmal Rural', 'Nirmal Urban', 'Basar', 'Bhainsa', 'Bheemgal', 'Kubeer', 'Kuntala', 'Lokeshwaram', 'Mudhole', 'Narsapur(G)', 'Tanoor'],
  
  // Nizamabad District
  'Armoor': ['Armoor', 'Aloor', 'Armur', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Balkonda': ['Balkonda', 'Aloor', 'Armoor', 'Armur', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Bheemgal': ['Bheemgal', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Bodhan': ['Bodhan', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bheemgal', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Indalwai': ['Indalwai', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Nizamabad Rural': ['Nizamabad(Rural)', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Nizamabad South': ['Nizamabad(South)', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Pothangal', 'Ranjal', 'Rudrur', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  'Rudrur': ['Rudrur', 'Aloor', 'Armoor', 'Armur', 'Balkonda', 'Bheemgal', 'Bodhan', 'Chandur', 'Dharpalle', 'Dichpalle', 'Indalwai', 'Kammarpalle', 'Kotgiri', 'Makloor', 'Mendora', 'Mortad', 'Mugpal', 'Mupkal', 'Nandipet', 'Navipet', 'Nizamabad(North)', 'Nizamabad(Rural)', 'Nizamabad(South)', 'Pothangal', 'Ranjal', 'Saloora', 'Sirkonda', 'Vailpur', 'Yergatla'],
  
  // Peddapalli District
  'Manthani': ['Manthani', 'Anthergoan', 'Dharmaram', 'Elgaid', 'Julapalle', 'Kamanpur', 'Mutharam', 'Odela', 'Palakurthy', 'Peddapalli', 'Ramagiri', 'Ramagundam', 'Srirampur', 'Sultanabad'],
  'Peddapalle': ['Peddapalli', 'Anthergoan', 'Dharmaram', 'Elgaid', 'Julapalle', 'Kamanpur', 'Manthani', 'Mutharam', 'Odela', 'Palakurthy', 'Ramagiri', 'Ramagundam', 'Srirampur', 'Sultanabad'],
  'Ramagundam': ['Ramagundam', 'Anthergoan', 'Dharmaram', 'Elgaid', 'Julapalle', 'Kamanpur', 'Manthani', 'Mutharam', 'Odela', 'Palakurthy', 'Peddapalli', 'Ramagiri', 'Srirampur', 'Sultanabad'],
  
  // Rajanna Sircilla District
  'Sircilla': ['Sircilla', 'Boinpalle', 'Chandurthi', 'Ellanthakunta', 'Gambhiraopeta', 'Konaraopeta', 'Mustabad', 'Rudrangi', 'Thangallapalle', 'Veernapalle', 'Vemulawada', 'Vemulawada(Rural)', 'Yellareddypeta'],
  'Vemulawada': ['Vemulawada', 'Vemulawada(Rural)', 'Boinpalle', 'Chandurthi', 'Ellanthakunta', 'Gambhiraopeta', 'Konaraopeta', 'Mustabad', 'Rudrangi', 'Sircilla', 'Thangallapalle', 'Veernapalle', 'Yellareddypeta'],
  
  // Ranga Reddy District
  'Amangal': ['Amangal', 'Balapur', 'Kadthal', 'Kandukur', 'Maheshwaram', 'Saroornagar', 'Talakonapally'],
  'Chevella': ['Chevella', 'Moinabad', 'Shabad', 'Shankarpalle'],
  'Ibrahimpatnam': ['Ibrahimpatnam', 'Hayathnagar', 'Madgul', 'Manchal', 'Yacharam'],
  'Maheshwaram': ['Maheshwaram', 'Amangal', 'Balapur', 'Gandipet', 'Kadthal', 'Kandukur', 'Rajendranagar', 'Saroornagar', 'Serilingampally', 'Talakonapally'],
  'Rajendranagar': ['Rajendranagar', 'Gandipet', 'Maheshwaram', 'Serilingampally'],
  'Shadnagar': ['Shadnagar', 'Farooqnagar', 'Jilled Chowdergudem', 'Keshampeta', 'Kondurg', 'Kothur', 'Nandigam'],
  
  // Sangareddy District
  'Andole': ['Andole', 'Ameenpur', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally'],
  'Narayankhed': ['Narayankhed', 'Kalher', 'Kangti', 'Manoor', 'Nagilgidda', 'Sirgapoor'],
  'Patancheru': ['Patancheru', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Sangareddy', 'Vatpally'],
  'Raikode': ['Raikode', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal'],
  'Sangareddy': ['Sangareddy', 'Ameenpur', 'Andole', 'Gummadidala', 'Hathnoora', 'Jinnaram', 'Kandi', 'Kondapur', 'Munipally', 'Patancheru', 'Pulkal', 'Ramchandrapuram', 'Sadasivpet', 'Vatpally'],
  'Zahirabad': ['Zahirabad', 'Jharasangam', 'Kohir', 'Mogudampally', 'Nyalkal', 'Raikode'],
  
  // Siddipet District
  'Cheriyal': ['Cheriyal', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Mulug', 'Nangnoor', 'Siddipet (Rural)', 'Siddipet (Urban)', 'Thoguta', 'Wargal'],
  'Dubbak': ['Dubbak', 'Cheriyal', 'Chinnakodur', 'Gajwel', 'Husnabad', 'Mulug', 'Nangnoor', 'Siddipet (Rural)', 'Siddipet (Urban)', 'Thoguta', 'Wargal'],
  'Gajwel': ['Gajwel', 'Cheriyal', 'Chinnakodur', 'Dubbak', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Siddipet (Rural)', 'Siddipet (Urban)', 'Thoguta', 'Wargal'],
  'Husnabad': ['Husnabad', 'Cheriyal', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Siddipet (Rural)', 'Siddipet (Urban)', 'Thoguta', 'Wargal'],
  'Mulug': ['Mulug', 'Cheriyal', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Nangnoor', 'Siddipet (Rural)', 'Siddipet (Urban)', 'Thoguta', 'Wargal'],
  'Siddipet': ['Siddipet (Rural)', 'Siddipet (Urban)', 'Cheriyal', 'Chinnakodur', 'Dubbak', 'Gajwel', 'Husnabad', 'Kondapak', 'Kukunoorpally', 'Mulug', 'Nangnoor', 'Thoguta', 'Wargal'],
  
  // Suryapet District
  'Huzurnagar': ['Huzurnagar', 'Ananthagiri', 'Chilkur', 'Garidepally', 'Kodad', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Munagala', 'Nadigudem', 'Neredcherla', 'Palakeedu'],
  'Kodad': ['Kodad', 'Ananthagiri', 'Chilkur', 'Garidepally', 'Huzurnagar', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Munagala', 'Nadigudem', 'Neredcherla', 'Palakeedu'],
  'Suryapet': ['Suryapet', 'Atmakur(s)', 'Chivvemla', 'Garidepally', 'Huzurnagar', 'Jajireddygudem', 'Kodad', 'Maddirala', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Mothey', 'Munagala', 'Nadigudem', 'Nagaram', 'Neredcherla', 'Nuthankal', 'Palakeedu', 'Penpahad', 'Thirumalagiri', 'Thungathurthy'],
  'Thungathurthy': ['Thungathurthy', 'Atmakur(s)', 'Chivvemla', 'Garidepally', 'Huzurnagar', 'Jajireddygudem', 'Kodad', 'Maddirala', 'Mallareddygudem', 'Mattampally', 'Mellachervu', 'Mothey', 'Munagala', 'Nadigudem', 'Nagaram', 'Neredcherla', 'Nuthankal', 'Palakeedu', 'Penpahad', 'Suryapet', 'Thirumalagiri'],
  
  // Vikarabad District
  'Kodangal': ['Kodangal', 'Basheerabad', 'Bommaraspet', 'Dharur', 'Kotepally', 'Kulkacherla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur'],
  'Pargi': ['Pargi', 'Basheerabad', 'Bommaraspet', 'Dharur', 'Kodangal', 'Kotepally', 'Kulkacherla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pudur'],
  'Tandur': ['Tandur', 'Basheerabad', 'Bommaraspet', 'Doulthabad', 'Kodangal', 'Peddemul', 'Yelal'],
  'Vikarabad': ['Vikarabad', 'Bantwaram', 'Doma', 'Dharur', 'Kotepally', 'Kulkacherla', 'Marpalle', 'Mominpet', 'Nawabpet', 'Pargi', 'Pudur'],
  
  // Wanaparthy District
  'Kothakota': ['Kothakota', 'Amarchinta', 'Atmakur', 'Chinnambavi', 'Ghanpur (Khilla)', 'Gopalpeta', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Veepanagandla', 'Wanaparthy'],
  'Pangal': ['Pangal', 'Amarchinta', 'Atmakur', 'Chinnambavi', 'Ghanpur (Khilla)', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Veepanagandla', 'Wanaparthy'],
  'Wanaparthy': ['Wanaparthy', 'Amarchinta', 'Atmakur', 'Chinnambavi', 'Ghanpur (Khilla)', 'Gopalpeta', 'Kothakota', 'Madanapur', 'Pangal', 'Pebbair', 'Peddamandadi', 'Revally', 'Srirangapur', 'Veepanagandla'],
  
  // Warangal District
  'Narsampet': ['Narsampet', 'Chennaraopet', 'Duggondi', 'Geesugonda', 'Khila Warangal', 'Khanapur', 'Nallabelly', 'Nekkonda', 'Parvathagiri', 'Rayaparthy', 'Sangem', 'Wardhannapet', 'Warangal'],
  'Wardhannapet': ['Wardhannapet', 'Chennaraopet', 'Duggondi', 'Geesugonda', 'Khila Warangal', 'Khanapur', 'Nallabelly', 'Narsampet', 'Nekkonda', 'Parvathagiri', 'Rayaparthy', 'Sangem', 'Warangal'],
  
  // Yadadri Bhuvanagiri District
  'Alair': ['Alair', 'Addaguduru', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakondur', 'Mothkur', 'Rajapet', 'Turkapally', 'Yadagirigutta'],
  'Bhongir': ['Bhongir', 'Addaguduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bommalaramaram', 'Gundala', 'Motakondur', 'Mothkur', 'Rajapet', 'Turkapally', 'Yadagirigutta'],
  'Yadagirigutta': ['Yadagirigutta', 'Addaguduru', 'Alair', 'Atmakur (M)', 'Bibinagar', 'Bhongir', 'Bommalaramaram', 'Gundala', 'Motakondur', 'Mothkur', 'Rajapet', 'Turkapally'],
};

export function getMandalsForDivision(division: string): string[] {
  return DIVISION_MANDAL_MAPPING[division] || [];
}

export function isValidDistrictMandalPair(district: string, mandal: string): boolean {
  if (district === 'Others') return true;
  const mandals = getMandalsForDistrict(district);
  return mandals.includes(mandal);
}
