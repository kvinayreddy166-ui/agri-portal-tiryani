import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  FileText,
  Download,
  Copy,
  RefreshCw,
  Eye,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
  Printer,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Shield,
  Scale,
  Leaf,
  Globe,
  Layers,
} from 'lucide-react';
import jsPDF from 'jspdf';

// Types
type DocumentType =
  | 'Note File'
  | 'Proceedings'
  | 'Memo'
  | 'Show Cause Notice'
  | 'Order'
  | 'Press Note'
  | 'Circular'
  | 'Express Memo'
  | 'Letter'
  | 'Inspection Report'
  | 'Compliance Report'
  | 'WhatsApp Advisory'
  | 'Awareness Poster';

type OfficerDesignation = 'Mandal Agriculture Officer' | 'Assistant Director of Agriculture' | 'District Agriculture Officer';
type Language = 'English' | 'Telugu' | 'English + Telugu';
type Quality = 'Short' | 'Standard' | 'Detailed';
type RegulatoryAct =
  | 'Fertilizer Control Order 1985'
  | 'Seeds Act 1966 & Seeds Control Order 1983'
  | 'Insecticides Act 1968 & Rules 1971'
  | 'Environment Protection Act 1986'
  | 'Essential Commodities Act'
  | 'Multiple Acts'
  | 'Custom Entry';

interface ViolationCard {
  id: string;
  category: 'fertilizer' | 'seeds' | 'insecticides' | 'environment';
  clause: string;
  description: string;
  selected: boolean;
}

interface DraftFormData {
  officeName: string;
  department: string;
  district: string;
  division: string;
  mandal: string;
  rcNo: string;
  fileNo: string;
  date: string;
  financialYear: string;
  officerName: string;
  designation: OfficerDesignation;
  recipientName: string;
  recipientDesignation: string;
  recipientOffice: string;
  subject: string;
  reference: string;
  description: string;
  inspectionDate: string;
  inspectionFindings: string;
  violationDetails: string;
  ruleActClause: string;
  instructions: string;
  decision: string;
  complianceDeadline: string;
  enclosures: string;
  copySubmittedTo: string;
  copyTo: string;
  signatureName: string;
  remarks: string;
}

interface SavedDraft {
  id: string;
  title: string;
  formData: DraftFormData;
  documentType: DocumentType;
  language: Language;
  quality: Quality;
  selectedViolations: string[];
  generatedContent: string;
  createdAt: string;
}

