import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { Plus, FileText, Table, Edit, Trash2, ChevronLeft, ChevronRight, Car, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TELANGANA_DISTRICTS, getMandalsForDistrict, SEED_DESIGNATION_OPTIONS } from '../data/telanganaDistrictMandalData';

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
  mandal: string;
  division: string;
  district: string;
  month: number;
  year: number;
  journeys: TourJourney[];
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

interface Holiday {
  id: string;
  year: number;
  date: string;
  holiday_name: string;
  holiday_type: string;
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

const JOURNEY_MODES = [
  'Car', 'Government Vehicle', 'Hired Vehicle', 'Bus', 'Others'
];

const PURPOSES = [
  'FIVES', 'Crop Booking Enhancement', 'Rythu Nestham VC', 'Field Inspection',
  'Pest & Disease Surveillance', 'Farmer Field Visit', 'Input Dealer Shop Inspection',
  'License Verification', 'Sample Collection', 'Meeting', 'NMNF Awareness Programme',
  'Government Programme', 'Review Meeting', 'Office Work', 'Orientation Programme', 'Others'
];

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

function formatDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
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
  const [officerInfo, setOfficerInfo] = useState<OfficerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJourneyForm, setShowJourneyForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingJourney, setEditingJourney] = useState<TourJourney | null>(null);
  
  // Officer details state
  const [officerName, setOfficerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [division, setDivision] = useState('');
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editablePreviewData, setEditablePreviewData] = useState<any[]>([]);
  
  // Draft state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showLoadDraftModal, setShowLoadDraftModal] = useState(false);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>('');
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<TourDiaryDraft | null>(null);
  
  // Form state
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

  // Initialize
  useEffect(() => {
    setMounted(true);
    loadOfficerInfo();
    
    // Check for recovery state
    const recovery = getRecoveryState();
    if (recovery) {
      setRecoveryDraft(recovery);
      setShowRecoveryPrompt(true);
    }
  }, []);

  // Load data when month/year changes
  useEffect(() => {
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
      journeys
    });
    
    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    }
  }, [officerName, designation, district, mandal, division, journeys, lastSavedState]);

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
  }, [hasUnsavedChanges, officerName, designation, district, mandal, division, journeys, currentMonth, currentYear, tourDiary]);

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


  // Save draft to localStorage
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
      const draftId = generateDraftId(officerName, currentYear, currentMonth);
      const drafts = getDrafts();
      const existingDraftIndex = drafts.findIndex(d => d.id === draftId);

      const newDraft: TourDiaryDraft = {
        version: DRAFT_VERSION,
        id: draftId,
        officerName,
        designation,
        mandal,
        division,
        district,
        month: currentMonth,
        year: currentYear,
        journeys,
        openingMeter: tourDiary?.opening_meter || 0,
        closingMeter: tourDiary?.closing_meter || null,
        totalKm: tourDiary?.total_km || 0,
        createdAt: existingDraftIndex >= 0 ? drafts[existingDraftIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingDraftIndex >= 0) {
        // Update existing draft
        if (confirm(`A draft for ${MONTHS[currentMonth - 1]} ${currentYear} already exists.\n\nDo you want to update the existing draft?`)) {
          drafts[existingDraftIndex] = newDraft;
          if (!saveDrafts(drafts)) {
            throw new Error('Failed to save draft to localStorage');
          }
          setLastSaved(new Date());
          setLastSavedState(JSON.stringify({
            officerName,
            designation,
            district,
            mandal,
            division,
            journeys
          }));
          setHasUnsavedChanges(false);
          alert('✓ Draft updated successfully');
        } else {
          setIsSavingDraft(false);
          return;
        }
      } else {
        // Create new draft
        drafts.push(newDraft);
        if (!saveDrafts(drafts)) {
          throw new Error('Failed to save draft to localStorage');
        }
        setLastSaved(new Date());
        setLastSavedState(JSON.stringify({
          officerName,
          designation,
          district,
          mandal,
          division,
          journeys
        }));
        setHasUnsavedChanges(false);
        alert(`✓ ${MONTHS[currentMonth - 1]} ${currentYear} draft saved successfully`);
      }

      clearRecoveryState();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Unable to save the draft locally. Please check available browser storage.');
    } finally {
      setIsSavingDraft(false);
    }
  }

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
      setMandal(draft.mandal);
      setDivision(draft.division);
      setDistrict(draft.district);
      setCurrentYear(draft.year);
      setCurrentMonth(draft.month);
      
      // Add backward compatibility for old drafts without custom fields
      const backwardCompatibleJourneys = draft.journeys.map(journey => ({
        ...journey,
        custom_mode_of_journey: journey.custom_mode_of_journey || null,
        custom_purpose: journey.custom_purpose || null
      }));
      
      setJourneys(backwardCompatibleJourneys);

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
        journeys: draft.journeys
      }));
      setHasUnsavedChanges(false);
      setShowLoadDraftModal(false);
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

  // Get filtered drafts
  function getFilteredDrafts(): TourDiaryDraft[] {
    const drafts = getDrafts();
    const searchTerm = draftSearchTerm.toLowerCase();

    return drafts
      .filter(draft => {
        if (!searchTerm) return true;
        return (
          draft.officerName.toLowerCase().includes(searchTerm) ||
          MONTHS[draft.month - 1].toLowerCase().includes(searchTerm) ||
          draft.year.toString().includes(searchTerm)
        );
      })
      .sort((a, b) => {
        // Sort by year DESC, month DESC, updatedAt DESC
        if (b.year !== a.year) return b.year - a.year;
        if (b.month !== a.month) return b.month - a.month;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  // Restore recovery state
  function restoreRecoveryState() {
    if (recoveryDraft) {
      loadDraftFromLocal(recoveryDraft);
      setShowRecoveryPrompt(false);
      setRecoveryDraft(null);
    }
  }

  // Discard recovery state
  function discardRecoveryState() {
    clearRecoveryState();
    setShowRecoveryPrompt(false);
    setRecoveryDraft(null);
  }

  // Create new tour diary
  function createNewTourDiary(year: number, month: number) {
    const draftId = generateDraftId(officerName || 'Officer', year, month);
    const existingDraft = getDrafts().find(d => d.id === draftId);

    if (existingDraft) {
      if (confirm(`A ${MONTHS[month - 1]} ${year} draft already exists.\n\n[Load Existing]\n[Start New]\n[Cancel]`)) {
        loadDraftFromLocal(existingDraft);
      }
    } else {
      setCurrentYear(year);
      setCurrentMonth(month);
      setJourneys([]);
      setTourDiary(null);
      setLastSavedState('');
      setHasUnsavedChanges(false);
      alert(`✓ New ${MONTHS[month - 1]} ${year} Tour Diary created`);
    }
    setShowNewDiaryModal(false);
  }

  // Load journeys for current month
  async function loadJourneys() {
    // Journeys are now managed locally through the draft system
    // This function is kept for compatibility but does nothing
    setJourneys([]);
  }

  // Load holidays for current year
  async function loadHolidays() {
    try {
      const { data, error } = await supabase
        .from('holiday_calendar')
        .select('*')
        .eq('year', currentYear)
        .eq('active', true)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading holidays:', error);
        setHolidays([]);
        return;
      }
      setHolidays(data || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      setHolidays([]);
    }
  }

  // Get holiday for a specific date
  function getHolidayForDate(date: string): Holiday | null {
    return holidays.find(h => h.date === date) || null;
  }

  // Get journeys for a specific date
  function getJourneysForDate(date: string): TourJourney[] {
    return journeys.filter(j => j.journey_date === date);
  }

  // Calculate monthly summary
  function calculateMonthlySummary() {
    const totalDistance = journeys.reduce((sum, j) => sum + j.distance_km, 0);
    const tourDays = new Set(journeys.map(j => j.journey_date)).size;
    const sundays = [];
    const governmentHolidays = [];
    const optionalHolidays = [];

    for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
      const date = formatDate(currentYear, currentMonth, day);
      if (isSunday(currentYear, currentMonth, day)) {
        sundays.push(date);
      }
      const holiday = getHolidayForDate(date);
      if (holiday) {
        if (holiday.holiday_type === 'GENERAL') {
          governmentHolidays.push(date);
        } else if (holiday.holiday_type === 'OPTIONAL') {
          optionalHolidays.push(date);
        }
      }
    }

    // Calculate meter readings from journeys
    const meterReadings = journeys.map(j => j.meter_to);
    const closingMeter = meterReadings.length > 0 ? Math.max(...meterReadings) : 0;
    const openingMeter = journeys.length > 0 ? Math.min(...journeys.map(j => j.meter_from)) : 0;

    return {
      totalDistance,
      tourDays,
      totalJourneys: journeys.length,
      sundays: sundays.length,
      governmentHolidays: governmentHolidays.length,
      optionalHolidays: optionalHolidays.length,
      openingMeter,
      closingMeter,
      isReconciled: Math.abs((closingMeter - openingMeter) - totalDistance) < 0.1
    };
  }

  // Open journey form for new journey
  function openJourneyForm(date: string, continueFrom?: TourJourney) {
    setSelectedDate(date);
    setEditingJourney(null);

    const previousJourney = continueFrom || getJourneysForDate(date).slice(-1)[0];
    const lastJourney = journeys.slice(-1)[0];

    setFormData({
      journey_date: date,
      from_place: continueFrom?.to_place || previousJourney?.to_place || mandal || officerInfo?.mandal || '',
      to_place: '',
      time_from: '09:00',
      time_to: '17:30',
      mode: 'Car',
      custom_mode_of_journey: '',
      meter_from: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      distance_km: 0,
      meter_to: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      purpose: '',
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
      // Validation
      if (!formData.from_place || !formData.to_place) {
        alert('Please enter both From and To places');
        return;
      }
      if (!formData.purpose) {
        alert('Please select a purpose');
        return;
      }
      if (formData.distance_km < 0) {
        alert('Distance cannot be negative');
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
  function deleteJourney(journey: TourJourney) {
    if (!confirm('Are you sure you want to delete this journey?')) return;

    // Remove journey from local state
    setJourneys(prev => prev.filter(j => j.id !== journey.id));
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
    
    for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
      const date = formatDate(currentYear, currentMonth, day);
      const holiday = getHolidayForDate(date);
      const dayJourneys = getJourneysForDate(date);

      if (dayJourneys.length === 0) {
        if (isSunday(currentYear, currentMonth, day)) {
          tableData.push([date, '-', '-', '-', '-', '-', '-', '-', '-', 'SUNDAY']);
        } else if (holiday) {
          tableData.push([date, '-', '-', '-', '-', '-', '-', '-', '-', holiday.holiday_name.toUpperCase()]);
        } else {
          tableData.push([date, '-', '-', '-', '-', '-', '-', '-', '-', '-']);
        }
      } else {
        dayJourneys.forEach(journey => {
          const displayMode = journey.mode === 'Others' ? (journey.custom_mode_of_journey || '') : journey.mode;
          const displayPurpose = journey.purpose === 'Others' ? (journey.custom_purpose || '') : journey.purpose;
          
          tableData.push([
            date,
            journey.from_place,
            journey.to_place,
            formatTime(journey.time_from),
            formatTime(journey.time_to),
            displayMode,
            journey.meter_from.toFixed(0),
            journey.meter_to.toFixed(0),
            journey.distance_km.toFixed(0),
            displayPurpose
          ]);
        });
      }
    }
    
    return tableData;
  }

  // Generate PDF - Match reference Excel format, fit on one page
  async function generatePDF(customTableData?: any[][]) {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const summary = calculateMonthlySummary();
      const tableData = customTableData || generateTourDiaryData();

      // Header - TOUR DIARY OF format
      doc.setFontSize(8);
      const monthYear = `${MONTHS[currentMonth - 1]} ${currentYear}`;
      
      let xPos = 14;
      const yPos = 12;
      
      // Tour Diary of (regular)
      doc.setFont('helvetica', 'normal');
      doc.text('Tour Diary of ', xPos, yPos);
      xPos += doc.getTextWidth('Tour Diary of ');
      
      // Officer name (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${officerName || officerInfo?.name || ''}`, xPos, yPos);
      xPos += doc.getTextWidth(`${officerName || officerInfo?.name || ''}`);
      
      // , (regular)
      doc.setFont('helvetica', 'normal');
      doc.text(', ', xPos, yPos);
      xPos += doc.getTextWidth(', ');
      
      // Designation (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${designation || officerInfo?.designation || ''}`, xPos, yPos);
      xPos += doc.getTextWidth(`${designation || officerInfo?.designation || ''}`);
      
      // , Mandal: (regular)
      doc.setFont('helvetica', 'normal');
      doc.text(', Mandal: ', xPos, yPos);
      xPos += doc.getTextWidth(', Mandal: ');
      
      // Mandal (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${mandal || officerInfo?.mandal || ''}`, xPos, yPos);
      xPos += doc.getTextWidth(`${mandal || officerInfo?.mandal || ''}`);
      
      // , Division: (regular)
      doc.setFont('helvetica', 'normal');
      doc.text(', Division: ', xPos, yPos);
      xPos += doc.getTextWidth(', Division: ');
      
      // Division (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${division || officerInfo?.division || ''}`, xPos, yPos);
      xPos += doc.getTextWidth(`${division || officerInfo?.division || ''}`);
      
      // , Dist: (regular)
      doc.setFont('helvetica', 'normal');
      doc.text(', Dist: ', xPos, yPos);
      xPos += doc.getTextWidth(', Dist: ');
      
      // District (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${district || officerInfo?.district || ''}`, xPos, yPos);
      xPos += doc.getTextWidth(`${district || officerInfo?.district || ''}`);
      
      // For the Month of (regular)
      doc.setFont('helvetica', 'normal');
      doc.text(' for the Month of ', xPos, yPos);
      xPos += doc.getTextWidth(' for the Month of ');
      
      // Month Year (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(monthYear, xPos, yPos);

      // Generate table with merged header cells - compact for one page
      autoTable(doc, {
        startY: 18,
        margin: { left: 14, right: 89 },
        head: [
          ['Date', 'VISITING PLACE', '', 'VISITING TIME', '', 'MODE OF JOURNEY', 'METER READING', '', 'DISTANCE TRAVELLED (KM)', 'PURPOSE OF VISIT'],
          ['', 'FROM', 'TO', 'FROM', 'TO', '', 'From', 'To', '', '']
        ],
        body: tableData,
        styles: { fontSize: 6, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2, lineColor: [0, 0, 0], fontSize: 6 },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        columnStyles: {
          0: { cellWidth: 14 },
          1: { cellWidth: 26 },
          2: { cellWidth: 26 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 17 },
          6: { cellWidth: 15 },
          7: { cellWidth: 13 },
          8: { cellWidth: 18 },
          9: { cellWidth: 35 }
        }
      });

      // Abstract section - Compact layout
      const finalY = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Distance: ${summary.totalDistance.toFixed(0)}`, 14, finalY);
      
      // ABSTRACT section - 2 column compact layout
      const abstractY = finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.text('ABSTRACT', 14, abstractY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${officerName || officerInfo?.name || ''} | ${designation || officerInfo?.designation || ''} | ${mandal || officerInfo?.mandal || ''}`, 250, abstractY, { align: 'right' });
      doc.text(`Total No of Working Days: ${summary.tourDays}`, 14, abstractY + 5);
      doc.text(`Total No of Days on Tour: ${summary.tourDays}`, 14, abstractY + 9);
      doc.text(`Total No of Holidays availed: ${summary.sundays + summary.governmentHolidays}`, 14, abstractY + 13);
      doc.text(`No of Villages Visited: ${summary.totalJourneys}`, 14, abstractY + 17);
      doc.text(`Leaves availed: 0`, 14, abstractY + 21);

      doc.save(`Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
      const monthYear = `${MONTHS[currentMonth - 1]} ${currentYear}`;
      const diaryData = [
        [`TOUR DIARY OF ${officerName || officerInfo?.name || ''}, ${designation || officerInfo?.designation || ''}, MANDAL: ${mandal || officerInfo?.mandal || ''}, DIVISION: ${division || officerInfo?.division || ''}, DIST: ${district || officerInfo?.district || ''} FOR THE MONTH OF ${monthYear}`],
        [''],
        ['Date', 'VISITING PLACE', '', 'VISITING TIME', '', 'MODE OF JOURNEY', 'METER READING', '', 'DISTANCE TRAVELLED (KM)', 'PURPOSE OF VISIT'],
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
      diaryData.push(['', 'Total No of Holidays availed', String(summary.sundays + summary.governmentHolidays)]);
      diaryData.push(['', 'No of Villages Visited', String(summary.totalJourneys)]);
      diaryData.push(['', 'Leaves availed', '0']);

      // Add signature section
      diaryData.push(['']);
      diaryData.push(['']);
      diaryData.push(['']);
      diaryData.push(['', '', '', '', '', '', '', '', '', officerName || officerInfo?.name || '']);
      diaryData.push(['', '', '', '', '', '', '', '', '', designation || officerInfo?.designation || '']);
      diaryData.push(['', '', '', '', '', '', '', '', '', mandal || officerInfo?.mandal || '']);

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

  const summary = calculateMonthlySummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-emerald-200/50 bg-white/80 backdrop-blur-sm dark:border-emerald-800/50 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton onClick={() => navigate('/officer-toolkit')}>Back</BackButton>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white">Tour Diary</h1>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {officerInfo?.name} - {officerInfo?.designation}
                </p>
              </div>
            </div>
            <LanguageToggle language="en" onClick={() => {}} />
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
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select designation</option>
                {SEED_DESIGNATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">District</label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMandal('');
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select district</option>
                {TELANGANA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Division</label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                placeholder="Enter division"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Mandal</label>
              <select
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                disabled={!district}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white disabled:opacity-50"
              >
                <option value="">Select mandal</option>
                {district && getMandalsForDistrict(district).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          {lastSaved && (
            <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Draft saved: {lastSaved.toLocaleString()}
            </div>
          )}
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
                onClick={() => setShowNewDiaryModal(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                New Tour Diary
              </button>
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
                onClick={() => setShowLoadDraftModal(true)}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
              >
                <Table className="h-4 w-4" />
                Load Draft
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={generatePDF}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tour Days</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.tourDays}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Journeys</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.totalJourneys}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Distance</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.totalDistance.toFixed(1)} KM</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sundays</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.sundays}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Govt Holidays</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.governmentHolidays}</p>
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
            const holiday = getHolidayForDate(date);
            const dayJourneys = getJourneysForDate(date);
            const isSundayDay = isSunday(currentYear, currentMonth, day);

            return (
              <div
                key={date}
                className="rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {date} - {dayName}
                    </h3>
                    {isSundayDay && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        🔵 WEEKLY HOLIDAY
                      </span>
                    )}
                    {holiday && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${holiday.holiday_type === 'GENERAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'}`}>
                        {holiday.holiday_type === 'GENERAL' ? '🔴' : '🟣'} {holiday.holiday_type} HOLIDAY - {holiday.holiday_name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openJourneyForm(date)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
                  >
                    <Plus className="h-3 w-3" />
                    Add Journey
                  </button>
                </div>

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
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {formatTime(journey.time_from)} - {formatTime(journey.time_to)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editJourney(journey)}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteJourney(journey)}
                              className="rounded p-1 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            {idx < dayJourneys.length - 1 && (
                              <button
                                onClick={() => openJourneyForm(date, journey)}
                                className="ml-2 rounded px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-200 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {journey.from_place} → {journey.to_place}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {journey.distance_km.toFixed(1)} KM • {journey.purpose}
                        </p>
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
              <div className="mb-4 text-center">
                <p className="text-base font-bold text-gray-900">TOUR DIARY</p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-4 text-xs text-gray-900">
                <div>
                  <p>Month: {MONTHS[currentMonth - 1]} {currentYear}</p>
                  <p>Name: {officerName || officerInfo?.name || ''}</p>
                  <p>Designation: {designation || officerInfo?.designation || ''}</p>
                </div>
                <div>
                  <p>Mandal: {mandal || officerInfo?.mandal || ''}</p>
                  <p>District: {district || officerInfo?.district || ''}</p>
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
                      <th className="border border-gray-900 px-2 py-1 text-left font-bold" rowSpan={2}>DISTANCE TRAVELLED</th>
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
                    {generateTourDiaryData().map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-300">
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="border border-gray-900 px-2 py-1">
                            <input
                              type="text"
                              defaultValue={cell}
                              className="w-full bg-transparent text-xs outline-none focus:bg-blue-50"
                              onChange={(e) => {
                                const newData = [...editablePreviewData];
                                if (!newData[rowIndex]) newData[rowIndex] = [...row];
                                newData[rowIndex][cellIndex] = e.target.value;
                                setEditablePreviewData(newData);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-gray-900">
                <p>Total Distance: {summary.totalDistance.toFixed(0)}</p>
              </div>

              <div className="mt-4 text-xs text-gray-900">
                <p className="font-bold">ABSTRACT</p>
                <p>Total No of Working Days: {summary.tourDays}</p>
                <p>Total No of Days on Tour: {summary.tourDays}</p>
                <p>Total No of Holidays availed: {summary.sundays + summary.governmentHolidays}</p>
                <p>No of Villages Visited: {summary.totalJourneys}</p>
                <p>Leaves availed: 0</p>
              </div>

              <div className="mt-6 text-right text-xs text-gray-900">
                <p>{officerName || officerInfo?.name || ''}</p>
                <p>{designation || officerInfo?.designation || ''}</p>
                <p>{mandal || officerInfo?.mandal || ''}</p>
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
                  generatePDF();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {showLoadDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-200/50 bg-white/95 p-6 shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900/95">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">LOAD TOUR DIARY DRAFT</h2>
            <div className="mb-4">
              <input type="text" placeholder="Search drafts..." value={draftSearchTerm} onChange={(e) => setDraftSearchTerm(e.target.value)} className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white" />
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{officerName ? `Officer: ${officerName}` : 'All Officers'}</p>
            </div>
            <div className="space-y-3">
              {getFilteredDrafts().length === 0 ? (
                <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No drafts found</p>
              ) : (
                getFilteredDrafts().map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{draft.officerName}</p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{MONTHS[draft.month - 1]} {draft.year}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-500">{draft.journeys.length} tour entries</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-500">Last saved: {new Date(draft.updatedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadDraftFromLocal(draft)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Load</button>
                        <button onClick={() => deleteDraftFromLocal(draft.id, draft.month, draft.year)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowLoadDraftModal(false)} className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Tour Diary Modal */}
      {showNewDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-emerald-200/50 bg-white/95 p-6 shadow-2xl dark:border-emerald-800/50 dark:bg-slate-900/95">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">NEW TOUR DIARY</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Month</label>
                <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Year</label>
                <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white">
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowNewDiaryModal(false)} className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40">Cancel</button>
              <button onClick={() => createNewTourDiary(currentYear, currentMonth)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Create New Diary</button>
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

    </div>
  );
}
