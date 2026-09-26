export const ASSISTANT_DIRECTOR_DESIGNATION = 'Asst. Director of Agriculture';
export const ASSISTANT_DIRECTOR_DESIGNATION_T = 'Asst. Director of Agriculture (T)';
export const ASSISTANT_DIRECTOR_T_OFFICE_DEFAULT = 'O/o District Agriculture Officer';

export function isAssistantDirectorOfAgricultureT(designation: string): boolean {
  return designation === ASSISTANT_DIRECTOR_DESIGNATION_T;
}

export function isAssistantDirectorOfAgriculture(designation: string): boolean {
  return designation === ASSISTANT_DIRECTOR_DESIGNATION || designation === 'Assistant Director of Agriculture' || isAssistantDirectorOfAgricultureT(designation);
}

// Display text used in statutory form PDFs for the existing ADA designation
export const ASSISTANT_DIRECTOR_DESIGNATION_DISPLAY = 'Asst. Director of Agriculture (R)';

export function statutoryDesignationDisplay(designation: string): string {
  return isAssistantDirectorOfAgriculture(designation) && !isAssistantDirectorOfAgricultureT(designation)
    ? ASSISTANT_DIRECTOR_DESIGNATION_DISPLAY
    : designation;
}

export function withOthersOption(options: { label: string; value: string }[]): { label: string; value: string }[] {
  return options.some((option) => option.value === 'Others')
    ? options
    : [...options, { label: 'Others', value: 'Others' }];
}

export function effectiveLocationValue(selectedValue: string, customValue: string): string {
  return (selectedValue === 'Others' ? customValue : selectedValue).trim();
}

export function getAssistantDirectorLocationError(values: {
  designation: string;
  district: string;
  manualDistrict: string;
  division?: string;
  manualDivision: string;
  office?: string;
  placeOfCollection?: string;
  placeOfCollectionMandal?: string;
  sampleDrawingMandal?: string;
  manualPlaceOfCollection: string;
  mandal?: string;
  manualMandal?: string;
}): string | null {
  // Validation for District = Others for all designations
  if (values.district === 'Others' && !values.manualDistrict.trim()) return 'Please enter DISTRICT NAME.';
  
  // Validation for Mandal = Others for non-ADA designations
  if (!isAssistantDirectorOfAgriculture(values.designation) && values.mandal === 'Others' && !values.manualMandal?.trim()) return 'Please enter MANDAL NAME.';
  
  if (!isAssistantDirectorOfAgriculture(values.designation)) return null;
  if (isAssistantDirectorOfAgricultureT(values.designation)) {
    if (!values.office?.trim()) return 'Please enter OFFICE.';
  } else if (!values.manualDivision.trim()) {
    return 'Please enter DIVISION NAME.';
  }
  const mandalField = values.placeOfCollectionMandal ?? values.sampleDrawingMandal ?? values.placeOfCollection;
  if (mandalField === 'Others' && !values.manualPlaceOfCollection.trim()) {
    return 'Please enter PLACE OF COLLECTION / MANDAL NAME.';
  }
  return null;
}