// Violation cards data
const VIOLATION_CARDS: ViolationCard[] = [
  // Fertilizer violations
  { id: 'f1', category: 'fertilizer', clause: 'Clause 3(3)', description: 'Selling fertilizer above notified/maximum price', selected: false },
  { id: 'f2', category: 'fertilizer', clause: 'Clause 4', description: 'Failure to prominently display stock position and price list', selected: false },
  { id: 'f3', category: 'fertilizer', clause: 'Clause 5', description: 'Selling fertilizer without issuing cash/credit memo', selected: false },
  { id: 'f4', category: 'fertilizer', clause: 'Clause 7', description: 'Selling fertilizer without valid authorization', selected: false },
  { id: 'f5', category: 'fertilizer', clause: 'Clause 12', description: 'Manufacturing fertilizer mixtures without valid certificate', selected: false },
  { id: 'f6', category: 'fertilizer', clause: 'Clause 19(a)', description: 'Selling fertilizer not meeting prescribed standards', selected: false },
  { id: 'f7', category: 'fertilizer', clause: 'Clause 19(c)', description: 'Selling adulterated/imitation fertilizer', selected: false },
  { id: 'f8', category: 'fertilizer', clause: 'Clause 21', description: 'Improper packing or marking of fertilizer bags', selected: false },
  { id: 'f9', category: 'fertilizer', clause: 'Clause 25', description: 'Unauthorized use/diversion of fertilizer', selected: false },
  { id: 'f10', category: 'fertilizer', clause: 'Clause 35', description: 'Failure to maintain proper records/registers/returns', selected: false },
  { id: 'f11', category: 'fertilizer', clause: 'Extra', description: 'Stock board not displayed', selected: false },
  { id: 'f12', category: 'fertilizer', clause: 'Extra', description: 'Daily stock register not maintained', selected: false },
  { id: 'f13', category: 'fertilizer', clause: 'Extra', description: 'Sales register not maintained', selected: false },
  { id: 'f14', category: 'fertilizer', clause: 'Extra', description: 'Cash memo book not maintained', selected: false },
  { id: 'f15', category: 'fertilizer', clause: 'Extra', description: 'Physical stock differs from records', selected: false },
  { id: 'f16', category: 'fertilizer', clause: 'Extra', description: 'ePOS records not updated', selected: false },
  { id: 'f17', category: 'fertilizer', clause: 'Extra', description: 'Dealer absent during inspection', selected: false },
  { id: 'f18', category: 'fertilizer', clause: 'Extra', description: 'Records not produced', selected: false },
  // Seeds violations
  { id: 's1', category: 'seeds', clause: 'Clause 3', description: 'Seed business without valid licence', selected: false },
  { id: 's2', category: 'seeds', clause: 'Clause 8', description: 'Failure to display stock position and price list', selected: false },
  { id: 's3', category: 'seeds', clause: 'Clause 9', description: 'Failure to issue cash/credit memo/bill', selected: false },
  { id: 's4', category: 'seeds', clause: 'Clause 11', description: 'Failure to maintain seed stock/sale records', selected: false },
  { id: 's5', category: 'seeds', clause: 'Clause 13', description: 'Selling sub-standard seed', selected: false },
  { id: 's6', category: 'seeds', clause: 'Section 7', description: 'Selling notified seed not correctly labelled', selected: false },
  { id: 's7', category: 'seeds', clause: 'Section 6', description: 'Seed not meeting germination/purity standards', selected: false },
  { id: 's8', category: 'seeds', clause: 'Rule 23', description: 'Improper storage and maintenance', selected: false },
  { id: 's9', category: 'seeds', clause: 'Rule 35', description: 'Failure to produce records for inspection', selected: false },
  { id: 's10', category: 'seeds', clause: 'Clause 10', description: 'Contravention of licence conditions', selected: false },
  { id: 's11', category: 'seeds', clause: 'Extra', description: 'Expired seed stock found', selected: false },
  { id: 's12', category: 'seeds', clause: 'Extra', description: 'Seed lots without tags', selected: false },
  { id: 's13', category: 'seeds', clause: 'Extra', description: 'Missing labels', selected: false },
  { id: 's14', category: 'seeds', clause: 'Extra', description: 'Germination reports unavailable', selected: false },
  { id: 's15', category: 'seeds', clause: 'Extra', description: 'Stock mismatch', selected: false },
  { id: 's16', category: 'seeds', clause: 'Extra', description: 'Unauthorized varieties sold', selected: false },
  { id: 's17', category: 'seeds', clause: 'Extra', description: 'Farmer complaints received', selected: false },
  // Insecticides violations
  { id: 'i1', category: 'insecticides', clause: 'Section 17', description: 'Selling unregistered insecticides', selected: false },
  { id: 'i2', category: 'insecticides', clause: 'Section 18', description: 'Sale of misbranded/sub-standard/prohibited insecticides', selected: false },
  { id: 'i3', category: 'insecticides', clause: 'Rule 10', description: 'Selling without valid licence/expired licence', selected: false },
  { id: 'i4', category: 'insecticides', clause: 'Rule 15', description: 'Failure to maintain stock registers/Form XVI/sale records', selected: false },
  { id: 'i5', category: 'insecticides', clause: 'Rule 33', description: 'Improper storage with food/fodder', selected: false },
  { id: 'i6', category: 'insecticides', clause: 'Rule 35', description: 'Labelling and packaging violations', selected: false },
  { id: 'i7', category: 'insecticides', clause: 'Rule 10(3)', description: 'Licence not displayed', selected: false },
  { id: 'i8', category: 'insecticides', clause: 'ECA/Order', description: 'Price list and stock position not displayed', selected: false },
  { id: 'i9', category: 'insecticides', clause: 'Rule 14', description: 'Failure to produce records for inspection', selected: false },
  { id: 'i10', category: 'insecticides', clause: 'Section 13', description: 'Violation of licence/registration conditions', selected: false },
  { id: 'i11', category: 'insecticides', clause: 'Extra', description: 'Expired pesticides found', selected: false },
  { id: 'i12', category: 'insecticides', clause: 'Extra', description: 'Banned pesticides stocked', selected: false },
  { id: 'i13', category: 'insecticides', clause: 'Extra', description: 'Unsafe storage', selected: false },
  { id: 'i14', category: 'insecticides', clause: 'Extra', description: 'Records not maintained', selected: false },
  { id: 'i15', category: 'insecticides', clause: 'Extra', description: 'Cash memos not issued', selected: false },
  { id: 'i16', category: 'insecticides', clause: 'Extra', description: 'Labels missing', selected: false },
  { id: 'i17', category: 'insecticides', clause: 'Extra', description: 'Farmer complaints received', selected: false },
  // Environment violations
  { id: 'e1', category: 'environment', clause: 'Section 3', description: 'Violation of environmental safeguards', selected: false },
  { id: 'e2', category: 'environment', clause: 'Section 5', description: 'Failure to comply with directions', selected: false },
  { id: 'e3', category: 'environment', clause: 'Section 7', description: 'Emission/discharge beyond standards', selected: false },
  { id: 'e4', category: 'environment', clause: 'Section 8', description: 'Improper handling of hazardous substances', selected: false },
  { id: 'e5', category: 'environment', clause: 'Section 15', description: 'Punishable contravention', selected: false },
  { id: 'e6', category: 'environment', clause: 'Extra', description: 'Burning of agricultural waste', selected: false },
  { id: 'e7', category: 'environment', clause: 'Extra', description: 'Improper disposal of pesticide containers', selected: false },
  { id: 'e8', category: 'environment', clause: 'Extra', description: 'Unsafe storage of chemicals', selected: false },
  { id: 'e9', category: 'environment', clause: 'Extra', description: 'Water contamination observed', selected: false },
  { id: 'e10', category: 'environment', clause: 'Extra', description: 'Soil contamination observed', selected: false },
  { id: 'e11', category: 'environment', clause: 'Extra', description: 'Hazardous waste improperly handled', selected: false },
  { id: 'e12', category: 'environment', clause: 'Extra', description: 'Plastic waste accumulation', selected: false },
  { id: 'e13', category: 'environment', clause: 'Extra', description: 'Environmental safeguards not followed', selected: false },
];

