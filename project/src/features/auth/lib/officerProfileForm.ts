// Shared option lists and field-visibility rules for officer profile
// forms (signup + settings edit). District names match the values stored
// in officer_profiles at registration.

export const OFFICER_DISTRICTS = [
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
  'Kumuram Bheem Asifabad',
  'Mahabubabad',
  'Mahabubnagar',
  'Mancherial',
  'Medak',
  'Medchal-Malkajgiri',
  'Mulugu',
  'Nagarkurnool',
  'Nalgonda',
  'Narayanpet',
  'Nirmal',
  'Nizamabad',
  'Peddapalli',
  'Rajanna Sircilla',
  'Rangareddy',
  'Sangareddy',
  'Siddipet',
  'Suryapet',
  'Vikarabad',
  'Wanaparthy',
  'Warangal',
  'Yadadri Bhuvanagiri',
];

export const OFFICER_DISTRICT_TO_MANDAL_KEY: Record<string, string> = {
  'Hanamakonda': 'Hanamkonda',
  'Kumuram Bheem Asifabad': 'Kumrambheem Asifabad',
  'Medchal-Malkajgiri': 'Medchal–Malkajgiri',
  'Rangareddy': 'Ranga Reddy',
};

export const OFFICER_DESIGNATION_OPTIONS = [
  { value: 'AEO', label: 'AEO (Agricultural Extension Officer)' },
  { value: 'MAO', label: 'MAO (Mandal Agriculture Officer)' },
  { value: 'ADA', label: 'ADA (Assistant Director of Agriculture)' },
  { value: 'DAO', label: 'DAO (District Agriculture Officer)' },
  { value: 'DNO', label: 'DNO (District Nodal Officer)' },
];

// ADA is division-level: no mandal. DAO/DNO are district-level: district only.
export function officerShowsMandal(designation: string): boolean {
  return !['ADA', 'DAO', 'DNO'].includes(designation);
}

export function officerShowsDivision(designation: string): boolean {
  return !['DAO', 'DNO'].includes(designation);
}
