import type { Holiday, HolidayType, LeaveType, SpecialDateStatus } from '../types/tourDiaryTypes';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const RECOVERY_STORAGE_KEY = 'tourDiaryRecovery';
export const DRAFT_VERSION = 1;
export const TOUR_DIARY_COLUMN_COUNT = 10;

export const JOURNEY_MODES = [
  'Car', 'Govt. Vehicle', 'Hired Vehicle', 'Bus', 'Others'
];

export const PURPOSES = [
  'ADA Review Meeting', 'Aspirational Block Meeting', 'ATMA Demonstrations', 'ATMA Training Programme',
  'Awareness Meeting on Paddy Fine Varieties', 'Awareness Meeting on Pesticide Usage', 'Cheyutha Pension Verification', 'Collector Review Meeting',
  'Crop Booking Enhancement', 'Crop Cutting Experiments', 'DAO Review Meeting', 'DCS Monitoring',
  'Departmental Work', 'Drone Spray Demonstration', 'Farmer Field Visit', 'Farm Pond Visit',
  'Farm School Trainings', 'FFS App Awareness', 'Field Inspection', 'Fertilizer Distribution Monitoring',
  'FIVES', 'Government Programme', 'GT Points Collection', 'Indiramma Illu Verification',
  'Input Dealer Shop Inspection', 'Kisan Mela', 'License Verification', 'MCP Awareness Programme',
  'MCP HDPS Training', 'NMNF Awareness Programme', 'NFSM Demonstration', 'Office Work',
  'Oil Palm Extension Awareness', 'Official Departmental Training', 'Orientation Programme',
  'Paddy Procurement Center Visit', 'Pest & Disease Surveillance', 'PM Kisan Beneficiary Verification',
  'Prajavani Grievance', 'Rythu Nestham VC', 'Sample Collection', 'Video Conference on Govt Schemes',
  'Attending Quality Control Cases at District Court', 'Additional duties assigned by other Depts',
  'Others'
];

// 2026 Holidays Data
export const HOLIDAYS_2026: Omit<Holiday, 'id'>[] = [
  // General Holidays
  { year: 2026, date: '14-01-2026', holiday_name: 'Bhogi', holiday_type: 'GENERAL' },
  { year: 2026, date: '15-01-2026', holiday_name: 'Sankranti / Pongal', holiday_type: 'GENERAL' },
  { year: 2026, date: '26-01-2026', holiday_name: 'Republic Day', holiday_type: 'GENERAL' },
  { year: 2026, date: '15-02-2026', holiday_name: 'Maha Shivaratri', holiday_type: 'GENERAL' },
  { year: 2026, date: '03-03-2026', holiday_name: 'Holi', holiday_type: 'GENERAL' },
  { year: 2026, date: '19-03-2026', holiday_name: 'Ugadi', holiday_type: 'GENERAL' },
  { year: 2026, date: '21-03-2026', holiday_name: 'Eid-ul-Fitr (Ramzan)', holiday_type: 'GENERAL' },
  { year: 2026, date: '22-03-2026', holiday_name: 'Following Day of Ramzan', holiday_type: 'GENERAL' },
  { year: 2026, date: '27-03-2026', holiday_name: 'Sri Rama Navami', holiday_type: 'GENERAL' },
  { year: 2026, date: '03-04-2026', holiday_name: 'Good Friday', holiday_type: 'GENERAL' },
  { year: 2026, date: '05-04-2026', holiday_name: "Babu Jagjivan Ram's Birthday", holiday_type: 'GENERAL' },
  { year: 2026, date: '14-04-2026', holiday_name: "Dr. B.R. Ambedkar's Birthday", holiday_type: 'GENERAL' },
  { year: 2026, date: '27-05-2026', holiday_name: 'Eid-ul-Azha (Bakrid)', holiday_type: 'GENERAL' },
  { year: 2026, date: '26-06-2026', holiday_name: 'Shahadat Imam Hussain (R.A.) / 10th Moharram', holiday_type: 'GENERAL' },
  { year: 2026, date: '10-08-2026', holiday_name: 'Bonalu', holiday_type: 'GENERAL' },
  { year: 2026, date: '15-08-2026', holiday_name: 'Independence Day', holiday_type: 'GENERAL' },
  { year: 2026, date: '26-08-2026', holiday_name: 'Eid Milad-un-Nabi', holiday_type: 'GENERAL' },
  { year: 2026, date: '04-09-2026', holiday_name: 'Sri Krishna Ashtami', holiday_type: 'GENERAL' },
  { year: 2026, date: '14-09-2026', holiday_name: 'Vinayaka Chavithi', holiday_type: 'GENERAL' },
  { year: 2026, date: '02-10-2026', holiday_name: 'Mahatma Gandhi Jayanthi', holiday_type: 'GENERAL' },
  { year: 2026, date: '18-10-2026', holiday_name: 'Saddula Bathukamma', holiday_type: 'GENERAL' },
  { year: 2026, date: '20-10-2026', holiday_name: 'Vijaya Dasami / Dussehra', holiday_type: 'GENERAL' },
  { year: 2026, date: '21-10-2026', holiday_name: 'Following Day of Vijaya Dasami', holiday_type: 'GENERAL' },
  { year: 2026, date: '08-11-2026', holiday_name: 'Deepavali', holiday_type: 'GENERAL' },
  { year: 2026, date: '24-11-2026', holiday_name: "Karthika Purnima / Guru Nanak's Jayanthi", holiday_type: 'GENERAL' },
  { year: 2026, date: '25-12-2026', holiday_name: 'Christmas', holiday_type: 'GENERAL' },
  { year: 2026, date: '26-12-2026', holiday_name: 'Following Day of Christmas / Boxing Day', holiday_type: 'GENERAL' },
  // Optional Holidays
  { year: 2026, date: '01-01-2026', holiday_name: 'New Year Day', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '03-01-2026', holiday_name: 'Birthday of Hazrath Ali (R.A.)', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '16-01-2026', holiday_name: 'Kanumu', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '17-01-2026', holiday_name: 'Shab-e-Meraj', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '23-01-2026', holiday_name: 'Sri Panchami', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '04-02-2026', holiday_name: 'Shab-e-Barat', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '10-03-2026', holiday_name: 'Shahadat Hzt Ali (R.A.)', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '13-03-2026', holiday_name: 'Jumaatul Wada', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '17-03-2026', holiday_name: 'Shab-e-Qader', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '31-03-2026', holiday_name: 'Mahaveer Jayanthi', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '14-04-2026', holiday_name: "Tamil New Year's Day", holiday_type: 'OPTIONAL' },
  { year: 2026, date: '20-04-2026', holiday_name: 'Basava Jayanthi', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '01-05-2026', holiday_name: 'Buddha Purnima', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '04-06-2026', holiday_name: 'Eid-e-Ghadeer', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '25-06-2026', holiday_name: '9th Moharram', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '16-07-2026', holiday_name: 'Ratha Yathra', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '04-08-2026', holiday_name: 'Arbayeen', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '15-08-2026', holiday_name: "Parsi New Year's Day", holiday_type: 'OPTIONAL' },
  { year: 2026, date: '21-08-2026', holiday_name: 'Varalakshmi Vratham', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '28-08-2026', holiday_name: 'Sravana Purnima / Rakhi Purnima', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '23-09-2026', holiday_name: 'Yazdahum Shareef', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '19-10-2026', holiday_name: 'Maharnavami', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '26-10-2026', holiday_name: "Birthday of Hzt. Syed Mohammed Juvanpuri Mahdi Ma'ud (A.S.)", holiday_type: 'OPTIONAL' },
  { year: 2026, date: '08-11-2026', holiday_name: 'Naraka Chaturdhi', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '24-12-2026', holiday_name: 'Christmas Eve', holiday_type: 'OPTIONAL' },
  { year: 2026, date: '26-12-2026', holiday_name: 'Birthday of Hazrath Ali', holiday_type: 'OPTIONAL' }
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDayName(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function isSunday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
}

export function isTuesday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 2;
}