const DOCUMENT_TYPES: DocumentType[] = [
  'Note File', 'Proceedings', 'Memo', 'Show Cause Notice', 'Order', 'Press Note',
  'Circular', 'Express Memo', 'Letter', 'Inspection Report', 'Compliance Report',
  'WhatsApp Advisory', 'Awareness Poster',
];

const OFFICER_DESIGNATIONS: OfficerDesignation[] = [
  'Mandal Agriculture Officer',
  'Assistant Director of Agriculture',
  'District Agriculture Officer',
];

const LANGUAGES: Language[] = ['English', 'Telugu', 'English + Telugu'];
const QUALITIES: Quality[] = ['Short', 'Standard', 'Detailed'];

const REGULATORY_ACTS: RegulatoryAct[] = [
  'Fertilizer Control Order 1985',
  'Seeds Act 1966 & Seeds Control Order 1983',
  'Insecticides Act 1968 & Rules 1971',
  'Environment Protection Act 1986',
  'Essential Commodities Act',
  'Multiple Acts',
  'Custom Entry',
];

const TELANGANA_DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
  'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
  'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad',
  'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu',
  'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad',
  'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet',
  'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri',
];

// Helper functions
const getCurrentDate = () => new Date().toISOString().split('T')[0];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'fertilizer': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    case 'seeds': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
    case 'insecticides': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
    case 'environment': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
  }
};

const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case 'fertilizer': return 'bg-blue-600 text-white';
    case 'seeds': return 'bg-yellow-600 text-white';
    case 'insecticides': return 'bg-green-600 text-white';
    case 'environment': return 'bg-red-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
};

const getOfficeHeader = (designation: OfficerDesignation, mandal?: string, division?: string, district?: string) => {
  switch (designation) {
    case 'Mandal Agriculture Officer': return `OFFICE OF THE MANDAL AGRICULTURE OFFICER\n${mandal || '[Mandal]'}, ${district || '[District]'}\nGOVERNMENT OF TELANGANA`;
    case 'Assistant Director of Agriculture': return `OFFICE OF THE ASSISTANT DIRECTOR OF AGRICULTURE\n${division || '[Division]'}, ${district || '[District]'}\nGOVERNMENT OF TELANGANA`;
    case 'District Agriculture Officer': return `OFFICE OF THE DISTRICT AGRICULTURE OFFICER\n${district || '[District]'}\nGOVERNMENT OF TELANGANA`;
    default: return 'OFFICE OF THE AGRICULTURE DEPARTMENT\nGOVERNMENT OF TELANGANA';
  }
};

const getSignatureBlock = (designation: OfficerDesignation, mandal?: string, division?: string, district?: string) => {
  switch (designation) {
    case 'Mandal Agriculture Officer': return `For ${mandal || '[Mandal]'} Mandal\n\nMandal Agriculture Officer`;
    case 'Assistant Director of Agriculture': return `For ${division || '[Division]'} Division\n\nAssistant Director of Agriculture`;
    case 'District Agriculture Officer': return `For ${district || '[District]'} District\n\nDistrict Agriculture Officer`;
    default: return designation;
  }
};

