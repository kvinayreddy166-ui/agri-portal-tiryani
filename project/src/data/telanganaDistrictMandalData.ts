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
  'Others',
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
    'Bayyaram', 'Dornakal', 'Ganagavaram', 'Garla', 'Gudur', 'Kesamudram', 'Kothaguda', 'Kuravi', 'Mahabubabad', 'Seerole', 'Inugurthy', 'Chinnagudur', 'Danthalapalle', 'Maripeda', 'Narsimhulapet', 'Nellikudur', 'Peddavangara', 'Thorrur',
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
  'Medchal-Malkajgiri': [
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
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Insecticide Inspector', value: 'Insecticide Inspector' },
];

export const SEED_DESIGNATION_OPTIONS = [
  { label: 'Mandal Agriculture Officer', value: 'Mandal Agriculture Officer' },
  { label: 'Asst. Director of Agriculture', value: 'Asst. Director of Agriculture' },
  { label: 'Seed Inspector', value: 'Seed Inspector' },
];

export function getMandalsForDistrict(district: string): string[] {
  return TELANGANA_DISTRICT_MANDAL_MAPPING[district] || [];
}

export function isValidDistrictMandalPair(district: string, mandal: string): boolean {
  if (district === 'Others') return true;
  const mandals = getMandalsForDistrict(district);
  return mandals.includes(mandal);
}
