import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { Plus, FileText, Table, Edit, Trash2, ChevronLeft, ChevronRight, Car, AlertCircle, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  meter_from: number;
  distance_km: number;
  meter_to: number;
  purpose: string;
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

const JOURNEY_MODES = [
  'Car', 'Motor Cycle', 'Government Vehicle', 'Private Vehicle', 'Bus', 'Train', 'Other'
];

const PURPOSES = [
  'Field Inspection', 'Crop Inspection', 'Pest & Disease Surveillance', 'Farmer Visit',
  'Dealer Inspection', 'Fertilizer Inspection', 'Seed Inspection', 'Pesticide Inspection',
  'License Verification', 'Sample Collection', 'Meeting', 'Training',
  'Government Programme', 'Review Meeting', 'Office Work', 'Other'
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
  
  // Form state
  const [formData, setFormData] = useState({
    journey_date: '',
    from_place: '',
    to_place: '',
    time_from: '09:00',
    time_to: '17:30',
    mode: 'Car',
    meter_from: 0,
    distance_km: 0,
    meter_to: 0,
    purpose: '',
    remarks: ''
  });

  // Load all data with proper loading state management
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTourDiary(),
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
      }
    } catch (error) {
      console.error('Error loading officer info:', error);
    }
  }

  // Load or create tour diary for current month
  async function loadTourDiary() {
    const { data, error } = await supabase
      .from('tour_diaries')
      .select('*')
      .eq('officer_id', user?.id)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading tour diary:', error);
      // If table doesn't exist, create a local placeholder
      setTourDiary({
        id: 'local',
        officer_id: user?.id || '',
        year: currentYear,
        month: currentMonth,
        opening_meter: 0,
        closing_meter: null,
        total_km: 0,
        status: 'Draft'
      });
      return;
    }

    if (!data) {
      // Create new diary
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Try to get previous month's closing meter
      let openingMeter = 0;
      const { data: prevDiary } = await supabase
        .from('tour_diaries')
        .select('closing_meter')
        .eq('officer_id', user?.id)
        .eq('year', previousYear)
        .eq('month', previousMonth)
        .single();

      if (prevDiary?.closing_meter) {
        openingMeter = prevDiary.closing_meter;
      }

      const { data: newDiary, error: createError } = await supabase
        .from('tour_diaries')
        .insert({
          officer_id: user?.id,
          year: currentYear,
          month: currentMonth,
          opening_meter: openingMeter,
          status: 'Draft'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating tour diary:', createError);
        // Create local placeholder if insert fails
        setTourDiary({
          id: 'local',
          officer_id: user?.id || '',
          year: currentYear,
          month: currentMonth,
          opening_meter: openingMeter,
          closing_meter: null,
          total_km: 0,
          status: 'Draft'
        });
        return;
      }
      setTourDiary(newDiary);
    } else {
      setTourDiary(data);
    }
  }

  // Load journeys for current month
  async function loadJourneys() {
    try {
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${getDaysInMonth(currentYear, currentMonth)}`;

      const { data, error } = await supabase
        .from('tour_journeys')
        .select('*')
        .eq('officer_id', user?.id)
        .gte('journey_date', startDate)
        .lte('journey_date', endDate)
        .order('journey_date', { ascending: true })
        .order('time_from', { ascending: true });

      if (error) {
        console.error('Error loading journeys:', error);
        setJourneys([]);
        return;
      }
      setJourneys(data || []);
    } catch (error) {
      console.error('Error loading journeys:', error);
      setJourneys([]);
    }
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

    const closingMeter = tourDiary?.closing_meter || (tourDiary?.opening_meter || 0) + totalDistance;
    const openingMeter = tourDiary?.opening_meter || 0;

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
      from_place: continueFrom?.to_place || previousJourney?.to_place || officerInfo?.mandal || '',
      to_place: '',
      time_from: '09:00',
      time_to: '17:30',
      mode: 'Car',
      meter_from: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      distance_km: 0,
      meter_to: continueFrom?.meter_to || previousJourney?.meter_to || lastJourney?.meter_to || tourDiary?.opening_meter || 0,
      purpose: '',
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
      meter_from: journey.meter_from,
      distance_km: journey.distance_km,
      meter_to: journey.meter_to,
      purpose: journey.purpose,
      remarks: journey.remarks || ''
    });

    setShowJourneyForm(true);
  }

  // Save journey
  async function saveJourney() {
    try {
      if (!tourDiary) {
        alert('Please create a tour diary first');
        return;
      }

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

      const journeyData = {
        tour_diary_id: tourDiary.id,
        officer_id: user?.id,
        journey_date: formData.journey_date,
        from_place: formData.from_place,
        to_place: formData.to_place,
        time_from: formData.time_from,
        time_to: formData.time_to,
        mode: formData.mode,
        meter_from: formData.meter_from,
        distance_km: formData.distance_km,
        purpose: formData.purpose,
        remarks: formData.remarks || null
      };

      if (editingJourney) {
        const { error } = await supabase
          .from('tour_journeys')
          .update(journeyData)
          .eq('id', editingJourney.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tour_journeys')
          .insert(journeyData);

        if (error) throw error;
      }

      // Update diary total
      await updateDiaryTotals();

      setShowJourneyForm(false);
      loadJourneys();
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Failed to save journey. Please try again.');
    }
  }

  // Delete journey
  async function deleteJourney(journey: TourJourney) {
    if (!confirm('Are you sure you want to delete this journey?')) return;

    try {
      const { error } = await supabase
        .from('tour_journeys')
        .delete()
        .eq('id', journey.id);

      if (error) throw error;

      await updateDiaryTotals();
      loadJourneys();
    } catch (error) {
      console.error('Error deleting journey:', error);
      alert('Failed to delete journey. Please try again.');
    }
  }

  // Update diary totals
  async function updateDiaryTotals() {
    if (!tourDiary) return;

    try {
      const summary = calculateMonthlySummary();
      const { error } = await supabase
        .from('tour_diaries')
        .update({
          closing_meter: summary.closingMeter,
          total_km: summary.totalDistance
        })
        .eq('id', tourDiary.id);

      if (error) throw error;

      loadTourDiary();
    } catch (error) {
      console.error('Error updating diary totals:', error);
    }
  }

  // Update opening meter
  async function updateOpeningMeter(value: number) {
    if (!tourDiary) return;

    try {
      const { error } = await supabase
        .from('tour_diaries')
        .update({ opening_meter: value })
        .eq('id', tourDiary.id);

      if (error) throw error;

      loadTourDiary();
    } catch (error) {
      console.error('Error updating opening meter:', error);
      alert('Failed to update opening meter. Please try again.');
    }
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

  // Generate PDF
  async function generatePDF() {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const summary = calculateMonthlySummary();

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GOVERNMENT OF TELANGANA', 148.5, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('DEPARTMENT OF AGRICULTURE', 148.5, 22, { align: 'center' });
      doc.setFontSize(18);
      doc.text('MONTHLY TOUR DIARY', 148.5, 32, { align: 'center' });

      // Officer Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const officerDetails = [
        [`Officer Name: ${officerInfo?.name || ''}`],
        [`Designation: ${officerInfo?.designation || ''}`],
        [`Office: ${officerInfo?.office || ''}`],
        [`Mandal: ${officerInfo?.mandal || ''}`],
        [`District: ${officerInfo?.district || ''}`],
        [`Month: ${MONTHS[currentMonth - 1]} ${currentYear}`]
      ];

      let yPos = 45;
      officerDetails.forEach((line) => {
        doc.text(line[0], 14, yPos);
        yPos += 6;
      });

      // Table data
      const tableData = [];
      let serialNo = 1;

      for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
        const date = formatDate(currentYear, currentMonth, day);
        const dayName = getDayName(currentYear, currentMonth, day);
        const holiday = getHolidayForDate(date);
        const dayJourneys = getJourneysForDate(date);

        if (dayJourneys.length === 0) {
          if (isSunday(currentYear, currentMonth, day)) {
            tableData.push([
              serialNo++,
              date,
              dayName,
              '-',
              '-',
              '-',
              '-',
              'WEEKLY HOLIDAY',
              '-',
              '-',
              '-',
              '-'
            ]);
          } else if (holiday) {
            tableData.push([
              serialNo++,
              date,
              dayName,
              '-',
              '-',
              '-',
              '-',
              `${holiday.holiday_type} HOLIDAY`,
              holiday.holiday_name,
              '-',
              '-',
              '-'
            ]);
          } else {
            tableData.push([
              serialNo++,
              date,
              dayName,
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              'No journey recorded'
            ]);
          }
        } else {
          dayJourneys.forEach(journey => {
            tableData.push([
              serialNo++,
              date,
              dayName,
              journey.from_place,
              journey.to_place,
              formatTime(journey.time_from),
              formatTime(journey.time_to),
              journey.mode,
              journey.meter_from.toFixed(1),
              journey.meter_to.toFixed(1),
              journey.distance_km.toFixed(1),
              journey.purpose
            ]);
          });
        }
      }

      // Generate table
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Sl. No.', 'Date', 'Day', 'From Place', 'To Place', 'Time From', 'Time To', 'Mode', 'Meter From', 'Meter To', 'Distance (KM)', 'Purpose']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 255, 240] }
      });

      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY SUMMARY', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Opening Meter Reading: ${summary.openingMeter.toFixed(1)}`, 14, finalY + 8);
      doc.text(`Closing Meter Reading: ${summary.closingMeter.toFixed(1)}`, 14, finalY + 16);
      doc.text(`Total Distance: ${summary.totalDistance.toFixed(1)} KM`, 14, finalY + 24);
      doc.text(`Total Tour Days: ${summary.tourDays}`, 14, finalY + 32);
      doc.text(`Total Journeys: ${summary.totalJourneys}`, 14, finalY + 40);
      doc.text(`Sundays: ${summary.sundays}`, 14, finalY + 48);
      doc.text(`Government Holidays: ${summary.governmentHolidays}`, 14, finalY + 56);

      // Certification
      const certY = finalY + 70;
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE', 14, certY);
      doc.setFont('helvetica', 'normal');
      doc.text('Certified that the journeys recorded above were performed for official purposes.', 14, certY + 8);
      doc.text(`Date: _________________`, 14, certY + 20);
      doc.text('Signature of Officer', 14, certY + 35);
      doc.text('____________________________', 14, certY + 42);
      doc.text(`Name: ${officerInfo?.name || ''}`, 14, certY + 50);
      doc.text(`Designation: ${officerInfo?.designation || ''}`, 14, certY + 58);

      // Footer
      doc.setFontSize(8);
      doc.text(`Page 1 of 1`, 277, 200, { align: 'right' });
      doc.text('Generated by AGRONIX', 14, 200);

      doc.save(`Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }

  // Generate Excel
  async function generateExcel() {
    try {
      const summary = calculateMonthlySummary();
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Monthly Tour Diary
      const diaryData = [['Sl. No.', 'Date', 'Day', 'Holiday', 'From Place', 'To Place', 'Time From', 'Time To', 'Mode', 'Meter From', 'Distance KM', 'Meter To', 'Purpose', 'Remarks']];
      let serialNo = 1;

      for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
        const date = formatDate(currentYear, currentMonth, day);
        const dayName = getDayName(currentYear, currentMonth, day);
        const holiday = getHolidayForDate(date);
        const dayJourneys = getJourneysForDate(date);

        if (dayJourneys.length === 0) {
          const holidayInfo = isSunday(currentYear, currentMonth, day) ? 'WEEKLY HOLIDAY' : (holiday ? `${holiday.holiday_type} HOLIDAY - ${holiday.holiday_name}` : '');
          diaryData.push([String(serialNo++), date, dayName, holidayInfo, '-', '-', '-', '-', '-', '-', '-', '-', 'No journey recorded', '-']);
        } else {
          dayJourneys.forEach(journey => {
            const holidayInfo = holiday ? `${holiday.holiday_type} HOLIDAY - ${holiday.holiday_name}` : '';
            diaryData.push([
              String(serialNo++),
              date,
              dayName,
              holidayInfo,
              journey.from_place,
              journey.to_place,
              formatTime(journey.time_from),
              formatTime(journey.time_to),
              journey.mode,
              String(journey.meter_from),
              String(journey.distance_km),
              String(journey.meter_to),
              journey.purpose,
              journey.remarks || '-'
            ]);
          });
        }
      }

      const diarySheet = XLSX.utils.aoa_to_sheet(diaryData);
      XLSX.utils.book_append_sheet(workbook, diarySheet, 'Tour Diary');

      // Sheet 2: Monthly Summary
      const summaryData = [
        ['Officer Name', officerInfo?.name || ''],
        ['Designation', officerInfo?.designation || ''],
        ['Office', officerInfo?.office || ''],
        ['Mandal', officerInfo?.mandal || ''],
        ['Division', officerInfo?.division || ''],
        ['District', officerInfo?.district || ''],
        ['Month', MONTHS[currentMonth - 1]],
        ['Year', currentYear],
        [''],
        ['Opening Meter', summary.openingMeter.toFixed(1)],
        ['Closing Meter', summary.closingMeter.toFixed(1)],
        ['Total KM', summary.totalDistance.toFixed(1)],
        ['Tour Days', summary.tourDays],
        ['Total Journeys', summary.totalJourneys],
        ['Sundays', summary.sundays],
        ['Government Holidays', summary.governmentHolidays],
        ['Optional Holidays', summary.optionalHolidays]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 3: Holiday Calendar
      const holidayData = [['Date', 'Holiday Name', 'Holiday Type']];
      for (let day = 1; day <= getDaysInMonth(currentYear, currentMonth); day++) {
        const date = formatDate(currentYear, currentMonth, day);
        const holiday = getHolidayForDate(date);
        if (holiday) {
          holidayData.push([date, holiday.holiday_name, holiday.holiday_type]);
        }
      }
      const holidaySheet = XLSX.utils.aoa_to_sheet(holidayData);
      XLSX.utils.book_append_sheet(workbook, holidaySheet, 'Holidays');

      // Sheet 4: Purpose Statistics
      const purposeStats = new Map<string, { count: number; totalKm: number }>();
      journeys.forEach(j => {
        const stats = purposeStats.get(j.purpose) || { count: 0, totalKm: 0 };
        stats.count++;
        stats.totalKm += j.distance_km;
        purposeStats.set(j.purpose, stats);
      });

      const statsData = [['Purpose', 'Number of Journeys', 'Total KM']];
      purposeStats.forEach((stats, purpose) => {
        statsData.push([purpose, String(stats.count), stats.totalKm.toFixed(1)]);
      });
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

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
        {/* Month/Year Selection */}
        <div className={`mb-6 rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
                onClick={() => openJourneyForm(formatDate(currentYear, currentMonth, new Date().getDate()))}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Journey
              </button>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                <FileText className="h-4 w-4" />
                PDF
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
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Opening Meter:</label>
              <input
                type="number"
                step="0.1"
                value={tourDiary?.opening_meter || 0}
                onChange={(e) => updateOpeningMeter(parseFloat(e.target.value))}
                className="w-24 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
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
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  >
                    {JOURNEY_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
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
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Purpose</option>
                    {PURPOSES.map(purpose => (
                      <option key={purpose} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>
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
    </div>
  );
}
