import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { Plus, FileText, Table, Edit, Trash2, ChevronLeft, ChevronRight, Car, AlertCircle, CheckCircle, RefreshCw, Eye, NotebookPen, MoreVertical, FolderOpen, Clock, ChevronRight as ArrowRight, Copy, Check, X, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TELANGANA_DISTRICTS, getMandalsForDistrict, SEED_DESIGNATION_OPTIONS, getDivisionsForDistrict } from '../data/telanganaDistrictMandalData';
import { saveDiaryPdf, hasDiaryPdf, getAllDiaryPdfs, deleteDiaryPdf, renameDiaryPdf, getDiaryPdf, formatFileSize, DiaryPdfMetadata } from '../lib/diaryPdfStorage';
import { saveDiary, getAllSavedDiaries, getSavedDiary, deleteSavedDiary, SavedDiaryRecord, saveDraft as saveDraftToIndexedDB, getAllDrafts as getAllDraftsFromIndexedDB, getDraft as getDraftFromIndexedDB, deleteDraft as deleteDraftFromIndexedDB, DraftRecord } from '../lib/diaryStorage';

// Types
interface TourDiary {
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

interface TourDiaryDraft {
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
  createdAt: string;
  updatedAt: string;
}

interface TourJourney {
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
  purpose: string;
  custom_purpose: string | null;
  remarks: string | null;
}

type HolidayType = 'GENERAL' | 'OPTIONAL';
type DateStatusOverrideType = 'WORKING' | HolidayType;
type LeaveType = 'NONE' | 'NORMAL_LEAVE' | 'OPTIONAL_HOLIDAY' | 'OPTIONAL_HOLIDAY_LEAVE';
type SpecialDateStatusType = 'holiday' | 'sunday' | 'secondSaturday' | 'optionalHoliday' | 'leave';

interface Holiday {
  id: string;
  year: number;
  date: string; // DD-MM-YYYY
  holiday_name: string;
  holiday_type: HolidayType;
}

interface DateStatusOverride {
  status: DateStatusOverrideType;
  holiday_name: string;
  holiday_type: HolidayType;
  leave_type?: LeaveType;
}

interface SpecialDateStatus {
  type: SpecialDateStatusType;
  label: string;
}

interface OfficerInfo {
  name: string;
  designation: string;
  office: string;
  mandal: string;
  division: string;
  district: string;
}

// Constants
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DRAFT_STORAGE_KEY = 'tourDiaryDrafts';
const RECOVERY_STORAGE_KEY = 'tourDiaryRecovery';
const DRAFT_VERSION = 1;
const TOUR_DIARY_COLUMN_COUNT = 10;

const JOURNEY_MODES = [
  'Car', 'Govt. Vehicle', 'Hired Vehicle', 'Bus', 'Others'
];

const PURPOSES = [
  'FIVES', 'Crop Booking Enhancement', 'Rythu Nestham VC', 'Field Inspection',
  'Pest & Disease Surveillance', 'Farmer Field Visit', 'Input Dealer Shop Inspection',
  'License Verification', 'Sample Collection', 'Meeting', 'NMNF Awareness Programme',
  'Government Programme', 'Review Meeting', 'Office Work', 'Orientation Programme', 'Others'
];

// 2026 Holidays Data
const HOLIDAYS_2026: Omit<Holiday, 'id'>[] = [
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

const holidayCalendars: Record<number, Omit<Holiday, 'id'>[]> = {
  2026: HOLIDAYS_2026
};

// Helper Functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayName(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function isSunday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
}

function isTuesday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 2;
}

function isSecondSaturday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  if (date.getDay() !== 6) return false; // Not a Saturday
  
  // Check if it's the second Saturday (day 8-14)
  return day >= 8 && day <= 14;
}

function formatDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

function formatHolidayDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function displayDateToHolidayDate(date: string): string {
  const [day, month, year] = date.split('-');
  return `${year}-${month}-${day}`;
}

function getHolidayTypeLabel(type: HolidayType): string {
  return type === 'GENERAL' ? 'General Holiday' : 'Optional Holiday';
}

function groupHolidaysByDate(calendar: Holiday[]): Map<string, Holiday[]> {
  const holidaysByDate = new Map<string, Holiday[]>();
  calendar.forEach((holiday) => {
    const existing = holidaysByDate.get(holiday.date) || [];
    holidaysByDate.set(holiday.date, [...existing, holiday]);
  });
  return holidaysByDate;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatOptionalTime(time?: string | null): string {
  return time ? formatTime(time) : '';
}

function formatOptionalNumber(value?: number | null): string {
  return value === null || value === undefined || Number.isNaN(value) ? '' : value.toFixed(0);
}

// Draft Helper Functions
function normalizeOfficerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function generateDraftId(officerName: string, year: number, month: number): string {
  return `${normalizeOfficerName(officerName)}__${year}-${String(month).padStart(2, '0')}`;
}

function getDrafts(): TourDiaryDraft[] {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return [];
    const drafts = JSON.parse(stored);
    return Array.isArray(drafts) ? drafts : [];
  } catch (error) {
    console.error('Error reading drafts from localStorage:', error);
    return [];
  }
}

function saveDrafts(drafts: TourDiaryDraft[]): boolean {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch (error) {
    console.error('Error saving drafts到 localStorage:', error);
    return false;
  }
}

function getRecoveryState(): TourDiaryDraft | null {
  try {
    const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading recovery state:', error);
    return null;
  }
}

function saveRecoveryState(draft: TourDiaryDraft): boolean {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error('Error saving recovery state:', error);
    return false;
  }
}

function clearRecoveryState(): void {
  try {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recovery state:', error);
  }
}