// Draft generator function
const generateOfficialDraft = (
  formData: DraftFormData,
  documentType: DocumentType,
  language: Language,
  quality: Quality,
  selectedViolations: ViolationCard[]
): string => {
  const {
    rcNo, date, subject, reference, description, inspectionDate, inspectionFindings,
    violationDetails, ruleActClause, instructions, decision, complianceDeadline,
    officerName, designation, recipientName, recipientDesignation, recipientOffice,
    copyTo, mandal, division, district,
  } = formData;

  const selectedViolationText = selectedViolations.map(v => `${v.clause}: ${v.description}`).join('\n');
  const officeHeader = getOfficeHeader(designation, mandal, division, district);
  const signatureBlock = getSignatureBlock(designation, mandal, division, district);

  // Auto-expand brief description into full description
  const autoExpandDescription = (brief: string, quality: Quality): string => {
    if (!brief || brief.length < 10) return brief;
    
    const expanded = brief;
    if (quality === 'Detailed') {
      return `${expanded}\n\nDetailed analysis reveals that the matter requires immediate attention based on the observations made during the inspection. The circumstances surrounding this case indicate a need for comprehensive review and appropriate action in accordance with the relevant provisions of law.`;
    } else if (quality === 'Standard') {
      return `${expanded}\n\nBased on the observations, it is necessary to take appropriate action as per the relevant rules and regulations.`;
    }
    return expanded;
  };

  const expandedDescription = autoExpandDescription(description, quality);

  let draft = '';
  const isTelugu = language === 'Telugu';
  const isBilingual = language === 'English + Telugu';

  const teluguSubject = 'విషయం';
  const teluguReference = 'సూచన';
  const teluguRegarding = 'పై విషయమునకు సంబంధించి';
  const teluguPursuant = 'పై సూచనల మేరకు';
  const teluguAfterInspection = 'పరిశీలించిన తరువాత';
  const teluguOrdered = 'కింది విధముగా ఆదేశించడమైనది';
  const teluguExplanation = 'గడువులోపు వివరణ సమర్పించవలెను';
  const teluguComply = 'విధిగా పాటించవలెను';
  const teluguAction = 'అవసరమైన చర్యలు తీసుకొని నివేదిక సమర్పించవలెను';
  const teluguRuleAction = 'నియమావళి ప్రకారం చర్యలు తీసుకోబడును';

  const warningEnglish = `You are directed to submit your explanation within ${complianceDeadline || '7'} days, failing which action will be initiated as per rules.`;
  const warningTelugu = `ఈ నోటీసు అందిన తేదీ నుండి ${complianceDeadline || '7'} రోజులలోపు మీ వివరణ సమర్పించవలెను. గడువులోపు వివరణ అందించని పక్షంలో ${teluguRuleAction}.`;

  // Helper for bilingual format - separate sections
  const getBilingualSubject = (subj: string) => {
    return `Subject: ${subj || '[Subject]'}\n${teluguSubject}: ${subj || '[Subject]'}`;
  };

  const getBilingualReference = (ref: string) => {
    return `Reference: ${ref}\n${teluguReference}: ${ref}`;
  };

  switch (documentType) {
    case 'Note File':
      draft = `${officeHeader}\n\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `Facts of Case:\n${expandedDescription || '[Description of the case]'}\n\n`;
      draft += `Rule Position:\n${ruleActClause || '[Relevant rules and clauses]'}\n\n`;
      if (selectedViolationText) draft += `Violations Observed:\n${selectedViolationText}\n\n`;
      draft += `Analysis:\n${inspectionFindings || '[Analysis of the situation]'}\n\n`;
      draft += `Proposal:\n${instructions || '[Proposed action]'}\n\n`;
      draft += `Submitted for kind perusal and orders.\n\n${signatureBlock}\n`;
      break;

    case 'Proceedings':
      draft = `${officeHeader}\n\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `ORDER:\n\n${decision || '[Order content]'}\n\n`;
      if (instructions) draft += `Instructions:\n${instructions}\n\n`;
      draft += `${signatureBlock}\n\n`;
      if (copyTo) draft += `Copy To:\n${copyTo}\n`;
      break;

    case 'Memo':
      draft = `From: ${officeHeader}\nTo: ${recipientName || '[Recipient Name]'}\n`;
      if (recipientDesignation) draft += `     ${recipientDesignation}\n`;
      if (recipientOffice) draft += `     ${recipientOffice}\n`;
      draft += `\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      if (isTelugu) {
        draft += `${teluguRegarding}:\n\n`;
      } else {
        draft += `Regarding:\n\n`;
      }
      draft += `${expandedDescription || '[Memo content]'}\n\n`;
      if (selectedViolationText) draft += `Violations:\n${selectedViolationText}\n\n`;
      draft += `Instructions:\n${instructions || '[Instructions]'}\n\n`;
      if (complianceDeadline) draft += `Deadline: ${complianceDeadline}\n\n`;
      draft += `${signatureBlock}\n`;
      break;

    case 'Show Cause Notice':
      draft = `${officeHeader}\n\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      draft += `To,\n${recipientName || '[Recipient Name]'}\n`;
      if (recipientDesignation) draft += `${recipientDesignation}\n`;
      if (recipientOffice) draft += `${recipientOffice}\n`;
      draft += `\n`;
      if (isTelugu) {
        draft += `${teluguRegarding}:\n\n`;
      } else {
        draft += `Regarding:\n\n`;
      }
      draft += `Inspection Details:\nInspection Date: ${inspectionDate || '[Inspection Date]'}\n\n`;
      draft += `Facts:\n${expandedDescription || '[Facts of the case]'}\n\n`;
      draft += `Inspection Findings:\n${inspectionFindings || '[Inspection findings]'}\n\n`;
      if (selectedViolationText) draft += `Violations Observed:\n${selectedViolationText}\n\n`;
      draft += `Relevant Provisions:\n${ruleActClause || '[Relevant rules, acts, and clauses]'}\n\n`;
      if (isTelugu) {
        draft += `${teluguPursuant}:\n\n`;
      } else {
        draft += `In pursuance of the above:\n\n`;
      }
      draft += `You are hereby directed to submit your written explanation within ${complianceDeadline || '7'} days from the receipt of this notice.\n\n`;
      if (isBilingual) { draft += `${warningTelugu}\n\n${warningEnglish}\n\n`; }
      else if (isTelugu) { draft += `${warningTelugu}\n\n`; }
      else { draft += `${warningEnglish}\n\n`; }
      draft += `${signatureBlock}\n`;
      break;

    case 'Order':
      draft = `${officeHeader}\n\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `ORDER:\n\n${decision || '[Order content]'}\n\n`;
      if (instructions) draft += `Instructions:\n${instructions}\n\n`;
      if (complianceDeadline) draft += `Compliance Deadline: ${complianceDeadline}\n\n`;
      draft += `${signatureBlock}\n\n`;
      if (copyTo) draft += `Copy To:\n${copyTo}\n`;
      break;

    case 'Press Note':
      draft = `PRESS NOTE\n\n`;
      draft += `Date: ${date || getCurrentDate()}\n`;
      draft += `Place: ${district || '[Place]'}\n\n`;
      draft += `Subject: ${subject || '[Subject]'}\n\n`;
      draft += `${description || '[Press note content in simple, public-friendly language]'}\n\n`;
      if (instructions) draft += `Advisory:\n${instructions}\n\n`;
      draft += `For further information, please contact:\n`;
      draft += `${officerName || '[Officer Name]'}\n${designation}\n${officeHeader}\n`;
      break;

    case 'Circular':
      draft = `${officeHeader}\n\nRc.No: ${rcNo || '[Rc.No]'}\nDate: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `Background:\n${expandedDescription || '[Background information]'}\n\n`;
      draft += `Instructions:\n${instructions || '[Numbered instructions]'}\n\n`;
      draft += `All concerned are directed to comply with these instructions.\n\n`;
      draft += `${signatureBlock}\n\n`;
      if (copyTo) draft += `Copy To:\n${copyTo}\n`;
      break;

    case 'Express Memo':
      draft = `EXPRESS MEMO\n\n`;
      draft += `From: ${officeHeader}\n`;
      draft += `To: ${recipientName || '[Recipient Name]'}\n`;
      draft += `Date: ${date || getCurrentDate()}\n\n`;
      draft += `Subject: ${subject || '[Subject]'}\n\n`;
      draft += `${expandedDescription || '[Urgent instruction content]'}\n\n`;
      draft += `Action Required: ${instructions || '[Action required]'}\n\n`;
      draft += `${signatureBlock}\n`;
      break;

    case 'Letter':
      draft = `${officeHeader}\n\nDate: ${date || getCurrentDate()}\n\n`;
      draft = `To,\n${recipientName || '[Recipient Name]'}\n`;
      if (recipientDesignation) draft += `${recipientDesignation}\n`;
      if (recipientOffice) draft += `${recipientOffice}\n`;
      draft += `\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `${expandedDescription || '[Letter content]'}\n\n`;
      if (instructions) draft += `${instructions}\n\n`;
      draft += `${signatureBlock}\n`;
      break;

    case 'Inspection Report':
      draft = `INSPECTION REPORT\n\n`;
      draft += `${officeHeader}\n\n`;
      draft += `Inspection Date: ${inspectionDate || '[Inspection Date]'}\n`;
      draft += `Inspected By: ${officerName || '[Officer Name]'}\n`;
      draft += `Designation: ${designation}\n\n`;
      draft += `Inspection Details:\n${expandedDescription || '[Inspection details]'}\n\n`;
      draft += `Findings:\n${inspectionFindings || '[Inspection findings]'}\n\n`;
      if (selectedViolationText) draft += `Violations Observed:\n${selectedViolationText}\n\n`;
      draft += `Relevant Provisions:\n${ruleActClause || '[Relevant provisions]'}\n\n`;
      draft += `Recommendations:\n${instructions || '[Recommendations]'}\n\n`;
      draft += `${signatureBlock}\n`;
      break;

    case 'Compliance Report':
      draft = `COMPLIANCE REPORT\n\n`;
      draft += `${officeHeader}\n\n`;
      draft += `Rc.No: ${rcNo || '[Rc.No]'}\n`;
      draft += `Date: ${date || getCurrentDate()}\n\n`;
      if (isBilingual) {
        draft += getBilingualSubject(subject || '[Subject]') + '\n\n';
      } else if (isTelugu) {
        draft += `${teluguSubject}: ${subject || '[Subject]'}\n\n`;
      } else {
        draft += `Subject: ${subject || '[Subject]'}\n\n`;
      }
      if (reference) {
        if (isBilingual) {
          draft += getBilingualReference(reference) + '\n\n';
        } else if (isTelugu) {
          draft += `${teluguReference}: ${reference}\n\n`;
        } else {
          draft += `Reference: ${reference}\n\n`;
        }
      }
      draft += `Background:\n${expandedDescription || '[Background]'}\n\n`;
      draft += `Compliance Status:\n${inspectionFindings || '[Compliance status]'}\n\n`;
      draft += `Action Taken:\n${instructions || '[Action taken]'}\n\n`;
      draft += `${signatureBlock}\n`;
      break;

    case 'WhatsApp Advisory':
      draft = `WHATSAPP ADVISORY\n\n`;
      draft += `${subject || '[Subject]'}\n\n`;
      draft += `${expandedDescription || '[Advisory content in simple, concise language]'}\n\n`;
      if (instructions) draft += `Action Required:\n${instructions}\n\n`;
      draft += `- ${officeHeader}\n- ${designation}\n`;
      break;

    case 'Awareness Poster':
      draft = `AWARENESS POSTER CONTENT\n\n`;
      draft += `Title: ${subject || '[Title]'}\n`;
      draft += `Subtitle: ${reference || '[Subtitle]'}\n\n`;
      draft += `Message:\n${expandedDescription || '[Main message]'}\n\n`;
      if (instructions) draft += `Instructions:\n${instructions}\n\n`;
      draft += `Contact:\n${officeHeader}\n${designation}\n`;
      break;

    default:
      draft = `${officeHeader}\n\n${expandedDescription || '[Content]'}\n\n${signatureBlock}\n`;
  }

  return draft;
};

export default function OfficialDraftAutomation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [documentType, setDocumentType] = useState<DocumentType>('Memo');
  const [language, setLanguage] = useState<Language>('English');
  const [quality, setQuality] = useState<Quality>('Standard');
  const [designation, setDesignation] = useState<OfficerDesignation>('Mandal Agriculture Officer');
  const [regulatoryAct, setRegulatoryAct] = useState<RegulatoryAct>('Fertilizer Control Order 1985');
  const [formData, setFormData] = useState<DraftFormData>({
    officeName: '',
    department: 'Department of Agriculture',
    district: 'Kumuram Bheem Asifabad',
    division: '',
    mandal: 'Tiryani',
    rcNo: '',
    fileNo: '',
    date: getCurrentDate(),
    financialYear: '2024-25',
    officerName: '',
    designation: 'Mandal Agriculture Officer',
    recipientName: '',
    recipientDesignation: '',
    recipientOffice: '',
    subject: '',
    reference: '',
    description: '',
    inspectionDate: getCurrentDate(),
    inspectionFindings: '',
    violationDetails: '',
    ruleActClause: '',
    instructions: '',
    decision: '',
    complianceDeadline: '7',
    enclosures: '',
    copySubmittedTo: '',
    copyTo: '',
    signatureName: '',
    remarks: '',
  });

  // Violation cards state
  const [violationCards, setViolationCards] = useState<ViolationCard[]>(VIOLATION_CARDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['fertilizer', 'seeds', 'insecticides', 'environment']));

  // Generated content state
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Drafts state
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // Poster state
  const [showPosterGenerator, setShowPosterGenerator] = useState(false);
  const [posterData, setPosterData] = useState({
    title: '',
    subtitle: '',
    message: '',
    crop: '',
    scheme: '',
    alertType: '',
    date: getCurrentDate(),
    officerName: '',
    officeName: '',
  });

  // Load saved drafts on mount
  useEffect(() => {
    const saved = localStorage.getItem('official-drafts');
    if (saved) {
      try {
        setSavedDrafts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading drafts:', e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description || formData.subject) {
        const autoDraft: SavedDraft = {
          id: 'auto',
          title: `Auto-draft ${new Date().toLocaleTimeString()}`,
          formData,
          documentType,
          language,
          quality,
          selectedViolations: violationCards.filter(v => v.selected).map(v => v.id),
          generatedContent,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('official-draft-autosave', JSON.stringify(autoDraft));
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [formData, documentType, language, quality, violationCards, generatedContent]);

  // Update designation in form when changed
  useEffect(() => {
    setFormData(prev => ({ ...prev, designation }));
  }, [designation]);

  const handleBack = () => {
    if (location.state?.from === 'officer-toolkit') {
      navigate('/officer-toolkit');
    } else {
      navigate('/officer-toolkit');
    }
  };

  const handleInputChange = (field: keyof DraftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleViolationCard = (id: string) => {
    setViolationCards(prev => prev.map(card => 
      card.id === id ? { ...card, selected: !card.selected } : card
    ));
    
    // Auto-populate fields based on selected violations
    const selected = violationCards.filter(v => v.id === id)[0];
    if (selected && !selected.selected) {
      // Card was just selected
      const currentFindings = formData.inspectionFindings;
      const currentViolations = formData.violationDetails;
      const currentRules = formData.ruleActClause;
      
      setFormData(prev => ({
        ...prev,
        inspectionFindings: currentFindings ? `${currentFindings}\n- ${selected.description}` : `- ${selected.description}`,
        violationDetails: currentViolations ? `${currentViolations}\n${selected.clause}: ${selected.description}` : `${selected.clause}: ${selected.description}`,
        ruleActClause: currentRules ? `${currentRules}\n${selected.clause}` : selected.clause,
      }));
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const selectAllInCategory = (category: string) => {
    setViolationCards(prev => prev.map(card => 
      card.category === category ? { ...card, selected: true } : card
    ));
  };

  const clearAllInCategory = (category: string) => {
    setViolationCards(prev => prev.map(card => 
      card.category === category ? { ...card, selected: false } : card
    ));
  };

  const handleGenerate = () => {
    const selectedViolations = violationCards.filter(v => v.selected);
    const content = generateOfficialDraft(formData, documentType, language, quality, selectedViolations);
    setGeneratedContent(content);
    setShowPreview(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      alert('Draft copied to clipboard!');
    } catch (e) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(generatedContent, 180);
    let y = 20;
    
    lines.forEach((line: string) => {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += 7;
    });
    
    pdf.save(`${documentType.replace(/\s+/g, '_')}_${formData.date}.pdf`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentType}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap');
              body {
                font-family: 'Book Antiqua', 'Noto Sans Telugu', serif;
                padding: 20px;
                line-height: 1.6;
              }
              pre {
                white-space: pre-wrap;
                font-family: 'Book Antiqua', 'Noto Sans Telugu', serif;
                font-size: 12pt;
              }
            </style>
          </head>
          <body>
            <pre>${generatedContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveDraft = () => {
    const draft: SavedDraft = {
      id: Date.now().toString(),
      title: formData.subject || 'Untitled Draft',
      formData,
      documentType,
      language,
      quality,
      selectedViolations: violationCards.filter(v => v.selected).map(v => v.id),
      generatedContent,
      createdAt: new Date().toISOString(),
    };
    
    const updatedDrafts = [draft, ...savedDrafts];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('official-drafts', JSON.stringify(updatedDrafts));
    alert('Draft saved successfully!');
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setFormData(draft.formData);
    setDocumentType(draft.documentType);
    setLanguage(draft.language);
    setQuality(draft.quality);
    setViolationCards(prev => prev.map(card => 
      draft.selectedViolations.includes(card.id) ? { ...card, selected: true } : card
    ));
    setGeneratedContent(draft.generatedContent);
    setShowDrafts(false);
    setShowPreview(true);
  };

  const handleDeleteDraft = (id: string) => {
    const updatedDrafts = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('official-drafts', JSON.stringify(updatedDrafts));
  };

  const handleReset = () => {
    setFormData({
      officeName: '',
      department: 'Department of Agriculture',
      district: 'Kumuram Bheem Asifabad',
      division: '',
      mandal: 'Tiryani',
      rcNo: '',
      fileNo: '',
      date: getCurrentDate(),
      financialYear: '2024-25',
      officerName: '',
      designation,
      recipientName: '',
      recipientDesignation: '',
      recipientOffice: '',
      subject: '',
      reference: '',
      description: '',
      inspectionDate: getCurrentDate(),
      inspectionFindings: '',
      violationDetails: '',
      ruleActClause: '',
      instructions: '',
      decision: '',
      complianceDeadline: '7',
      enclosures: '',
      copySubmittedTo: '',
      copyTo: '',
      signatureName: '',
      remarks: '',
    });
    setViolationCards(VIOLATION_CARDS);
    setGeneratedContent('');
    setShowPreview(false);
  };

  const filteredCards = violationCards.filter(card =>
    card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.clause.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['fertilizer', 'seeds', 'insecticides', 'environment'] as const;
  const categoryIcons: Record<string, React.ReactNode> = {
    fertilizer: <Leaf className="h-4 w-4" />,
    seeds: <Sparkles className="h-4 w-4" />,
    insecticides: <Shield className="h-4 w-4" />,
    environment: <Globe className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-[#eef6f0] p-4 pb-32 sm:p-6 sm:pb-28 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-xl shadow-emerald-950/10 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('Back', 'వెనుకకు')}
            </button>
            <div className="flex-1 text-center">
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Officer Toolkit
              </p>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('AI Official Draft Automation', 'AI అధికారిక డ్రాఫ్ట్ ఆటోమేషన్')}
              </h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Document Type and Language */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Document Settings', 'పత్రం సెట్టింగులు')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Document Type', 'పత్రం రకం')}
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Language', 'భాష')}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Quality', 'నాణ్యత')}
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as Quality)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  >
                    {QUALITIES.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Officer Details */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Officer Details', 'అధికారి వివరాలు')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Designation', 'హోదా')}
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value as OfficerDesignation)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  >
                    {OFFICER_DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Officer Name', 'అధికారి పేరు')}
                  </label>
                  <input
                    type="text"
                    value={formData.officerName}
                    onChange={(e) => handleInputChange('officerName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter officer name"
                  />
                </div>
                {designation === 'Mandal Agriculture Officer' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Mandal', 'మండలం')}
                    </label>
                    <input
                      type="text"
                      value={formData.mandal}
                      onChange={(e) => handleInputChange('mandal', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                      placeholder="Enter mandal"
                    />
                  </div>
                )}
                {designation === 'Assistant Director of Agriculture' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Division', 'విభాగం')}
                    </label>
                    <input
                      type="text"
                      value={formData.division}
                      onChange={(e) => handleInputChange('division', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                      placeholder="Enter division"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('District', 'జిల్లా')}
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  >
                    {TELANGANA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Document Details', 'పత్రం వివరాలు')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Rc.No', 'Rc.No')}
                  </label>
                  <input
                    type="text"
                    value={formData.rcNo}
                    onChange={(e) => handleInputChange('rcNo', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter Rc.No"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Date', 'తేదీ')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Subject', 'విషయం')}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter subject"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Reference', 'సూచన')}
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter reference (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Recipient Details', 'స్వీకర్త వివరాలు')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Recipient Name', 'స్వీకర్త పేరు')}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter recipient name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Recipient Designation', 'స్వీకర్త హోదా')}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientDesignation}
                    onChange={(e) => handleInputChange('recipientDesignation', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter designation"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Recipient Office', 'స్వీకర్త కార్యాలయం')}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientOffice}
                    onChange={(e) => handleInputChange('recipientOffice', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter office"
                  />
                </div>
              </div>
            </div>

            {/* Description and Violations */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Description / Brief Facts', 'వివరణ / సంక్షిప్త విషయాలు')}
              </h2>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                placeholder="Enter brief description or facts of the case (auto-expanded in generated draft)"
              />
            </div>

            {/* Regulatory Act */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Regulatory Act', 'నియంత్రణ చట్టం')}
              </h2>
              <select
                value={regulatoryAct}
                onChange={(e) => setRegulatoryAct(e.target.value as RegulatoryAct)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
              >
                {REGULATORY_ACTS.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* Inspection Details */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Inspection Details', 'తనిఖీ వివరాలు')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Inspection Date', 'తనిఖీ తేదీ')}
                  </label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Compliance Deadline (days)', 'అనుసరణ గడువు (రోజులు)')}
                  </label>
                  <input
                    type="number"
                    value={formData.complianceDeadline}
                    onChange={(e) => handleInputChange('complianceDeadline', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="7"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('Inspection Findings', 'తనిఖీ విషయాలు')}
                </label>
                <textarea
                  value={formData.inspectionFindings}
                  onChange={(e) => handleInputChange('inspectionFindings', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                  placeholder="Enter inspection findings"
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-center text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Book Antiqua, serif' }}>
                {t('Additional Details', 'అదనపు వివరాలు')}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Rule / Act / Clause', 'నియమం / చట్టం / క్లాజ్')}
                  </label>
                  <textarea
                    value={formData.ruleActClause}
                    onChange={(e) => handleInputChange('ruleActClause', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter relevant rules, acts, and clauses"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Instructions / Decision', 'సూచనలు / నిర్ణయం')}
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter instructions or decision"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Copy To', 'కాపీ పంపించు')}
                  </label>
                  <textarea
                    value={formData.copyTo}
                    onChange={(e) => handleInputChange('copyTo', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    placeholder="Enter copy to details"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4" />
                {t('Generate Draft', 'డ్రాఫ్ట్ సృష్టించు')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                {t('Reset', 'రీసెట్')}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Save className="h-4 w-4" />
                {t('Save Draft', 'డ్రాఫ్ట్ సేవ్ చేయండి')}
              </button>
              <button
                type="button"
                onClick={() => setShowDrafts(!showDrafts)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FileText className="h-4 w-4" />
                {t('Saved Drafts', 'సేవ్ చేసిన డ్రాఫ్ట్లు')} ({savedDrafts.length})
              </button>
            </div>
          </div>
        </div>

        {/* Saved Drafts Modal */}
        {showDrafts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('Saved Drafts', 'సేవ్ చేసిన డ్రాఫ్ట్లు')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDrafts(false)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {savedDrafts.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t('No saved drafts yet', 'ఇంకా సేవ్ చేసిన డ్రాఫ్ట్లు లేవు')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedDrafts.map(draft => (
                      <div
                        key={draft.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {draft.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {draft.documentType} • {new Date(draft.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(draft)}
                            className="rounded-md bg-emerald-600 p-2 text-white transition hover:bg-emerald-700"
                            title={t('Load', 'లోడ్ చేయండి')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="rounded-md bg-red-600 p-2 text-white transition hover:bg-red-700"
                            title={t('Delete', 'తొలగించు')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('Draft Preview', 'డ్రాఫ్ట్ ప్రివ్యూ')}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('Copy', 'కాపీ')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('PDF', 'PDF')}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {t('Print', 'ప్రింట్')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <pre className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Book Antiqua', 'Noto Sans Telugu', serif" }}>
                  {generatedContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Poster Generator Modal */}
        {showPosterGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('Poster Generator', 'పోస్టర్ జనరేటర్')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPosterGenerator(false)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Title', 'శీర్షిక')}
                    </label>
                    <input
                      type="text"
                      value={posterData.title}
                      onChange={(e) => setPosterData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                      placeholder="Enter poster title"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Subtitle', 'ఉపశీర్షిక')}
                    </label>
                    <input
                      type="text"
                      value={posterData.subtitle}
                      onChange={(e) => setPosterData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                      placeholder="Enter subtitle"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Message', 'సందేశం')}
                    </label>
                    <textarea
                      value={posterData.message}
                      onChange={(e) => setPosterData(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                      placeholder="Enter main message"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Crop', 'పంట')}
                      </label>
                      <input
                        type="text"
                        value={posterData.crop}
                        onChange={(e) => setPosterData(prev => ({ ...prev, crop: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                        placeholder="Enter crop name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Scheme', 'పథకం')}
                      </label>
                      <input
                        type="text"
                        value={posterData.scheme}
                        onChange={(e) => setPosterData(prev => ({ ...prev, scheme: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                        placeholder="Enter scheme name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Alert Type', 'హెచ్చరిక రకం')}
                    </label>
                    <select
                      value={posterData.alertType}
                      onChange={(e) => setPosterData(prev => ({ ...prev, alertType: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                    >
                      <option value="">Select alert type</option>
                      <option value="info">Information</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert</option>
                      <option value="advisory">Advisory</option>
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Officer Name', 'అధికారి పేరు')}
                      </label>
                      <input
                        type="text"
                        value={posterData.officerName}
                        onChange={(e) => setPosterData(prev => ({ ...prev, officerName: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                        placeholder="Enter officer name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Office Name', 'కార్యాలయం పేరు')}
                      </label>
                      <input
                        type="text"
                        value={posterData.officeName}
                        onChange={(e) => setPosterData(prev => ({ ...prev, officeName: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
                        placeholder="Enter office name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
