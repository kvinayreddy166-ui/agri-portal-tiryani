export interface TourDiary {
  id: string;
  officer_id: string;
  year: number;
  month: number;
  opening_meter: number;
  closing_meter: number | null;
  total_km: number;
  status: string;
  officer_name?: string;
  designation?: string;
  district?: string;
  mandal?: string;
}

export interface TourDiaryDraft {
  version: number;
  id: string;
  officerName: string;
  designation: string;
  customDesignation?: string;
  district: string;
  customDistrict?: string;
  mandal: string;
  customMandal?: string;
  division: string;
  customDivision?: string;
  month: number;
  year: number;
  journeys: TourJourney[];
  dateStatusOverrides?: Record<string, DateStatusOverride>;
  openingMeter: number;
  closingMeter: number | null;
  totalKm: number;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  dateRemarks?: Record<string, string>;
}

export interface TourJourney {
  id: string;
  tour_diary_id: string;
  officer_id: string;
  journey_date: string;
  from_place: string;
  to_place: string;
  time_from: string;
  time_to: string;
  mode: string;
  custom_mode_of_journey: string | null;
  meter_from: number;
  distance_km: number;
  meter_to: number;
  purposes: string[];
  custom_purpose: string | null;
  remarks: string | null;
}

export type HolidayType = 'GENERAL' | 'OPTIONAL';
export type DateStatusOverrideType = 'WORKING' | HolidayType;
export type LeaveType = 'NONE' | 'NORMAL_LEAVE' | 'OPTIONAL_HOLIDAY' | 'OPTIONAL_HOLIDAY_LEAVE';
export type SpecialDateStatusType = 'holiday' | 'sunday' | 'secondSaturday' | 'optionalHoliday' | 'leave';

export interface Holiday {
  id: string;
  year: number;
  date: string; // DD-MM-YYYY
  holiday_name: string;
  holiday_type: HolidayType;
}

export interface DateStatusOverride {
  status: DateStatusOverrideType;
  holiday_name: string;
  holiday_type: HolidayType;
  leave_type?: LeaveType;
}

export interface SpecialDateStatus {
  type: SpecialDateStatusType;
  label: string;
}

export interface OfficerInfo {
  name: string;
  designation: string;
  office: string;
  mandal: string;
  division: string;
  district: string;
}

export interface MonthlySummary {
  totalDays: number;
  workingDays: number;
  tourDays: number;
  totalDistance: number;
  closingMeter: number;
  openingMeter: number;
  villagesVisited: number;
  sundays: number;
  secondSaturdays: number;
  governmentHolidays: number;
  optionalHolidays: number;
  optionalHolidaysAvailed: number;
  leavesAvailed: number;
  isReconciled: boolean;
}

export interface TourDiaryHeaderDetails {
  designation: string;
  mandal: string;
  division: string;
  district: string;
  showMandal: boolean;
  showDivision: boolean;
}