export function TourDiary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [tourDiary, setTourDiary] = useState<TourDiary | null>(null);
  const [journeys, setJourneys] = useState<TourJourney[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dateStatusOverrides, setDateStatusOverrides] = useState<Record<string, DateStatusOverride>>({});
  const [officerInfo, setOfficerInfo] = useState<OfficerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJourneyForm, setShowJourneyForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingJourney, setEditingJourney] = useState<TourJourney | null>(null);
  
  // Officer details state
  const [officerName, setOfficerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [customDesignation, setCustomDesignation] = useState('');
  const [district, setDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [customMandal, setCustomMandal] = useState('');
  const [division, setDivision] = useState('');
  const [customDivision, setCustomDivision] = useState('');
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editablePreviewData, setEditablePreviewData] = useState<any[]>([]);
  
  // Draft state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>('');
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<TourDiaryDraft | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showOptionalHolidayConfirm, setShowOptionalHolidayConfirm] = useState(false);
  const [pendingLeaveDate, setPendingLeaveDate] = useState<string | null>(null);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState<string | null>(null);
  const [dateRemarks, setDateRemarks] = useState<Record<string, string>>({});
  
  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [draftMenuOpen, setDraftMenuOpen] = useState<string | null>(null);
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [allDrafts, setAllDrafts] = useState<TourDiaryDraft[]>([]);
  const [savedDiaries, setSavedDiaries] = useState<SavedDiaryRecord[]>([]);
  const [completedDiaries, setCompletedDiaries] = useState<TourDiary[]>([]);
  const [storedPdfs, setStoredPdfs] = useState<DiaryPdfMetadata[]>([]);
  const [pdfMenuOpen, setPdfMenuOpen] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [showMyDiariesDropdown, setShowMyDiariesDropdown] = useState(false);
  
  // Form state
  const holidaysByDate = useMemo(() => groupHolidaysByDate(holidays), [holidays]);

  const [formData, setFormData] = useState({
    journey_date: '',
    from_place: '',
    to_place: '',
    time_from: '09:00',
    time_to: '17:30',
    mode: 'Car',
    custom_mode_of_journey: '',
    meter_from: 0,
    distance_km: 0,
    meter_to: 0,
    purpose: '',
    custom_purpose: '',
    remarks: ''
  });

  // Load all data with proper loading state management
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadJourneys(),
        loadHolidays()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, user]);

  // Load all drafts from IndexedDB
  const loadAllDrafts = useCallback(async () => {
    try {
      const indexedDbDrafts = await getAllDraftsFromIndexedDB();
      // Convert DraftRecord to TourDiaryDraft format
      const tourDrafts: TourDiaryDraft[] = indexedDbDrafts.map(draft => ({
        version: DRAFT_VERSION,
        id: draft.id,
        officerName: draft.officer_name || '',
        designation: draft.designation || '',
        district: draft.district || '',
        mandal: draft.mandal || '',
        year: draft.year,
        month: draft.month,
        openingMeter: draft.opening_meter,
        journeys: draft.journeys,
        dateStatusOverrides: draft.dateStatusOverrides || {},
        dateRemarks: draft.dateRemarks || {},
        updatedAt: draft.updatedAt
      }));
      setAllDrafts(tourDrafts);
      return tourDrafts;
    } catch (error) {
      console.error('Error loading drafts from IndexedDB:', error);
      return [];
    }
  }, []);

  // Get the latest draft only for Continue Draft card
  const getLatestDraft = useCallback((): TourDiaryDraft | null => {
    return allDrafts.length > 0 ? allDrafts[0] : null;
  }, [allDrafts]);

  // Load completed diaries from Supabase
  const loadCompletedDiaries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tour_diaries')
        .select('*')
        .eq('officer_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      setCompletedDiaries(data || []);
    } catch (error) {
      console.error('Error loading completed diaries:', error);
    }
  }, [user]);

  // Load saved diaries from IndexedDB
  const loadSavedDiaries = useCallback(async () => {
    try {
      const diaries = await getAllSavedDiaries();
      setSavedDiaries(diaries);
    } catch (error) {
      console.error('Error loading saved diaries:', error);
    }
  }, []);

  // Load stored PDFs
  const loadStoredPdfs = useCallback(async () => {
    try {
      const pdfs = await getAllDiaryPdfs();
      setStoredPdfs(pdfs);
    } catch (error) {
      console.error('Error loading stored PDFs:', error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    setMounted(true);
    loadOfficerInfo();
    loadAllDrafts();
    loadCompletedDiaries();
    loadSavedDiaries();
    loadStoredPdfs();
    
    // Check for recovery state
    const recovery = getRecoveryState();
    if (recovery) {
      setRecoveryDraft(recovery);
      setShowRecoveryPrompt(true);
    }
  }, []);

  // Load data when month/year changes
  useEffect(() => {
    console.log('useEffect triggered - mounted:', mounted, 'user:', !!user);
    // Load holidays regardless of user (static data)
    if (mounted) {
      loadHolidays();
    }
    if (mounted && user) {
      loadAllData();
    } else if (mounted && !user) {
      // If mounted but no user, stop loading
      setLoading(false);
    }
  }, [mounted, currentYear, currentMonth, user, loadAllData]);

  // Track unsaved changes
  useEffect(() => {
    const currentState = JSON.stringify({
      officerName,
      designation,
      district,
      mandal,
      division,
      journeys,
      dateStatusOverrides
    });
    
    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    }
  }, [officerName, designation, district, mandal, division, journeys, dateStatusOverrides, lastSavedState]);

  // Auto-save recovery state with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges && officerName && currentMonth && currentYear) {
        const recoveryDraft: TourDiaryDraft = {
          version: DRAFT_VERSION,
          id: generateDraftId(officerName, currentYear, currentMonth),
          officerName,
          designation,
          mandal,
          division,
          district,
          month: currentMonth,
          year: currentYear,
          journeys,
          dateStatusOverrides,
          openingMeter: tourDiary?.opening_meter || 0,
          closingMeter: tourDiary?.closing_meter || null,
          totalKm: tourDiary?.total_km || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveRecoveryState(recoveryDraft);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, officerName, designation, district, mandal, division, journeys, dateStatusOverrides, currentMonth, currentYear, tourDiary]);

  // Before unload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load officer information from user metadata
  async function loadOfficerInfo() {
    try {
      if (user?.user_metadata) {
        setOfficerInfo({
          name: user.user_metadata.full_name || user.user_metadata.name || 'Officer',
          designation: user.user_metadata.designation || 'Mandal Agriculture Officer',
          office: user.user_metadata.office || 'Tiryani',
          mandal: user.user_metadata.mandal || 'Tiryani',
          division: user.user_metadata.division || '',
          district: user.user_metadata.district || 'Kumram Bheem Asifabad'
        });
        setDivision(user.user_metadata.division || '');
      }
    } catch (error) {
      console.error('Error loading officer info:', error);
    }
  }


  // Save draft to IndexedDB
  async function saveDraftToLocal() {
    if (!officerName) {
      alert('Please enter Officer Name before saving the draft.');
      return;
    }

    if (!currentMonth || !currentYear) {
      alert('Please select Month and Year before saving the draft.');
      return;
    }

    setIsSavingDraft(true);

    try {
      const officerId = user?.id || officerName;
      await saveDraftToIndexedDB(
        officerId,
        officerName,
        designation || customDesignation || '',
        district || customDistrict || '',
        mandal || customMandal || '',
        currentYear,
        currentMonth,
        tourDiary?.opening_meter || 0,
        journeys,
        dateStatusOverrides,
        dateRemarks
      );

      setLastSaved(new Date());
      setLastSavedState(JSON.stringify({
        officerName,
        designation,
        district,
        mandal,
        division,
        journeys,
        dateStatusOverrides
      }));
      setHasUnsavedChanges(false);

      // Reload drafts from IndexedDB
      await loadAllDrafts();
      alert('✓ Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  }

  // Load draft from IndexedDB
  // Load draft from localStorage
  function loadDraftFromLocal(draft: TourDiaryDraft) {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes.\n\nLoading another draft will replace the current Tour Diary.\n\nDo you want to continue?')) {
        return;
      }
    }

    try {
      setOfficerName(draft.officerName);
      setDesignation(draft.designation);
      setCustomDesignation(draft.customDesignation || '');
      setDistrict(draft.district);
      setCustomDistrict(draft.customDistrict || '');
      setMandal(draft.mandal);
      setCustomMandal(draft.customMandal || '');
      setDivision(draft.division);
      setCustomDivision(draft.customDivision || '');
      setCurrentYear(draft.year);
      setCurrentMonth(draft.month);
      
      // Add backward compatibility for old drafts without custom fields
      const backwardCompatibleJourneys = draft.journeys.map(journey => ({
        ...journey,
        custom_mode_of_journey: journey.custom_mode_of_journey || null,
        custom_purpose: journey.custom_purpose || null
      }));
      
      setJourneys(backwardCompatibleJourneys);
      setDateStatusOverrides(draft.dateStatusOverrides || {});

      if (tourDiary) {
        setTourDiary({
          ...tourDiary,
          opening_meter: draft.openingMeter,
          closing_meter: draft.closingMeter,
          total_km: draft.totalKm
        });
      }

      setLastSavedState(JSON.stringify({
        officerName: draft.officerName,
        designation: draft.designation,
        district: draft.district,
        mandal: draft.mandal,
        division: draft.division,
        journeys: draft.journeys,
        dateStatusOverrides: draft.dateStatusOverrides || {}
      }));
      setHasUnsavedChanges(false);
      setShowDraftPicker(false);
      alert(`✓ ${MONTHS[draft.month - 1]} ${draft.year} draft loaded successfully`);
    } catch (error) {
      console.error('Error loading draft:', error);
      alert('Failed to load draft. Please try again.');
    }
  }

  // Delete draft from localStorage
  function deleteDraftFromLocal(draftId: string, month: number, year: number) {
    if (confirm(`Delete ${MONTHS[month - 1]} ${year} draft?\n\nThis action cannot be undone.`)) {
      try {
        const drafts = getDrafts();
        const filteredDrafts = drafts.filter(d => d.id !== draftId);
        if (!saveDrafts(filteredDrafts)) {
          throw new Error('Failed to delete draft');
        }
        alert('✓ Draft deleted successfully');
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Failed to delete draft. Please try again.');
      }
    }
  }

  // Save completed diary to database
  async function saveCompletedDiary() {
    if (!user) {
      alert('You must be logged in to save a diary.');
      return;
    }

    if (!officerName) {
      alert('Please enter Officer Name before saving.');
      return;
    }

    try {
      const summary = calculateMonthlySummary();
      
      const diaryData = {
        officer_id: user.id,
        year: currentYear,
        month: currentMonth,
        opening_meter: summary.openingMeter,
        closing_meter: summary.closingMeter,
        total_km: summary.totalDistance,
        status: 'Completed',
        officer_name: officerName,
        designation: getHeaderDesignation(),
        district: getHeaderDistrict(),
        mandal: getHeaderMandal(),
        division: getHeaderDivision()
      };

      // Check if diary already exists for this month/year
      const { data: existingDiary } = await supabase
        .from('tour_diaries')
        .select('id')
        .eq('officer_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      let savedDiary;

      if (existingDiary) {
        // Update existing diary
        const { data, error } = await supabase
          .from('tour_diaries')
          .update(diaryData)
          .eq('id', existingDiary.id)
          .select()
          .single();

        if (error) throw error;
        savedDiary = data;
      } else {
        // Insert new diary
        const { data, error } = await supabase
          .from('tour_diaries')
          .insert(diaryData)
          .select()
          .single();

        if (error) throw error;
        savedDiary = data;
      }

      // Save journeys to database
      if (savedDiary) {
        // Delete existing journeys for this diary
        await supabase
          .from('tour_journeys')
          .delete()
          .eq('tour_diary_id', savedDiary.id);

        // Insert all journeys
        const journeysToSave = journeys.map(journey => ({
          tour_diary_id: savedDiary.id,
          officer_id: user.id,
          journey_date: journey.journey_date,
          from_place: journey.from_place,
          to_place: journey.to_place,
          time_from: journey.time_from,
          time_to: journey.time_to,
          mode: journey.mode,
          custom_mode_of_journey: journey.custom_mode_of_journey,
          meter_from: journey.meter_from,
          distance_km: journey.distance_km,
          meter_to: journey.meter_to,
          purpose: journey.purpose,
          custom_purpose: journey.custom_purpose,
          remarks: journey.remarks
        }));

        if (journeysToSave.length > 0) {
          const { error: journeyError } = await supabase
            .from('tour_journeys')
            .insert(journeysToSave);

          if (journeyError) throw journeyError;
        }
      }

      // Remove draft from localStorage since it's now saved
      const draftId = generateDraftId(officerName, currentYear, currentMonth);
      const drafts = getDrafts();
      const filteredDrafts = drafts.filter(d => d.id !== draftId);
      saveDrafts(filteredDrafts);
      loadAllDrafts();

      // Reload completed diaries
      await loadCompletedDiaries();

      alert(`✓ ${MONTHS[currentMonth - 1]} ${currentYear} diary saved successfully!`);
      
      // Clear unsaved changes
      setHasUnsavedChanges(false);
      setLastSavedState(JSON.stringify({
        officerName,
        designation,
        district,
        mandal,
        division,
        journeys,
        dateStatusOverrides
      }));

    } catch (error) {
      console.error('Error saving completed diary:', error);
      alert('Failed to save diary. Please try again.');
    }
  }

  // Load journeys for current month
  async function loadJourneys() {
    // Journeys are now managed locally through the draft system
    // This function is kept for compatibility but does nothing
    setJourneys([]);
  }

  // Load holidays for current year
  async function loadHolidays() {
    const staticHolidays = HOLIDAYS_2026.map((h, index) => ({
      ...h,
      id: `static-${index}`
    }));
    setHolidays(staticHolidays);
  }

  function getDefaultHolidaysForDate(date: string): Holiday[] {
    // Date is in DD-MM-YYYY format, holidays are stored with date in DD-MM-YYYY format
    return holidaysByDate.get(date) || [];
  }

  function getDisplayedHolidaysForDate(date: string): Holiday[] {
    const override = dateStatusOverrides[date];
    if (!override) return getDefaultHolidaysForDate(date);
    if (override.status === 'WORKING') return [];

    return [{
      id: `override-${date}`,
      year: currentYear,
      date: displayDateToHolidayDate(date),
      holiday_name: override.holiday_name || getHolidayTypeLabel(override.holiday_type),
      holiday_type: override.holiday_type
    }];
  }

  function getDateStatusLabels(date: string, day: number): string[] {
    const labels = [];
    if (isSunday(currentYear, currentMonth, day)) labels.push('SUNDAY');
    getDisplayedHolidaysForDate(date).forEach((holiday) => {
      labels.push(`${holiday.holiday_name.toUpperCase()} - ${getHolidayTypeLabel(holiday.holiday_type).toUpperCase()}`);
    });
    return labels;
  }

  function getSpecialDateStatus(date: string, day: number): SpecialDateStatus | null {
    const displayedHolidays = getDisplayedHolidaysForDate(date);
    const leaveType = getDateLeaveType(date);

    if (leaveType === 'NORMAL_LEAVE') {
      return { type: 'leave', label: 'Leave' };
    }

    if (leaveType === 'OPTIONAL_HOLIDAY') {
      const optionalHoliday = displayedHolidays.find(h => h.holiday_type === 'OPTIONAL');
      return {
        type: 'optionalHoliday',
        label: `Optional Holiday – ${optionalHoliday?.holiday_name || 'Optional Holiday'}`
      };
    }

    const generalHoliday = displayedHolidays.find(h => h.holiday_type === 'GENERAL');
    if (generalHoliday) {
      return { type: 'holiday', label: `Holiday – ${generalHoliday.holiday_name}` };
    }

    if (isSunday(currentYear, currentMonth, day)) {
      return { type: 'sunday', label: 'Sunday' };
    }

    if (isSecondSaturday(currentYear, currentMonth, day)) {
      return { type: 'secondSaturday', label: '2nd Saturday' };
    }

    return null;
  }


  function getSpecialDateStatusForRow(row: any[]): SpecialDateStatus | null {
    const date = typeof row?.[0] === 'string' ? row[0] : '';
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
    if (!match) return null;

    return getSpecialDateStatus(date, parseInt(match[1], 10));
  }

  function updateDateStatusOverride(date: string, status: 'DEFAULT' | DateStatusOverrideType) {
    setDateStatusOverrides((previous) => {
      const next = { ...previous };
      if (status === 'DEFAULT') {
        delete next[date];
        return next;
      }

      const defaultHoliday = getDefaultHolidaysForDate(date).find(h => h.holiday_type === status) || getDefaultHolidaysForDate(date)[0];
      const holidayType: HolidayType = status === 'OPTIONAL' ? 'OPTIONAL' : 'GENERAL';
      next[date] = {
        status,
        holiday_type: holidayType,
        holiday_name: status === 'WORKING' ? '' : (defaultHoliday?.holiday_name || getHolidayTypeLabel(holidayType))
      };
      return next;
    });
  }

  function updateDateStatusOverrideName(date: string, holidayName: string) {
    setDateStatusOverrides((previous) => {
      const existing = previous[date];
      if (!existing || existing.status === 'WORKING') return previous;
      return {
        ...previous,
        [date]: {
          ...existing,
          holiday_name: holidayName
        }
      };
    });
  }

  // Leave and Optional Holiday Actions
  function availLeave(date: string) {
    const dayJourneys = getJourneysForDate(date);
    if (dayJourneys.length > 0) {
      if (!confirm('This date already contains tour details.\n\nAvailing leave will disable the tour entry for this date.\n\nDo you want to continue?')) {
        return;
      }
    }
    
    setDateStatusOverrides((previous) => ({
      ...previous,
      [date]: {
        status: 'WORKING',
        holiday_name: '',
        holiday_type: 'GENERAL',
        leave_type: 'NORMAL_LEAVE'
      }
    }));
    setActionMenuOpen(null);
  }

  // Avail Leave on Optional Holiday
  function availLeaveOnOptionalHoliday(date: string) {
    const dayJourneys = getJourneysForDate(date);
    if (dayJourneys.length > 0) {
      if (!confirm('This date already contains tour details.\n\nAvailing leave will disable the tour entry for this date.\n\nDo you want to continue?')) {
        return;
      }
    }
    
    // Preserve the optional holiday info
    const displayedHolidays = getDisplayedHolidaysForDate(date);
    const optionalHoliday = displayedHolidays.find(h => h.holiday_type === 'OPTIONAL');
    
    setDateStatusOverrides((previous) => ({
      ...previous,
      [date]: {
        status: 'OPTIONAL',
        holiday_name: optionalHoliday?.holiday_name || '',
        holiday_type: 'OPTIONAL',
        leave_type: 'OPTIONAL_HOLIDAY_LEAVE'
      }
    }));
    setActionMenuOpen(null);
  }

  function cancelLeave(date: string) {
    setDateStatusOverrides((previous) => {
      const next = { ...previous };
      if (next[date]?.leave_type === 'NORMAL_LEAVE' || next[date]?.leave_type === 'OPTIONAL_HOLIDAY_LEAVE') {
        delete next[date];
      }
      return next;
    });
    setActionMenuOpen(null);
  }

  function availOptionalHoliday(date: string) {
    const holiday = getDisplayedHolidaysForDate(date).find(h => h.holiday_type === 'OPTIONAL');
    if (!holiday) return;
    
    setDateStatusOverrides((previous) => ({
      ...previous,
      [date]: {
        status: 'OPTIONAL',
        holiday_name: holiday.holiday_name,
        holiday_type: 'OPTIONAL',
        leave_type: 'OPTIONAL_HOLIDAY'
      }
    }));
    setActionMenuOpen(null);
  }

  function cancelOptionalHoliday(date: string) {
    setDateStatusOverrides((previous) => {
      const next = { ...previous };
      if (next[date]?.leave_type === 'OPTIONAL_HOLIDAY') {
        delete next[date];
      }
      return next;
    });
    setActionMenuOpen(null);
  }

  function markAsWorkingDay(date: string) {
    setDateStatusOverrides((previous) => ({
      ...previous,
      [date]: {
        status: 'WORKING',
        holiday_name: '',
        holiday_type: 'GENERAL',
        leave_type: 'NONE'
      }
    }));
    setActionMenuOpen(null);
  }

  function restoreDefaultStatus(date: string) {
    setDateStatusOverrides((previous) => {
      const next = { ...previous };
      delete next[date];
      return next;
    });
    setActionMenuOpen(null);
  }

  function getDateLeaveType(date: string): LeaveType {
    return dateStatusOverrides[date]?.leave_type || 'NONE';
  }

  function isTourEntryDisabled(date: string): boolean {
    const leaveType = getDateLeaveType(date);
    const isSundayDay = isSunday(currentYear, currentMonth, parseInt(date.split('-')[0]));
    const isSecondSaturdayDay = isSecondSaturday(currentYear, currentMonth, parseInt(date.split('-')[0]));
    const holiday = getDisplayedHolidaysForDate(date).find(h => h.holiday_type === 'GENERAL');
    const dateOverride = dateStatusOverrides[date];
    
    // Allow journey if date is marked as working day (override)
    if (dateOverride?.status === 'WORKING') {
      return leaveType !== 'NONE';
    }
    
    // Disable for all leave types including OPTIONAL_HOLIDAY_LEAVE
    return leaveType !== 'NONE' || isSundayDay || isSecondSaturdayDay || !!holiday;
  }

  // Get journeys for a specific date
  function getJourneysForDate(date: string): TourJourney[] {
    return journeys.filter(j => j.journey_date === date);
  }

  // Check if a date has a completed journey (all mandatory fields filled and saved)
  function hasCompletedJourney(date: string): boolean {
    const dayJourneys = getJourneysForDate(date);
    if (dayJourneys.length === 0) return false;
    
    // Check if at least one journey has all mandatory fields
    return dayJourneys.some(j => 
      j.to_place && 
      j.distance_km !== null && j.distance_km !== undefined && j.distance_km > 0 &&
      j.purpose
    );
  }

  // Check if journey entry is required for a date (working day, not holiday/leave)
  function isJourneyRequired(date: string): boolean {
    return !isTourEntryDisabled(date);
  }

  // Check if all previous working days in the month have completed journeys
  function arePreviousWorkingDaysCompleted(targetDate: string): boolean {
    const [targetDay] = targetDate.split('-').map(Number);
    
    for (let day = 1; day < targetDay; day++) {
      const date = formatDate(currentYear, currentMonth, day);
      if (isJourneyRequired(date) && !hasCompletedJourney(date)) {
        return false;
      }
    }
    return true;
  }

  // Calculate monthly summary - Centralized calculation function for UI, Preview, and PDF
  function calculateMonthlySummary() {
    const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Track dates for each category
    const sundayDates: string[] = [];
    const secondSaturdayDates: string[] = [];
    const governmentHolidayDates: string[] = [];
    const optionalHolidayDates: string[] = [];
    
    let optionalHolidaysAvailed = 0;
    let leavesAvailed = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day);
      const isSundayDay = isSunday(currentYear, currentMonth, day);
      const isSecondSaturdayDay = isSecondSaturday(currentYear, currentMonth, day);
      const displayedHolidays = getDisplayedHolidaysForDate(date);
      const hasGeneralHoliday = displayedHolidays.some(holiday => holiday.holiday_type === 'GENERAL');
      const hasOptionalHoliday = displayedHolidays.some(holiday => holiday.holiday_type === 'OPTIONAL');
      
      // Track dates by category
      if (isSundayDay) {
        sundayDates.push(date);
      }
      if (isSecondSaturdayDay) {
        secondSaturdayDates.push(date);
      }
      if (hasGeneralHoliday) {
        governmentHolidayDates.push(date);
      }
      if (hasOptionalHoliday) {
        optionalHolidayDates.push(date);
      }
      
      // Count leaves and optional holidays availed
      const leaveType = getDateLeaveType(date);
      if (leaveType === 'NORMAL_LEAVE') {
        leavesAvailed++;
      } else if (leaveType === 'OPTIONAL_HOLIDAY') {
        optionalHolidaysAvailed++;
      }
    }

    // Calculate unique non-working days (avoid double-counting overlaps)
    const allNonWorkingDates = new Set<string>();
    sundayDates.forEach(date => allNonWorkingDates.add(date));
    secondSaturdayDates.forEach(date => allNonWorkingDates.add(date));
    governmentHolidayDates.forEach(date => allNonWorkingDates.add(date));
    
    const uniqueNonWorkingDays = allNonWorkingDates.size;
    
    // Working Days = Total Days - Unique Non-Working Days
    const workingDays = Math.max(0, totalDaysInMonth - uniqueNonWorkingDays);
    
    // Calculate total distance from journeys - filter by selected month/year
    const journeysInMonth = journeys.filter(j => {
      const journeyDate = j.journey_date; // Format: DD-MM-YYYY
      const [day, month, year] = journeyDate.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    });
    const totalDistance = journeysInMonth.reduce((sum, j) => sum + (j.distance_km || 0), 0);

    // Tour Days = Number of unique dates having at least one valid saved Add Journey entry in the selected month
    // Exclude dates that are invalid for tour activity under existing Leave/Optional Holiday business rules
    const uniqueJourneyDates = new Set<string>();
    journeysInMonth.forEach(journey => {
      const journeyDate = journey.journey_date;
      const [day, month, year] = journeyDate.split('-').map(Number);
      
      // Check if this date is valid for tour activity (not a leave or optional holiday availed)
      const leaveType = getDateLeaveType(journeyDate);
      const isLeave = leaveType === 'NORMAL_LEAVE';
      const isOptionalHolidayAvailed = leaveType === 'OPTIONAL_HOLIDAY';
      
      // Only count as Tour Day if not a leave or optional holiday availed
      if (!isLeave && !isOptionalHolidayAvailed) {
        uniqueJourneyDates.add(journeyDate);
      }
    });
    const tourDays = uniqueJourneyDates.size;

    // Calculate meter readings from journeys - filter by selected month/year
    const meterReadingsInMonth = journeysInMonth.map(j => j.meter_to).filter(m => m !== null && m !== undefined);
    const closingMeter = meterReadingsInMonth.length > 0 ? Math.max(...meterReadingsInMonth) : 0;
    const openingMeter = journeysInMonth.length > 0 ? Math.min(...journeysInMonth.map(j => j.meter_from)) : 0;

    // Count unique villages visited (split by space or comma) - filter by selected month/year
    const villagesSet = new Set<string>();
    journeysInMonth.forEach(journey => {
      if (journey.to_place) {
        const villages = journey.to_place.split(/[, ]+/).map(v => v.trim()).filter(v => v.length > 0);
        villages.forEach(v => villagesSet.add(v));
      }
    });

    return {
      totalDays: totalDaysInMonth,
      workingDays,
      tourDays,
      totalDistance,
      closingMeter,
      openingMeter,
      villagesVisited: villagesSet.size,
      sundays: sundayDates.length,
      secondSaturdays: secondSaturdayDates.length,
      governmentHolidays: governmentHolidayDates.length,
      optionalHolidays: optionalHolidayDates.length,
      optionalHolidaysAvailed,
      leavesAvailed,
      isReconciled: Math.abs((closingMeter - openingMeter) - totalDistance) < 0.1
    };
  }

  // Open journey form for new journey
  function openJourneyForm(date: string, continueFrom?: TourJourney) {
    // Check if previous working days have completed journeys before allowing navigation
    if (!arePreviousWorkingDaysCompleted(date)) {
      alert('Please save the previous date\'s journey before moving to the next date.');
      return;
    }

    setSelectedDate(date);
    setEditingJourney(null);

    const previousJourney = continueFrom || getJourneysForDate(date).slice(-1)[0];
    const lastJourney = journeys.slice(-1)[0];

    // Determine default from_place based on designation
    const normalizedDesignation = normalizeHeaderDesignation(getHeaderDesignation());
    let defaultFromPlace = mandal || officerInfo?.mandal || '';
    if (normalizedDesignation === 'asst director of agriculture' || normalizedDesignation === 'assistant director of agriculture') {
      defaultFromPlace = division || officerInfo?.division || '';
    } else if (normalizedDesignation === 'district agriculture officer') {
      defaultFromPlace = district || officerInfo?.district || '';
    }

    // Check if date is Tuesday and not a holiday/leave for default purpose
    const [day] = date.split('-').map(Number);
    const dayName = getDayName(currentYear, currentMonth, day);
    const isTuesday = dayName === 'Tuesday';
    const isHoliday = isTourEntryDisabled(date);
    const defaultPurpose = (isTuesday && !isHoliday) ? 'Rythu Nestham VC' : '';

    setFormData({
      journey_date: date,
      from_place: continueFrom?.to_place || previousJourney?.to_place || defaultFromPlace,
      to_place: '',
      time_from: '09:00',
      time_to: '17:30',
      mode: 'Car',
      custom_mode_of_journey: '',
      meter_from: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      distance_km: 0,
      meter_to: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      purpose: defaultPurpose,
      custom_purpose: '',
      remarks: ''
    });

    setShowJourneyForm(true);
  }

  // Open journey form for editing
  function editJourney(journey: TourJourney) {
    setSelectedDate(journey.journey_date);
    setEditingJourney(journey);

    setFormData({
      journey_date: journey.journey_date,
      from_place: journey.from_place,
      to_place: journey.to_place,
      time_from: journey.time_from,
      time_to: journey.time_to,
      mode: journey.mode,
      custom_mode_of_journey: journey.custom_mode_of_journey || '',
      meter_from: journey.meter_from,
      distance_km: journey.distance_km,
      meter_to: journey.meter_to,
      purpose: journey.purpose,
      custom_purpose: journey.custom_purpose || '',
      remarks: journey.remarks || ''
    });

    setShowJourneyForm(true);
  }

  // Save journey
  async function saveJourney() {
    try {
      // Validation - mandatory fields
      if (!formData.to_place) {
        alert('To Place is required.');
        return;
      }
      if (formData.distance_km === null || formData.distance_km === undefined || formData.distance_km <= 0) {
        alert('Please enter a valid distance greater than 0 km.');
        return;
      }
      if (!formData.purpose) {
        alert('Purpose is required.');
        return;
      }
      
      // Additional validation
      if (!formData.from_place) {
        alert('From Place is required.');
        return;
      }
      if (formData.meter_to < formData.meter_from) {
        alert('Meter To cannot be less than Meter From');
        return;
      }

      const journeyData: TourJourney = {
        id: editingJourney?.id || crypto.randomUUID(),
        tour_diary_id: tourDiary?.id || '',
        officer_id: user?.id || '',
        journey_date: formData.journey_date,
        from_place: formData.from_place,
        to_place: formData.to_place,
        time_from: formData.time_from,
        time_to: formData.time_to,
        mode: formData.mode,
        custom_mode_of_journey: formData.mode === 'Others' ? formData.custom_mode_of_journey : null,
        meter_from: formData.meter_from,
        distance_km: formData.distance_km,
        meter_to: formData.meter_to,
        purpose: formData.purpose,
        custom_purpose: formData.purpose === 'Others' ? formData.custom_purpose : null,
        remarks: formData.remarks || null
      };

      if (editingJourney) {
        // Update existing journey in local state
        setJourneys(prev => prev.map(j => j.id === editingJourney.id ? journeyData : j));
      } else {
        // Add new journey to local state
        setJourneys(prev => [...prev, journeyData]);
      }

      // If tour diary exists in database, also sync to Supabase
      if (tourDiary && user?.id) {
        const supabaseJourneyData = {
          tour_diary_id: tourDiary.id,
          officer_id: user.id,
          journey_date: formData.journey_date,
          from_place: formData.from_place,
          to_place: formData.to_place,
          time_from: formData.time_from,
          time_to: formData.time_to,
          mode: formData.mode,
          custom_mode_of_journey: formData.mode === 'Others' ? formData.custom_mode_of_journey : null,
          meter_from: formData.meter_from,
          distance_km: formData.distance_km,
          meter_to: formData.meter_to,
          purpose: formData.purpose,
          custom_purpose: formData.purpose === 'Others' ? formData.custom_purpose : null,
          remarks: formData.remarks || null
        };

        if (editingJourney) {
          const { error } = await supabase
            .from('tour_journeys')
            .update(supabaseJourneyData)
            .eq('id', editingJourney.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('tour_journeys')
            .insert(supabaseJourneyData);

          if (error) throw error;
        }
      }

      setShowJourneyForm(false);
      setEditingJourney(null);
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Failed to save journey. Please try again.');
    }
  }

  // Delete journey
  function deleteJourney(journeyId: string) {
    if (!confirm('Are you sure you want to delete this journey?')) return;

    // Remove journey from local state
    setJourneys(prev => prev.filter(j => j.id !== journeyId));
    
    // Mark as unsaved changes so it gets saved to draft
    setHasUnsavedChanges(true);
  }


  // Navigate months
  function navigateMonth(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(12);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  }

  // Generate table data for both Preview and PDF - Single source of truth
  function generateTourDiaryData() {
    const tableData = [];
    
    console.log('Generating table data for:', currentMonth, currentYear);
    console.log('Journeys count:', journeys.length);
    
    for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
      const date = formatDate(currentYear, currentMonth, day);
      const specialDateStatus = getSpecialDateStatus(date, day);
      const dayJourneys = getJourneysForDate(date);

      if (specialDateStatus) {
        tableData.push([date, '', '', '', '', '', '', '', '', specialDateStatus.label]);
      } else if (dayJourneys.length === 0) {
        if (isTuesday(currentYear, currentMonth, day)) {
          tableData.push([date, '', '', '', '', '', '', '', '', 'Rythunestham VC']);
        } else {
          tableData.push([date, '', '', '', '', '', '', '', '', '']);
        }
      } else {
        dayJourneys.forEach(journey => {
          const displayMode = journey.mode === 'Others' ? (journey.custom_mode_of_journey || '') : journey.mode;
          const displayPurpose = journey.purpose === 'Others' ? (journey.custom_purpose || '') : journey.purpose;
          
          tableData.push([
            date,
            journey.from_place || '',
            journey.to_place || '',
            formatOptionalTime(journey.time_from),
            formatOptionalTime(journey.time_to),
            displayMode || '',
            formatOptionalNumber(journey.meter_from),
            formatOptionalNumber(journey.meter_to),
            formatOptionalNumber(journey.distance_km),
            displayPurpose || ''
          ]);
        });
      }
    }
    
    console.log('Generated table data rows:', tableData.length);
    return tableData;
  }

  function getHeaderDesignation() {
    return designation === 'Others' ? customDesignation : (designation || officerInfo?.designation || '');
  }

  function getHeaderMandal() {
    return mandal === 'Others' ? customMandal : (mandal || officerInfo?.mandal || '');
  }

  function getHeaderDivision() {
    return division === 'Others' ? customDivision : (division || officerInfo?.division || '');
  }

  function getHeaderDistrict() {
    return district === 'Others' ? customDistrict : (district || officerInfo?.district || '');
  }

  function normalizeHeaderDesignation(value: string) {
    return value.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  }

  function shouldShowHeaderMandal() {
    const normalizedDesignation = normalizeHeaderDesignation(getHeaderDesignation());
    return normalizedDesignation !== 'district agriculture officer' && normalizedDesignation !== 'asst director of agriculture' && normalizedDesignation !== 'assistant director of agriculture';
  }

  function shouldShowHeaderDivision() {
    return normalizeHeaderDesignation(getHeaderDesignation()) !== 'district agriculture officer';
  }

  // Generate PDF - Match reference Excel format, fit on one page
  async function generatePDF(customTableData?: any[][]) {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const summary = calculateMonthlySummary();
      const tableData = customTableData || generateTourDiaryData();

      console.log('Table data type:', typeof tableData);
      console.log('Table data value:', tableData);
      console.log('Is array:', Array.isArray(tableData));

      // Validate table data before passing to autoTable
      if (!Array.isArray(tableData)) {
        throw new Error('Invalid table data: must be an array');
      }

      // If table is empty, generate empty rows for the month
      if (tableData.length === 0) {
        console.warn('Table data is empty, generating empty rows');
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        for (let day = 1; day <= daysInMonth; day++) {
          const date = formatDate(currentYear, currentMonth, day);
          tableData.push([date, '', '', '', '', '', '', '', '', '']);
        }
      }

      // Ensure all rows are arrays
      const validatedTableData = tableData.map(row => {
        if (!Array.isArray(row)) {
          console.error('Invalid row data:', row);
          return Array(TOUR_DIARY_COLUMN_COUNT).fill(''); // Fallback to empty row
        }
        return Array.from({ length: TOUR_DIARY_COLUMN_COUNT }, (_, index) => row[index] ?? '');
      });

      // Add total distance row at the end
      const totalRow = Array(TOUR_DIARY_COLUMN_COUNT).fill('');
      totalRow[8] = `${summary.totalDistance.toFixed(0)} km`;
      validatedTableData.push(totalRow);
      const specialPdfRowStatuses = validatedTableData.map(row => getSpecialDateStatusForRow(row));

      // Log table data for debugging
      console.log('Table data length:', validatedTableData.length);
      console.log('First row:', validatedTableData[0]);

      // Header - TOUR DIARY OF format
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black
      const monthYear = `${MONTHS[currentMonth - 1]}-${currentYear}`;
      const displayDesignation = getHeaderDesignation() || '....................';
      const displayMandal = getHeaderMandal() || '....................';
      const displayDivision = getHeaderDivision() || '....................';
      const displayDistrict = getHeaderDistrict() || '....................';
      const displayName = officerName || officerInfo?.name || '....................';
      
      let xPos = 14;
      const yPos = 12;
      const addHeaderText = (text: string, bold = false) => {
        doc.setFont('times', bold ? 'bold' : 'normal');
        doc.text(text, xPos, yPos);
        xPos += doc.getTextWidth(text);
      };
      
      addHeaderText('Tour Diary of ');
      addHeaderText(' ' + displayName, true);
      addHeaderText(', ');
      addHeaderText(displayDesignation, true);
      if (shouldShowHeaderMandal() && displayMandal !== '....................') {
        addHeaderText(', ');
        addHeaderText(displayMandal, true);
      }
      if (shouldShowHeaderDivision() && displayDivision !== '....................') {
        addHeaderText(', Division: ');
        addHeaderText(displayDivision, true);
      }
      if (displayDistrict !== '....................') {
        addHeaderText(', Dist: ');
        addHeaderText(displayDistrict, true);
      }
      addHeaderText(' for the Month of ');
      addHeaderText(monthYear, true);
      addHeaderText('.');

      // Generate table with merged header cells - compact for one page
      autoTable(doc, {
        startY: 16,
        margin: { left: 14, right: 14 },
        tableWidth: 'wrap',
        head: [
          ['Date', 'Visiting Place', 'Visiting Place', 'Visiting Time', 'Visiting Time', 'Mode of Journey', 'Meter Reading', 'Meter Reading', 'Distance (Km)', 'Purpose of Visit'],
          ['', 'From', 'To', 'From', 'To', '', 'From', 'To', '', '']
        ],
        body: validatedTableData,
        styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2, lineColor: [0, 0, 0], fontSize: 7, font: 'times', halign: 'center' },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        didParseCell: (data) => {
          if (data.section === 'body') {
            const specialDateStatus = specialPdfRowStatuses[data.row.index];
            if (specialDateStatus) {
              if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'normal';
                data.cell.styles.halign = 'left';
                data.cell.styles.valign = 'middle';
              } else if (data.column.index === 1) {
                data.cell.text = [specialDateStatus.label];
                data.cell.colSpan = TOUR_DIARY_COLUMN_COUNT - 1;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.halign = 'center';
                data.cell.styles.valign = 'middle';
                data.cell.styles.overflow = 'hidden';
              } else {
                data.cell.colSpan = 0;
              }
              return;
            }
          }

          // Make the last row (total distance) bold
          if (data.row.index === data.table.body.length - 1) {
            data.cell.styles.fontStyle = 'bold';
          }
          
          // Merge header cells for parent columns
          if (data.section === 'head') {
            // Column 0: Date - keep as is (single cell)
            
            // Columns 1-2: Visiting Place (merge row 0)
            if (data.row.index === 0 && data.column.index === 1) {
              data.cell.colSpan = 2;
            }
            if (data.row.index === 0 && data.column.index === 2) {
              data.cell.colSpan = 0; // Hide this cell
            }
            
            // Columns 3-4: Visiting Time (merge row 0)
            if (data.row.index === 0 && data.column.index === 3) {
              data.cell.colSpan = 2;
            }
            if (data.row.index === 0 && data.column.index === 4) {
              data.cell.colSpan = 0; // Hide this cell
            }
            
            // Column 5: Mode of Journey - keep as is (single cell)
            
            // Columns 6-7: Meter Reading (merge row 0)
            if (data.row.index === 0 && data.column.index === 6) {
              data.cell.colSpan = 2;
            }
            if (data.row.index === 0 && data.column.index === 7) {
              data.cell.colSpan = 0; // Hide this cell
            }
            
            // Columns 8-9: Distance and Purpose - keep as is (single cells)
          }
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 32, halign: 'center' },
          2: { cellWidth: 34, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 24, halign: 'center' },
          9: { cellWidth: 44, halign: 'center' }
        }
      });

      // Abstract section - Compact layout
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(7);
      
      // ABSTRACT section - 2 column compact layout
      const abstractY = finalY + 3;
      doc.setFont('times', 'bold');
      doc.text('ABSTRACT', 14, abstractY);
      doc.setFont('times', 'normal');
      doc.text(`Total No of Working Days: ${summary.workingDays}`, 14, abstractY + 4);
      doc.text(`Total No of Days on Tour: ${summary.tourDays}`, 14, abstractY + 7);
      doc.text(`Total No of Holidays availed: ${summary.sundays + summary.secondSaturdays + summary.governmentHolidays + summary.optionalHolidaysAvailed}`, 14, abstractY + 10);
      doc.text(`No of Villages Visited: ${summary.villagesVisited}`, 14, abstractY + 13);
      doc.text(`Leaves availed: ${summary.leavesAvailed}`, 14, abstractY + 16);

      // Signature section - conditional based on officer designation
      const signatureY = abstractY + 12;
      const normalizedDesignation = normalizeHeaderDesignation(getHeaderDesignation());
      
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      
      if (normalizedDesignation === 'mandal agriculture officer') {
        // Show both signatures for Mandal Agriculture Officer
        doc.text('Mandal Agriculture Officer', 69, signatureY);
        doc.text('Asst.Director of Agriculture', 175, signatureY);
      } else {
        // Show only Asst.Director of Agriculture signature for other designations
        doc.text('Asst.Director of Agriculture', 175, signatureY);
      }

      // Generate PDF blob for storage
      const pdfBlob = doc.output('blob');
      const fileName = `Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.pdf`;
      
      // Save to IndexedDB
      try {
        const diaryId = tourDiary?.id || generateDraftId(officerName || 'Officer', currentYear, currentMonth);
        const existingPdf = await hasDiaryPdf(diaryId, currentMonth, currentYear);
        
        if (existingPdf) {
          const shouldReplace = confirm(`A PDF for ${MONTHS[currentMonth - 1]} ${currentYear} already exists in My Diaries. Replace it?`);
          if (!shouldReplace) {
            // Still download the PDF even if user doesn't want to replace
            doc.save(fileName);
            setIsGeneratingPDF(false);
            return;
          }
        }
        
        await saveDiaryPdf(diaryId, currentMonth, currentYear, pdfBlob, fileName);
        await loadStoredPdfs(); // Refresh the PDF list
      } catch (storageError) {
        console.error('Failed to save PDF to IndexedDB:', storageError);
        // Don't prevent the normal download if storage fails
        alert(`PDF downloaded successfully, but couldn't be saved to My Diaries because browser storage is full.`);
      }
      
      // Normal browser download
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  // Generate Excel - Match reference format
  async function generateExcel() {
    try {
      const summary = calculateMonthlySummary();
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Monthly Tour Diary - Match reference format with merged headers
      const monthYear = `${MONTHS[currentMonth - 1]}-${currentYear}`;
      const diaryData = [
        [`Tour Diary of ${officerName || officerInfo?.name || ''}, ${getHeaderDesignation()}, ${getHeaderMandal()}, Division: ${getHeaderDivision()}, Dist: ${getHeaderDistrict()} for the Month of ${monthYear}.`],
        [''],
        ['Date', 'VISITING PLACE', '', 'VISITING TIME', '', 'MODE OF JOURNEY', 'METER READING', '', 'DISTANCE (KM)', 'PURPOSE OF VISIT'],
        ['', 'FROM', 'TO', 'FROM', 'TO', '', 'From', 'To', '', '']
      ];

      // Use the same data source as Preview and PDF
      const tableData = generateTourDiaryData();
      tableData.forEach(row => {
        diaryData.push(row);
      });

      // Add total distance row
      diaryData.push(['', '', '', '', '', '', '', '', summary.totalDistance.toFixed(0), '']);

      // Add ABSTRACT section
      diaryData.push(['']);
      diaryData.push(['', 'ABSTRACT']);
      diaryData.push(['', 'Total No of Working Days', String(summary.tourDays)]);
      diaryData.push(['', 'Total No of Days on Tour', String(summary.tourDays)]);
      diaryData.push(['', 'Total No of Holidays availed', String(summary.sundays + summary.secondSaturdays + summary.governmentHolidays)]);
      diaryData.push(['', 'No of Villages Visited', String(summary.villagesVisited)]);
      diaryData.push(['', 'Leaves availed', '0']);

      const diarySheet = XLSX.utils.aoa_to_sheet(diaryData);

      // Merge cells for header
      if (diarySheet['!merges'] === undefined) diarySheet['!merges'] = [];
      
      // Merge "TOUR DIARY" header
      diarySheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
      
      // Merge VISITING PLACE header
      diarySheet['!merges'].push({ s: { r: 2, c: 1 }, e: { r: 2, c: 2 } });
      
      // Merge VISITING TIME header
      diarySheet['!merges'].push({ s: { r: 2, c: 3 }, e: { r: 2, c: 4 } });
      
      // Merge METER READING header
      diarySheet['!merges'].push({ s: { r: 2, c: 6 }, e: { r: 2, c: 7 } });

      XLSX.utils.book_append_sheet(workbook, diarySheet, 'Tour Diary');

      XLSX.writeFile(workbook, `Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel. Please try again later.');
    }
  }

  function openEditablePreview() {
    setEditablePreviewData(generateTourDiaryData().map(row => [...row]));
    setShowPreview(true);
  }

  const summary = calculateMonthlySummary();

  // Handle loading a specific draft
  const loadDraft = (draft: TourDiaryDraft) => {
    setCurrentYear(draft.year);
    setCurrentMonth(draft.month);
    setOfficerName(draft.officerName);
    setDesignation(draft.designation);
    setCustomDesignation(draft.customDesignation || '');
    setDistrict(draft.district);
    setCustomDistrict(draft.customDistrict || '');
    setMandal(draft.mandal);
    setCustomMandal(draft.customMandal || '');
    setDivision(draft.division);
    setCustomDivision(draft.customDivision || '');
    setJourneys(draft.journeys || []);
    setDateStatusOverrides(draft.dateStatusOverrides || {});
    setTourDiary({
      id: draft.id,
      officer_id: user?.id || '',
      year: draft.year,
      month: draft.month,
      opening_meter: draft.openingMeter,
      closing_meter: draft.closingMeter,
      total_km: draft.totalKm,
      status: 'draft',
      officer_name: draft.officerName,
      designation: draft.designation,
      district: draft.district,
      mandal: draft.mandal
    });
    setShowDraftPicker(false);
    setDraftMenuOpen(null);
    setShowLandingPage(false);
  };

  // Handle opening a completed diary
  const openCompletedDiary = (diary: TourDiary) => {
    setCurrentYear(diary.year);
    setCurrentMonth(diary.month);
    setOfficerName(diary.officer_name || '');
    setDesignation(diary.designation || '');
    setDistrict(diary.district || '');
    setMandal(diary.mandal || '');
    setDivision('');
    setTourDiary(diary);
    loadJourneys();
    setShowLandingPage(false);
  };

  // Handle opening a saved diary from IndexedDB
  const openSavedDiary = (diary: SavedDiaryRecord) => {
    setCurrentYear(diary.year);
    setCurrentMonth(diary.month);
    setOfficerName(diary.officer_name || '');
    setDesignation(diary.designation || '');
    setDistrict(diary.district || '');
    setMandal(diary.mandal || '');
    setDivision('');
    setTourDiary({
      id: diary.id,
      officer_id: diary.officer_id,
      year: diary.year,
      month: diary.month,
      opening_meter: diary.opening_meter,
      closing_meter: diary.closing_meter,
      total_km: diary.total_km,
      status: diary.status,
      officer_name: diary.officer_name,
      designation: diary.designation,
      district: diary.district,
      mandal: diary.mandal
    });
    setJourneys(diary.journeys);
    setDateStatusOverrides(diary.dateStatusOverrides || {});
    setDateRemarks(diary.dateRemarks || {});
    setShowLandingPage(false);
  };

  // Handle My Diaries - toggle dropdown
  const handleMyDiaries = () => {
    setShowMyDiariesDropdown(!showMyDiariesDropdown);
  };

  // Recovery state functions
  const discardRecoveryState = () => {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
    setRecoveryDraft(null);
    setShowRecoveryPrompt(false);
  };

  const restoreRecoveryState = () => {
    if (recoveryDraft) {
      setCurrentYear(recoveryDraft.year);
      setCurrentMonth(recoveryDraft.month);
      setOfficerName(recoveryDraft.officerName);
      setDesignation(recoveryDraft.designation);
      setCustomDesignation(recoveryDraft.customDesignation || '');
      setDistrict(recoveryDraft.district);
      setCustomDistrict(recoveryDraft.customDistrict || '');
      setMandal(recoveryDraft.mandal);
      setCustomMandal(recoveryDraft.customMandal || '');
      setDivision(recoveryDraft.division);
      setCustomDivision(recoveryDraft.customDivision || '');
      setJourneys(recoveryDraft.journeys || []);
      setDateStatusOverrides(recoveryDraft.dateStatusOverrides || {});
      setTourDiary({
        id: recoveryDraft.id,
        officer_id: user?.id || '',
        year: recoveryDraft.year,
        month: recoveryDraft.month,
        opening_meter: recoveryDraft.openingMeter,
        closing_meter: recoveryDraft.closingMeter,
        total_km: recoveryDraft.totalKm,
        status: 'draft',
        officer_name: recoveryDraft.officerName,
        designation: recoveryDraft.designation,
        district: recoveryDraft.district,
        mandal: recoveryDraft.mandal
      });
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      setRecoveryDraft(null);
      setShowRecoveryPrompt(false);
      setShowLandingPage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  // Landing Page
  if (showLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-emerald-200/50 bg-white/80 backdrop-blur-sm dark:border-emerald-800/50 dark:bg-slate-900/80">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-orange-500 p-4 shadow-lg">
                  <h1 className="flex items-center gap-2 text-xl font-black text-white">
                    <NotebookPen className="h-6 w-6" aria-label="Tour Diary" />
                    Tour Diary
                  </h1>
                  <p className="text-sm font-semibold text-white/90">
                    Manage your monthly tour diaries
                  </p>
                </div>
              </div>
              <BackButton onClick={() => navigate('/officer-toolkit')}>Back</BackButton>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Action Cards - Compact Mobile-First Design */}
          <div className="mb-8 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            {/* Continue Draft Card - Only show latest draft */}
            {(() => {
              const latestDraft = getLatestDraft();
              return latestDraft ? (
                <button
                  onClick={() => loadDraft(latestDraft)}
                  className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm transition-all active:scale-[0.98] hover:border-amber-300 hover:shadow-md dark:border-amber-800 dark:bg-amber-950/30 dark:hover:border-amber-700"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Continue Draft
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {MONTHS[latestDraft.month - 1]} {latestDraft.year} • Last edited {new Date(latestDraft.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Draft
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                </button>
              ) : null;
            })()}

            {/* New Tour Diary Card */}
            <button
              onClick={() => {
                // Always start with a completely blank diary
                setShowLandingPage(false);
                setJourneys([]);
                setDateStatusOverrides({});
                setTourDiary(null);
                setOfficerName('');
                setDesignation('');
                setCustomDesignation('');
                setDistrict('');
                setCustomDistrict('');
                setMandal('');
                setCustomMandal('');
                setDivision('');
                setCustomDivision('');
                setLastSavedState('');
                setHasUnsavedChanges(false);
                // Reset to current month/year
                setCurrentYear(new Date().getFullYear());
                setCurrentMonth(new Date().getMonth() + 1);
              }}
              className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm transition-all active:scale-[0.98] hover:border-emerald-300 hover:shadow-md dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:border-emerald-700"
              style={{ backgroundColor: 'rgba(236, 253, 245, 0.8)' }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  New Tour Diary
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Create a diary for a new month
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            </button>

            {/* My Diaries Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/30" style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}>
              <button
                onClick={handleMyDiaries}
                className="flex w-full items-center gap-4 px-4 py-3 transition-all active:scale-[0.98] hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    My Diaries
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    View and manage saved diaries
                    {completedDiaries.length > 0 && ` • ${completedDiaries.length} Diaries`}
                    {storedPdfs.length > 0 && ` • ${storedPdfs.length} PDFs`}
                  </p>
                </div>
                {showMyDiariesDropdown ? (
                  <ChevronRight className="h-5 w-5 shrink-0 rotate-90 text-slate-700 dark:text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-700 dark:text-slate-400" />
                )}
              </button>
              
              {showMyDiariesDropdown && (
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                  <div className="space-y-3">
                    {/* Completed Diaries */}
                    {completedDiaries.slice(0, 5).map((diary) => (
                      <button
                        key={diary.id}
                        onClick={() => openCompletedDiary(diary)}
                        className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-left shadow-sm transition-all hover:border-emerald-400 hover:shadow-md dark:border-emerald-800 dark:bg-slate-900 dark:hover:border-emerald-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            <Check className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {MONTHS[diary.month - 1]} {diary.year}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {diary.total_km.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Downloaded PDFs */}
                    {storedPdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="relative w-full rounded-xl border border-blue-200 bg-white p-3 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-blue-800 dark:bg-slate-900 dark:hover:border-blue-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {MONTHS[pdf.month - 1]} {pdf.year}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {pdf.fileName} • {formatFileSize(pdf.fileSize)}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            PDF
                          </span>
                          <button
                            onClick={() => setPdfMenuOpen(pdfMenuOpen === pdf.id ? null : pdf.id)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                        {pdfMenuOpen === pdf.id && (
                          <div className="absolute right-2 top-12 z-10 w-52 rounded-lg border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-800">
                            <div className="py-1">
                              <button 
                                onClick={async () => {
                                  const blob = await getDiaryPdf(pdf.id);
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                  }
                                  setPdfMenuOpen(null);
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-900"
                              >
                                Open PDF
                              </button>
                              <button 
                                onClick={async () => {
                                  const blob = await getDiaryPdf(pdf.id);
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = pdf.fileName;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                  setPdfMenuOpen(null);
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-900"
                              >
                                Download
                              </button>
                              <button 
                                onClick={() => {
                                  const newName = prompt('Enter new filename:', pdf.fileName);
                                  if (newName && newName !== pdf.fileName && newName.endsWith('.pdf')) {
                                    renameDiaryPdf(pdf.id, newName);
                                    loadStoredPdfs();
                                  }
                                  setPdfMenuOpen(null);
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-900"
                              >
                                Rename
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Delete this PDF? This will not delete the Tour Diary data.')) {
                                    deleteDiaryPdf(pdf.id);
                                    loadStoredPdfs();
                                  }
                                  setPdfMenuOpen(null);
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {completedDiaries.length === 0 && storedPdfs.length === 0 && (
                      <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                        No saved diaries or PDFs
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Diaries Section */}
          <div id="my-tour-diaries">
            <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white">
              Recent Diaries
            </h2>
            <div className="space-y-3">
              {savedDiaries.length === 0 && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No saved diaries found
                </p>
              )}
              
              {/* Show saved diaries from IndexedDB */}
              {savedDiaries.slice(0, 5).map((diary) => (
                <button
                  key={diary.id}
                  onClick={() => openSavedDiary(diary)}
                  className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-400 hover:shadow-md dark:border-emerald-800 dark:bg-slate-900 dark:hover:border-emerald-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {MONTHS[diary.month - 1]} {diary.year}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Total Distance: {diary.total_km.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-emerald-200/50 bg-white/80 backdrop-blur-sm dark:border-emerald-800/50 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-orange-500 p-4 shadow-lg">
                <div className="absolute right-2 top-2">
                  <BackButton onClick={() => setShowLandingPage(true)}>Back</BackButton>
                </div>
                <div className="pr-16">
                  <h1 className="flex items-center gap-2 text-xl font-black text-white">
                    <NotebookPen className="h-6 w-6" aria-label="Tour Diary" />
                    Tour Diary
                  </h1>
                  <p className="text-sm font-semibold text-white/90">
                    Monthly Tour Diary with Journey Tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Officer Details */}
        <div className={`mb-6 rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Officer Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Officer Name</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                placeholder="Enter officer name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Designation</label>
              <select
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  setCustomDesignation('');
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select designation</option>
                {SEED_DESIGNATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {designation === 'Others' && (
                <input
                  type="text"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  placeholder="Enter designation"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">District</label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMandal('');
                  setDivision('');
                  setCustomDistrict('');
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select district</option>
                {TELANGANA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="Others">Others</option>
              </select>
              {district === 'Others' && (
                <input
                  type="text"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  placeholder="Enter district name"
                />
              )}
            </div>
            {designation !== 'District Agriculture Officer' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Division</label>
                <select
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setCustomDivision('');
                  }}
                  disabled={!district}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select division</option>
                  {district && district !== 'Others' && getDivisionsForDistrict(district).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {division === 'Others' && (
                  <input
                    type="text"
                    value={customDivision}
                    onChange={(e) => setCustomDivision(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                    placeholder="Enter division name"
                  />
                )}
              </div>
            )}
            {designation === 'Mandal Agriculture Officer' || designation === 'Others' || designation === '' ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Mandal</label>
                <select
                  value={mandal}
                  onChange={(e) => {
                    setMandal(e.target.value);
                    setCustomMandal('');
                  }}
                  disabled={!district}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select mandal</option>
                  {district && district !== 'Others' && getMandalsForDistrict(district).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {mandal === 'Others' && (
                  <input
                    type="text"
                    value={customMandal}
                    onChange={(e) => setCustomMandal(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                    placeholder="Enter mandal name"
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Month/Year Selection */}
        <div className={`mb-6 rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveDraftToLocal}
                disabled={isSavingDraft}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDraft ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </button>
              <button
                onClick={openEditablePreview}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => generatePDF()}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    PDF
                  </>
                )}
              </button>
              <button
                onClick={generateExcel}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
              >
                <Table className="h-4 w-4" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className={`mb-6 rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Working Days</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.workingDays}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tour Days</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.tourDays}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30 col-span-2 sm:col-span-3 lg:col-span-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Holidays & Non-Working Days</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Sundays:</span>
                  <span className="ml-1 font-black text-orange-700 dark:text-orange-400">{summary.sundays}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Second Saturdays:</span>
                  <span className="ml-1 font-black text-orange-700 dark:text-orange-400">{summary.secondSaturdays}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Government Holidays:</span>
                  <span className="ml-1 font-black text-orange-700 dark:text-orange-400">{summary.governmentHolidays}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Optional Holidays:</span>
                  <span className="ml-1 font-black text-orange-700 dark:text-orange-400">{summary.optionalHolidays}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No. of Optional Holidays Availed</p>
              <p className="text-lg font-black text-purple-700 dark:text-purple-400">{summary.optionalHolidaysAvailed}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No. of Leaves Availed</p>
              <p className="text-lg font-black text-gray-700 dark:text-gray-400">{summary.leavesAvailed}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Distance</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.totalDistance.toFixed(1)} km</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Closing Meter</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.closingMeter.toFixed(1)}</p>
            </div>
          </div>
          {summary.isReconciled ? (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Meter readings reconciled
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Meter reconciliation requires review
            </div>
          )}
        </div>

        {/* Monthly Diary */}
        <div className={`space-y-3 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1).map(day => {
            const date = formatDate(currentYear, currentMonth, day);
            const dayName = getDayName(currentYear, currentMonth, day);
            const displayedHolidays = getDisplayedHolidaysForDate(date);
            const dateOverride = dateStatusOverrides[date];
            const dayJourneys = getJourneysForDate(date);
            const isSundayDay = isSunday(currentYear, currentMonth, day);
            const isSecondSaturdayDay = isSecondSaturday(currentYear, currentMonth, day);

            return (
              <div
                key={date}
                className="relative rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80"
              >
                {/* Three-dot action menu - absolutely positioned at top-right */}
                <div className="absolute right-4 top-4 z-10">
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === date ? null : date)}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-900"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {actionMenuOpen === date && (
                      <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-emerald-200 bg-white shadow-lg dark:border-emerald-800 dark:bg-slate-800">
                        <div className="py-1">
                          {/* When marked as Working Day - show Cancel Leave if leave is availed, otherwise Restore Default */}
                          {dateOverride?.status === 'WORKING' && getDateLeaveType(date) !== 'NONE' && (
                            <button
                              onClick={() => cancelLeave(date)}
                              className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                            >
                              Cancel Leave
                            </button>
                          )}
                          {dateOverride?.status === 'WORKING' && getDateLeaveType(date) === 'NONE' && (
                            <button
                              onClick={() => restoreDefaultStatus(date)}
                              className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                            >
                              Restore Default
                            </button>
                          )}
                          {/* For holidays, Sundays, Second Saturdays - show only Mark as Working Day and Remarks */}
                          {dateOverride?.status !== 'WORKING' && (isSundayDay || isSecondSaturdayDay || displayedHolidays.some(h => h.holiday_type === 'GENERAL')) && !displayedHolidays.some(h => h.holiday_type === 'OPTIONAL') && (
                            <>
                              <button
                                onClick={() => markAsWorkingDay(date)}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                              >
                                Mark as Working Day
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  setRemarksDialogOpen(date);
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                              >
                                Remarks
                              </button>
                            </>
                          )}
                          {/* For normal working days - show leave management options */}
                          {dateOverride?.status !== 'WORKING' && !isSundayDay && !isSecondSaturdayDay && !displayedHolidays.some(h => h.holiday_type === 'GENERAL') && !displayedHolidays.some(h => h.holiday_type === 'OPTIONAL') && (
                            <>
                              {getDateLeaveType(date) === 'NONE' && (
                                <button
                                  onClick={() => availLeave(date)}
                                  className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                >
                                  Avail Leave
                                </button>
                              )}
                              {getDateLeaveType(date) === 'NORMAL_LEAVE' && (
                                <button
                                  onClick={() => cancelLeave(date)}
                                  className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                >
                                  Cancel Leave
                                </button>
                              )}
                            </>
                          )}
                          {/* For optional holidays - show optional holiday specific actions */}
                          {dateOverride?.status !== 'WORKING' && displayedHolidays.some(h => h.holiday_type === 'OPTIONAL') && (
                            <>
                              {getDateLeaveType(date) === 'NONE' && (
                                <>
                                  <button
                                    onClick={() => availOptionalHoliday(date)}
                                    className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                  >
                                    Avail Optional Holiday
                                  </button>
                                  <button
                                    onClick={() => availLeaveOnOptionalHoliday(date)}
                                    className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                  >
                                    Avail Leave
                                  </button>
                                </>
                              )}
                              {getDateLeaveType(date) === 'OPTIONAL_HOLIDAY' && (
                                <button
                                  onClick={() => cancelOptionalHoliday(date)}
                                  className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                >
                                  Cancel Optional Holiday
                                </button>
                              )}
                              {getDateLeaveType(date) === 'OPTIONAL_HOLIDAY_LEAVE' && (
                                <button
                                  onClick={() => cancelLeave(date)}
                                  className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900"
                                >
                                  Cancel Leave
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3 pr-12">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {date} - {dayName}
                  </h3>
                  {isSundayDay && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                      🔵 WEEKLY HOLIDAY
                    </span>
                  )}
                  {isSecondSaturdayDay && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                      🟠 2ND SATURDAY
                    </span>
                  )}
                  {displayedHolidays.map((holiday) => (
                    <span key={`${holiday.id}-${holiday.holiday_type}`} className={`mr-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${holiday.holiday_type === 'GENERAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'border border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200'}`}>
                      {holiday.holiday_name} - {getHolidayTypeLabel(holiday.holiday_type)}
                      {getDateLeaveType(date) === 'OPTIONAL_HOLIDAY' && holiday.holiday_type === 'OPTIONAL' && (
                        <span className="ml-1 text-[9px]">✓ Availed</span>
                      )}
                    </span>
                  ))}
                  {getDateLeaveType(date) === 'NORMAL_LEAVE' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
                      ✓ Leave Availed
                    </span>
                  )}
                  {getDateLeaveType(date) === 'OPTIONAL_HOLIDAY_LEAVE' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
                      ✓ Leave Availed
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {!isTourEntryDisabled(date) && (
                    <button
                      onClick={() => openJourneyForm(date)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
                      >
                        <Plus className="h-3 w-3" />
                        Add Journey
                      </button>
                    )}
                </div>

                {dateOverride && dateOverride.status !== 'WORKING' && (
                  <div className="mb-3 max-w-md">
                    <label className="mb-1 block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Holiday Name</label>
                    <input
                      type="text"
                      value={dateOverride.holiday_name}
                      onChange={(e) => updateDateStatusOverrideName(date, e.target.value)}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {dayJourneys.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No journey recorded</p>
                ) : (
                  <div className="space-y-2">
                    {dayJourneys.map((journey, idx) => (
                      <div
                        key={journey.id}
                        className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {journey.from_place} → {journey.to_place}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {formatTime(journey.time_from)} - {formatTime(journey.time_to)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editJourney(journey)}
                              className="rounded-lg bg-blue-100 p-1.5 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteJourney(journey.id)}
                              className="rounded-lg bg-red-100 p-1.5 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {journey.mode === 'Others' ? journey.custom_mode_of_journey : journey.mode} | {journey.purpose === 'Others' ? journey.custom_purpose : journey.purpose}
                        </p>
                        {journey.remarks && (
                          <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Remarks: {journey.remarks}
                          </p>
                        )}
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          Meter: {journey.meter_from.toFixed(1)} → {journey.meter_to.toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>

      {/* Journey Form Modal */}
      {showJourneyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-emerald-200/50 bg-white p-6 shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              {editingJourney ? 'Edit Journey' : 'Add Journey'}
              {selectedDate && <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-300"> - {selectedDate}</span>}
            </h2>

            <div className="space-y-4">
              {/* Landscape-oriented form */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">From Place</label>
                  <input
                    type="text"
                    value={formData.from_place}
                    onChange={(e) => setFormData({ ...formData, from_place: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">To Place</label>
                  <input
                    type="text"
                    value={formData.to_place}
                    onChange={(e) => setFormData({ ...formData, to_place: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value, custom_mode_of_journey: '' })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  >
                    {JOURNEY_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                {formData.mode === 'Others' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Specify Mode of Journey</label>
                    <input
                      type="text"
                      value={formData.custom_mode_of_journey}
                      onChange={(e) => setFormData({ ...formData, custom_mode_of_journey: e.target.value })}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                      placeholder="Enter custom mode of journey"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Time From</label>
                  <input
                    type="time"
                    value={formData.time_from}
                    onChange={(e) => setFormData({ ...formData, time_from: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Time To</label>
                  <input
                    type="time"
                    value={formData.time_to}
                    onChange={(e) => setFormData({ ...formData, time_to: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value, custom_purpose: '' })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Purpose</option>
                    {PURPOSES.map(purpose => (
                      <option key={purpose} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>
                {formData.purpose === 'Others' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Specify Purpose</label>
                    <input
                      type="text"
                      value={formData.custom_purpose}
                      onChange={(e) => setFormData({ ...formData, custom_purpose: e.target.value })}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                      placeholder="Enter custom purpose"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Meter From</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.meter_from}
                    onChange={(e) => {
                      const meterFrom = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, meter_from: meterFrom, meter_to: meterFrom + formData.distance_km });
                    }}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Distance KM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.distance_km}
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, distance_km: distance, meter_to: formData.meter_from + distance });
                    }}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Meter To (Auto)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.meter_to}
                    readOnly
                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowJourneyForm(false)}
                  className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40"
                >
                  Cancel
                </button>
                <button
                  onClick={saveJourney}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  {editingJourney ? 'Update Journey' : 'Save Journey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Dialog for Holidays */}
      {remarksDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-200/50 bg-white p-6 shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Add Remarks</h2>
            <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
              {remarksDialogOpen} - {getDayName(currentYear, currentMonth, parseInt(remarksDialogOpen.split('-')[0]))}
            </p>
            <textarea
              value={dateRemarks[remarksDialogOpen] || ''}
              onChange={(e) => setDateRemarks({ ...dateRemarks, [remarksDialogOpen]: e.target.value })}
              rows={4}
              placeholder="Enter remarks for this date..."
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRemarksDialogOpen(null)}
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40"
              >
                Cancel
              </button>
              <button
                onClick={() => setRemarksDialogOpen(null)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-emerald-200/50 bg-white p-6 shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tour Diary Preview (Editable)</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40"
              >
                Close
              </button>
            </div>

            <div className="mb-4 rounded border border-gray-300 bg-white p-4">

              <div className="mb-4 grid grid-cols-2 gap-4 text-xs text-gray-900">
                <div>
                  <p>Month: {MONTHS[currentMonth - 1]} {currentYear}</p>
                  <p>Name: {officerName || officerInfo?.name || ''}</p>
                  <p>Designation: {getHeaderDesignation()}</p>
                </div>
                <div>
                  {shouldShowHeaderMandal() && <p>Mandal: {getHeaderMandal()}</p>}
                  {shouldShowHeaderDivision() && <p>Division: {getHeaderDivision()}</p>}
                  <p>District: {getHeaderDistrict()}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-900 text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" rowSpan={2}>Date</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" colSpan={2}>VISITING PLACE</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" colSpan={2}>VISITING TIME</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" rowSpan={2}>MODE OF JOURNEY</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" colSpan={2}>METER READING</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" rowSpan={2}>DISTANCE (Km)</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" rowSpan={2}>PURPOSE OF VISIT</th>
                    </tr>
                    <tr className="border-b border-gray-900">
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">FROM</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">TO</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">FROM</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">TO</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">From</th>
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editablePreviewData.length > 0 ? editablePreviewData : generateTourDiaryData()).map((row, rowIndex) => {
                      const specialDateStatus = getSpecialDateStatusForRow(row);

                      return (
                        <tr key={rowIndex} className="border-b border-gray-300">
                          {specialDateStatus ? (
                            <>
                              <td className="border border-gray-900 px-2 py-1 align-middle">
                                <input
                                  type="text"
                                  readOnly
                                  value={row[0] || ''}
                                  className="w-full bg-transparent text-xs outline-none"
                                />
                              </td>
                              <td colSpan={TOUR_DIARY_COLUMN_COUNT - 1} className="border border-gray-900 px-2 py-1 text-center align-middle">
                                <input
                                  type="text"
                                  readOnly
                                  value={specialDateStatus.label}
                                  className="w-full bg-transparent text-center text-xs font-bold outline-none"
                                />
                              </td>
                            </>
                          ) : (
                            row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="border border-gray-900 px-2 py-1 text-center">
                                <input
                                  type="text"
                                  defaultValue={cell}
                                  className="w-full bg-transparent text-center text-xs outline-none focus:bg-blue-50"
                                  onChange={(e) => {
                                    const newData = [...editablePreviewData];
                                    if (!newData[rowIndex]) newData[rowIndex] = [...row];
                                    newData[rowIndex][cellIndex] = e.target.value;
                                    setEditablePreviewData(newData);
                                  }}
                                />
                              </td>
                            ))
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-gray-900">
                <p>Total Distance: {summary.totalDistance.toFixed(0)}</p>
              </div>

              <div className="mt-4 text-xs text-gray-900">
                <p className="font-bold">ABSTRACT</p>
                <p>Total No of Working Days: {summary.workingDays}</p>
                <p>Total No of Days on Tour: {summary.tourDays}</p>
                <p>Total No of Holidays availed: {summary.sundays + summary.secondSaturdays + summary.governmentHolidays + summary.optionalHolidaysAvailed}</p>
                <p>No of Villages Visited: {summary.villagesVisited}</p>
                <p>Leaves availed: {summary.leavesAvailed}</p>
              </div>

              {/* Signature section - conditional based on officer designation */}
              <div className="mt-2 flex flex-col pl-12">
                {(() => {
                  const normalizedDesignation = normalizeHeaderDesignation(getHeaderDesignation());
                  if (normalizedDesignation === 'mandal agriculture officer') {
                    return (
                      <div className="flex justify-between text-xs font-bold text-gray-900">
                        <span>Mandal Agriculture Officer</span>
                        <span>Asst.Director of Agriculture</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex justify-end text-xs font-bold text-gray-900">
                        <span>Asst.Director of Agriculture</span>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (editablePreviewData.length > 0) {
                    generatePDF(editablePreviewData);
                  } else {
                    generatePDF();
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Prompt Modal */}
      {showRecoveryPrompt && recoveryDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-amber-200/50 bg-white/95 p-6 shadow-2xl dark:border-amber-800/50 dark:bg-slate-900/95">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Unsaved Tour Diary Found</h2>
            <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">A previous unsaved Tour Diary was found for:</p>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{recoveryDraft.officerName}</p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{MONTHS[recoveryDraft.month - 1]} {recoveryDraft.year}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={discardRecoveryState} className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40">Discard</button>
              <button onClick={restoreRecoveryState} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 h-[90vh] w-full max-w-5xl rounded-2xl border border-blue-200/50 bg-white shadow-2xl dark:border-blue-800/50 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pdfPreview.fileName}</h2>
              <button 
                onClick={() => setPdfPreview(null)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(90vh-60px)] overflow-auto bg-slate-100 dark:bg-slate-950">
              <iframe
                src={URL.createObjectURL(pdfPreview.blob)}
                className="h-full w-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