export function isSecondSaturday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  if (date.getDay() !== 6) return false;
  return day >= 8 && day <= 14;
}

export function formatDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

export function displayDateToHolidayDate(date: string): string {
  const [day, month, year] = date.split('-');
  return `${year}-${month}-${day}`;
}

export function getHolidayTypeLabel(type: HolidayType): string {
  return type === 'GENERAL' ? 'General Holiday' : 'Optional Holiday';
}

export function groupHolidaysByDate(calendar: Holiday[]): Map<string, Holiday[]> {
  const holidaysByDate = new Map<string, Holiday[]>();
  calendar.forEach((holiday) => {
    const existing = holidaysByDate.get(holiday.date) || [];
    holidaysByDate.set(holiday.date, [...existing, holiday]);
  });
  return holidaysByDate;
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export function resolveSpecialDateStatus(params: {
  year: number;
  month: number;
  day: number;
  leaveType: LeaveType;
  displayedHolidays: Holiday[];
}): SpecialDateStatus | null {
  const { year, month, day, leaveType, displayedHolidays } = params;

  if (leaveType === 'NORMAL_LEAVE' || leaveType === 'OPTIONAL_HOLIDAY_LEAVE') {
    return { type: 'leave', label: 'Leave' };
  }

  if (leaveType === 'OPTIONAL_HOLIDAY') {
    const optionalHoliday = displayedHolidays.find((h) => h.holiday_type === 'OPTIONAL');
    return {
      type: 'optionalHoliday',
      label: `Optional Holiday – ${optionalHoliday?.holiday_name || 'Optional Holiday'}`
    };
  }

  const generalHoliday = displayedHolidays.find((h) => h.holiday_type === 'GENERAL');
  if (generalHoliday) {
    return { type: 'holiday', label: `Holiday – ${generalHoliday.holiday_name}` };
  }

  if (isSunday(year, month, day)) {
    return { type: 'sunday', label: 'Sunday' };
  }

  if (isSecondSaturday(year, month, day)) {
    return { type: 'secondSaturday', label: '2nd Saturday' };
  }

  return null;
}

