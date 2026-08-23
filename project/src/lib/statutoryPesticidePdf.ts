import type { jsPDF as JsPdfInstance } from 'jspdf';
import { addGovernmentEmblemWatermark } from './pdfWatermark';

export type PesticideStatutoryFormType = 'VC' | 'VD' | 'VE' | 'DOCKET';

export type ActiveIngredient = {
  name: string;
  concentration: string;
};

export type PesticidePdfValues = {
  officerName: string;
  designation: string;
  officeAddress: string;
  officerEmail: string;
  district: string;
  mandal: string;
  place: string;
  date: string;
  sampleDrawnDate: string;
  sampleDrawnDay: string;
  sampleDrawnMonth: string;
  sampleDrawnYear: string;
  dealerName: string;
  dealerAddress: string;
  premisesLocation: string;
  licenseNumber: string;
  licenseDate: string;
  authorizationLicenseNumber: string;
  insecticideCommonName: string;
  technicalName: string;
  tradeName: string;
  activeIngredient: string; // Legacy field for backward compatibility
  activeIngredients: ActiveIngredient[]; // New structured field
  formulationType: string;
  manualFormulationType: string;
  manufacturedBy: string;
  marketedBy: string;
  distributorName: string;
  registrationNumber: string;
  manufacturingLicenseNumber: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  packingCondition: string;
  sampleQuantity: string;
  sampleQuantityAnalysis: string;
  stockBeforeSampling: string;
  stockAfterSampling: string;
  stockRegisterFolio: string;
  stockReceiptDetails: string;
  invoiceParticulars: string;
  invoiceNumber: string;
  invoiceDate: string;
  stockPosition: string;
  specimenSeal: string;
  distinctMark: string;
  cdaCode: string;
  qciSealParticulars: string;
  caSealParticulars: string;
  otherInformation: string;
  labAddress: string;
  qualification: string;
  manualQualification: string;
  manualDistrict: string;
  manualMandal: string;
  ptlName: string;
  dispatchDate: string;
  pincode: string;
  email: string;
  sampleSerialNumber: string;
  // Covering Letter Details
  financialYear: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  officerPhone: string;
};

export const initialPesticidePdfValues: PesticidePdfValues = {
  officerName: '',
  designation: '',
  officeAddress: '',
  officerEmail: '',
  district: '',
  mandal: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  sampleDrawnDate: new Date().toISOString().slice(0, 10),
  sampleDrawnDay: '',
  sampleDrawnMonth: '',
  sampleDrawnYear: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  licenseNumber: '',
  licenseDate: '',
  authorizationLicenseNumber: '',
  insecticideCommonName: '',
  technicalName: '',
  tradeName: '',
  activeIngredient: '',
  activeIngredients: [],
  formulationType: '',
  manualFormulationType: '',
  manufacturedBy: '',
  marketedBy: '',
  distributorName: '',
  registrationNumber: '',
  manufacturingLicenseNumber: '',
  batchNumber: '',
  manufactureDate: '',
  expiryDate: '',
  packingCondition: '',
  sampleQuantity: '',
  sampleQuantityAnalysis: '',
  stockBeforeSampling: '',
  stockAfterSampling: '',
  stockRegisterFolio: '',
  stockReceiptDetails: '',
  invoiceParticulars: '',
  invoiceNumber: '',
  invoiceDate: '',
  stockPosition: '',
  specimenSeal: '',
  distinctMark: '',
  cdaCode: '',
  qciSealParticulars: '',
  caSealParticulars: '',
  otherInformation: '',
  labAddress: 'The Insecticide Analyst,\nDeputy Director of Agriculture (IA),\nPesticide Testing Laboratory & Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad -500036.',
  qualification: '',
  manualQualification: '',
  manualDistrict: '',
  manualMandal: '',
  ptlName: '',
  dispatchDate: '',
  pincode: '',
  email: '',
  sampleSerialNumber: '',
  // Covering Letter Details
  financialYear: '',
  letterNumber: '',
  letterDate: new Date().toISOString().slice(0, 10),
  authorityType: 'DAO',
  memoNumber: '',
  memoDate: '',
  division: '',
  officerPhone: '',
};

// Helper functions for backward compatibility and combination detection

export function isCombinationProduct(technicalName: string): boolean {
  if (!technicalName) return false;
  return technicalName.includes('+') || technicalName.includes('&');
}

export function isCombinationProductFromActiveIngredient(activeIngredient: string): boolean {
  if (!activeIngredient) return false;
  // Check if active ingredient contains multiple name+concentration patterns
  // Pattern: "Name 18.5% Name 22%" or "18.5% 22%" or "Name 18.5% + Name 22%"
  const trimmed = activeIngredient.trim();
  
  // Check for explicit + or & separators
  if (trimmed.includes('+') || trimmed.includes('&')) {
    return true;
  }
  
  // Check for multiple concentration values
  const parts = trimmed.split(/\s+/);
  let concentrationCount = 0;
  parts.forEach(part => {
    if (/^\d+(\.\d+)?%?$/.test(part)) {
      concentrationCount++;
    }
  });
  
  return concentrationCount > 1;
}

export function normalizeConcentration(concentration: string): string {
  if (!concentration) return '';
  
  // Normalize concentration by removing spaces around % and between % and units
  // Examples:
  // "20 % w/w" → "20% w/w"
  // "20% w/w" → "20% w/w"
  // "20 %w/w" → "20% w/w"
  // "20%w/w" → "20% w/w"
  // "20 % W/W" → "20% W/W"
  // "20% W/W" → "20% W/W"
  // "20 w/w" → "20% w/w" (add missing %)
  
  let normalized = concentration.trim();
  
  // Step 1: Remove spaces around %: "20 %" → "20%", "% w/w" → "%w/w"
  normalized = normalized.replace(/\s*%\s*/g, '%');
  
  // Step 2: Add space between % and units if missing: "20%w/w" → "20% w/w"
  normalized = normalized.replace(/%(w\/w|w\/v|v\/v)/gi, '% $1');
  
  // Step 3: Add % before units if it's missing (e.g., "20 w/w" → "20% w/w")
  // This must come after step 2 to avoid double-adding %
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s+(w\/w|w\/v|v\/v)/gi, '$1% $2');
  
  return normalized;
}

export function normalizeActiveIngredientString(activeIngredient: string): string {
  if (!activeIngredient) return '';
  
  // Normalize the entire active ingredient string to handle spaces around % and units
  // This ensures that "Acephate 18 % w/w Imidacloprid 20 % w/v" becomes "Acephate 18% w/w Imidacloprid 20% w/v"
  let normalized = activeIngredient.trim();
  
  // Step 1: Remove spaces around %: "20 %" → "20%", "% w/w" → "%w/w"
  normalized = normalized.replace(/\s*%\s*/g, '%');
  
  // Step 2: Add space between % and units if missing: "20%w/w" → "20% w/w"
  normalized = normalized.replace(/%(w\/w|w\/v|v\/v)/gi, '% $1');
  
  // Step 3: Add % before units if it's missing (e.g., "20 w/w" → "20% w/w")
  // This must come after step 2 to avoid double-adding %
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s+(w\/w|w\/v|v\/v)/gi, '$1% $2');
  
  return normalized;
}

export function parseCombinationActiveIngredient(activeIngredient: string): Array<{name: string, concentration: string}> {
  if (!activeIngredient) return [];
  
  const result: Array<{name: string, concentration: string}> = [];
  
  // Pattern to match: "Name concentration" where concentration can be "18%", "18% w/w", "18% w/v", "18% v/v", "18 w/w", "18", etc.
  // Split by looking for name followed by concentration pattern
  // Concentration pattern: number (with optional decimal) + optional % + optional space + optional unit (w/w, w/v, v/v, etc.)
  // This preserves the order as entered: % before units if entered that way
  const concentrationPattern = /(\d+(?:\.\d+)?(?:%?\s*(?:w\/w|w\/v|v\/v)?))/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = concentrationPattern.exec(activeIngredient)) !== null) {
    const concentration = match[1];
    const name = activeIngredient.substring(lastIndex, match.index).trim();
    
    if (name || concentration) {
      result.push({
        name: name,
        concentration: concentration.trim()
      });
    }
    
    lastIndex = concentrationPattern.lastIndex;
  }
  
  // Handle any remaining text after the last concentration
  if (lastIndex < activeIngredient.length) {
    const remaining = activeIngredient.substring(lastIndex).trim();
    if (remaining) {
      result.push({
        name: remaining,
        concentration: ''
      });
    }
  }
  
  return result;
}

export function extractIngredientNames(technicalName: string): string[] {
  if (!technicalName) return [];
  
  // Split by + or & (case-insensitive, whitespace-tolerant)
  const parts = technicalName.split(/\s*[+&]\s*/i);
  
  // Extract names, removing concentrations and trimming
  return parts.map(part => {
    // Remove concentration patterns like "40.1%" or "40.1" and formulation types
    const name = part.replace(/\s+\d+(\.\d+)?%?/g, '').replace(/\s+(AE|BB|BR|CS|D|DC|DP|DS|EC|ES|EW|FS|FU|G|GL|GR|LS|ME|OD|P|PA|RB|SC|SE|SG|SL|SP|TB|TC|TK|ULV|VP|WDG|WG|WP|WS)$/i, '').trim();
    return name;
  }).filter(name => name.length > 0);
}

export function sanitizeTechnicalName(technicalName: string): string {
  if (!technicalName) return '';
  
  // Remove concentration patterns from technical name
  // This removes patterns like "40.1%" or "40.1" that might be embedded
  const sanitized = technicalName.replace(/\s+\d+(\.\d+)?%?/g, '').trim();
  
  // Remove formulation types if present
  const withoutFormulation = sanitized.replace(/\s+(AE|BB|BR|CS|D|DC|DP|DS|EC|ES|EW|FS|FU|G|GL|GR|LS|ME|OD|P|PA|RB|SC|SE|SG|SL|SP|TB|TC|TK|ULV|VP|WDG|WG|WP|WS)$/i, '').trim();
  
  // Normalize & to +
  const normalized = withoutFormulation.replace(/&/g, '+');
  
  // Clean up spacing around +
  return normalized.replace(/\s*\+\s*/g, ' + ');
}

export function normalizeActiveIngredients(values: PesticidePdfValues): PesticidePdfValues {
  const normalized = { ...values };
  
  // Check if current technicalName indicates a combination product
  const isCombo = isCombinationProduct(normalized.technicalName);
  const ingredientNames = extractIngredientNames(normalized.technicalName);
  
  // If technicalName changed from combination to single, reset activeIngredients
  if (!isCombo && normalized.activeIngredients && normalized.activeIngredients.length > 1) {
    // Reset to single entry, preserve first concentration if available
    const existingConcentration = normalized.activeIngredients[0]?.concentration || normalized.activeIngredient || '';
    normalized.activeIngredients = [{
      name: '',
      concentration: existingConcentration
    }];
  }
  
  // If technicalName changed from single to combination, update activeIngredients
  if (isCombo && ingredientNames.length > 0) {
    const existingConcentrations = normalized.activeIngredients || [];
    normalized.activeIngredients = ingredientNames.map((name, index) => ({
      name: name.trim(),
      concentration: existingConcentrations[index]?.concentration || ''
    }));
  }
  
  // Normalize concentration values in activeIngredients array to handle spaces around % and units
  if (normalized.activeIngredients && normalized.activeIngredients.length > 0) {
    normalized.activeIngredients = normalized.activeIngredients.map(ingredient => ({
      ...ingredient,
      concentration: normalizeConcentration(ingredient.concentration || '')
    }));
  }
  
  // If activeIngredients array is empty but activeIngredient has data, migrate it
  if (!normalized.activeIngredients || normalized.activeIngredients.length === 0) {
    if (normalized.activeIngredient && normalized.activeIngredient.trim()) {
      // Try to parse legacy format: "18.5%" or "Chlorantraniliprole 18.5%"
      const legacyValue = normalized.activeIngredient.trim();
      
      // Check if it's just a percentage (e.g., "18.5%")
      if (/^\d+(\.\d+)?%?$/.test(legacyValue)) {
        // When it's just a percentage, don't include technical name in activeIngredients
        // to avoid duplication in PDF output (technicalName is already displayed separately)
        normalized.activeIngredients = [{
          name: '',
          concentration: legacyValue.replace('%', '')
        }];
      } else {
        // Check for combination format: "40.1 + 3.9" or "Name 40.1% + Name 3.9%"
        if (legacyValue.includes('+') || legacyValue.includes('&')) {
          const parts = legacyValue.split(/\s*[+&]\s*/i);
          normalized.activeIngredients = parts.map(part => {
            const match = part.match(/^(.+?)\s+(\d+(\.\d+)?%?)$/);
            if (match) {
              return {
                name: match[1].trim(),
                concentration: match[2].replace('%', '')
              };
            }
            // If just a number, use as concentration without name
            if (/^\d+(\.\d+)?%?$/.test(part.trim())) {
              return {
                name: '',
                concentration: part.trim().replace('%', '')
              };
            }
            // Fallback: treat as name with empty concentration
            return {
              name: part.trim(),
              concentration: ''
            };
          });
        } else {
          // It might be "Name 18.5%" format, try to extract
          const match = legacyValue.match(/^(.+?)\s+(\d+(\.\d+)?%?)$/);
          if (match) {
            normalized.activeIngredients = [{
              name: match[1].trim(),
              concentration: match[2].replace('%', '')
            }];
          } else {
            // Fallback: use as concentration without technical name to avoid duplication
            normalized.activeIngredients = [{
              name: '',
              concentration: legacyValue.replace('%', '')
            }];
          }
        }
      }
    }
  }
  
  // Ensure activeIngredients is always an array
  if (!normalized.activeIngredients) {
    normalized.activeIngredients = [];
  }
  
  return normalized;
}

export function formatActiveIngredientsForDisplay(activeIngredients: ActiveIngredient[], legacyActiveIngredient: string): string {
  // If we have structured active ingredients, use them
  if (activeIngredients && activeIngredients.length > 0) {
    return activeIngredients
      .map(ai => {
        const concentration = ai.concentration?.trim() || '';
        // Remove % after formulation types (e.g., "w/w%" -> "w/w", "w/v%" -> "w/v")
        const cleanedConc = concentration.replace(/(w\/w|w\/v|s\/p|g\/g|e\/c)%/gi, '$1');
        // Only add % if not already present and not empty
        const normalizedConc = cleanedConc && !cleanedConc.endsWith('%') ? `${cleanedConc}%` : cleanedConc;
        // Only include name if it's not empty
        return ai.name && ai.name.trim() 
          ? `${ai.name.trim()} ${normalizedConc}`
          : normalizedConc;
      })
      .filter(part => part && part.trim() !== '')
      .join(' + ');
  }
  
  // Fallback to legacy field
  if (legacyActiveIngredient) {
    const cleaned = legacyActiveIngredient.trim();
    return cleaned.endsWith('%') ? cleaned : `${cleaned}%`;
  }
  
  return '';
}

export const pesticideFormTitles: Record<PesticideStatutoryFormType, string> = {
  VC: 'FORM V(C)',
  VD: 'FORM V(D)',
  VE: 'FORM V(E)',
  DOCKET: 'DOCKET SHEET',
};

const PAGE = { marginX: 18, top: 22, bottom: 276, width: 210, height: 297 };
const PDF_FONT = 'times';
const BODY_SIZE = 12.2;
const TITLE_SIZE = 15;
const LINE_HEIGHT = 6.2;

type PdfCursor = {
  doc: JsPdfInstance;
  y: number;
  contentWidth: number;
};

export async function generatePesticideStatutoryPdf(formType: PesticideStatutoryFormType, values: PesticidePdfValues, watermarkEnabled: boolean = false) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, `${pesticideFormTitles[formType]} - Pesticide Sampling`);
  await drawWatermark(doc);
  drawPesticideForm(doc, formType, normalizePesticideValues(values));
  return doc;
}

export async function generateAllPesticideStatutoryPdf(values: PesticidePdfValues, watermarkEnabled: boolean = false) {
  const { jsPDF } = await import('jspdf');
  const doc = createDocument(jsPDF, 'Form VC VD VE Docket - Pesticide Sampling');
  const normalized = normalizePesticideValues(values);
  await drawWatermark(doc);
  drawPesticideForm(doc, 'VD', normalized);
  doc.addPage();
  await drawWatermark(doc);
  drawPesticideForm(doc, 'VE', normalized);
  doc.addPage();
  await drawWatermark(doc);
  drawPesticideForm(doc, 'VC', normalized);
  doc.addPage();
  await drawWatermark(doc);
  drawPesticideForm(doc, 'DOCKET', normalized);
  return doc;
}

export function getPesticidePdfFileName(formType: PesticideStatutoryFormType, values: PesticidePdfValues) {
  return `${getSampleFilePart(values)}_${getPesticideFormFilePart(formType)}.pdf`;
}

export function getAllPesticidePdfFileName(values: PesticidePdfValues) {
  return `${getSampleFilePart(values)}_FormVC_FormVD_FormVE_Docket.pdf`;
}

function createDocument(
  jsPDF: new (options: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
  title: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title, subject: 'Pesticide statutory sampling form', creator: 'AGRONIX' });
  return doc;
}

function drawPesticideForm(doc: JsPdfInstance, formType: PesticideStatutoryFormType, values: PesticidePdfValues) {
  const cursor = resetPage(doc);
  if (formType === 'VD') drawFormVD(cursor, values);
  if (formType === 'VE') drawFormVE(cursor, values);
  if (formType === 'VC') drawFormVC(cursor, values);
  if (formType === 'DOCKET') drawDocket(cursor, values);
}

function resetPage(doc: JsPdfInstance): PdfCursor {
  doc.setLineHeightFactor(1.25);
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(BODY_SIZE);
  return { doc, y: PAGE.top, contentWidth: PAGE.width - PAGE.marginX * 2 };
}

function drawFormVD(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(D): FORM TO BE KEPT WITH SAMPLE IN SEALED PACKET', '[See sub-rule (1) of Rule 34]');
  address(cursor, 'To:', values.labAddress);
  cursor.y += 3;
  fieldList(cursor, [
    ['1. Name of the Insecticide', pesticideNameWithoutTrade(values), '(Common Name with active ingredient % and formulation type)'],
    ['2. Batch Number', values.batchNumber],
    ['3. Date of Manufacture', formatDate(values.manufactureDate)],
    ['4. Date of Expiry', formatDate(values.expiryDate)],
    ['5. Packing condition (original sealed/loose)', values.packingCondition],
    ['6. Quantity of the sample', values.sampleQuantity],
    ['7. Sample drawn on', formatDate(values.sampleDrawnDate)],
    ['8. Sample drawn by', inspectorLine(values)],
    ['9. Specimen seal of Insecticide Inspector/Licensee, if any', values.specimenSeal],
    ['10. Distinct mark on the sealed packet of sample', values.cdaCode],
  ]);
  cursor.y += 8;
  cursor.y += 18;
  signatureLine(cursor, `Date: ${formatDate(values.sampleDrawnDate)}`, 'Insecticide Inspector');
  cursor.y += 1;
  cursor.doc.text('(Signature & seal)', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
}

function drawFormVE(cursor: PdfCursor, values: PesticidePdfValues) {
  centeredTitle(cursor, 'V(E): MEMORANDUM TO INSECTICIDE ANALYST', '[See sub-rule (3) of Rule 34]');
  address(cursor, 'From:', inspectorAddress(values));
  cursor.y += 3;
  address(cursor, 'To:', values.labAddress);
  cursor.y += 6;
  paragraphWithHangingIndent(cursor, '1. The portion of sample / container described below is sent herewith for test or analysis under rule 34 of the Insecticide Rules, 1971:');
  cursor.y += 5;
  fieldList(cursor, [
    ['(a) Common name of the Insecticide', pesticideNameWithoutTrade(values), '(nominal content, type of formulation etc.)'],
    ['(b) State of packing of the sample', values.packingCondition],
    ['(c) Specimen Impression of the seal of the Inspector:', ''],
  ], 68, 6);
  cursor.y += 5;
  cursor.doc.setFont(PDF_FONT, 'normal');
  paragraphWithHangingIndentAndInlineValue(cursor, '2. The portion of sample/container has been assigned the distinct number or marked by me with the following mark:', values.cdaCode || '');
  cursor.doc.setFont(PDF_FONT, 'normal');
  paragraphWithHangingIndent(cursor, '3. A copy of this Memorandum along with a Form V (D) has been sent separately with the sample by Registered Post or by hand.');
  cursor.y += 5;
  cursor.y = Math.max(cursor.y + 12, 216);
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  signatureLine(cursor, `Place: ${resolvedMandal || '________________'}\nDate: ${formatDate(values.sampleDrawnDate)}`, 'Insecticide Inspector');
  cursor.y += 1;
  cursor.doc.text('(Signature & seal)', PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.y += LINE_HEIGHT;
}

function drawFormVC(cursor: PdfCursor, values: PesticidePdfValues) {
  cursor.y -= 6;
  cursor.doc.setLineHeightFactor(0.9);
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.setFontSize(12);
  const vcTitle = 'V(C): INTIMATION TO PERSON/LICENSEE FROM WHOM SAMPLE IS TAKEN';
  cursor.doc.text(vcTitle, PAGE.width / 2, cursor.y, { align: 'center' });
  const titleWidth = cursor.doc.getTextWidth(vcTitle);
  cursor.doc.line(PAGE.width / 2 - titleWidth / 2, cursor.y + 1.5, PAGE.width / 2 + titleWidth / 2, cursor.y + 1.5);
  cursor.y += 5;
  cursor.doc.setFontSize(BODY_SIZE);
  cursor.doc.setFont(PDF_FONT, 'normal');
  const ruleText = 'See Rule 33';
  const bracketWidth = cursor.doc.getTextWidth('[');
  const textWidth = cursor.doc.getTextWidth(ruleText);
  const totalWidth = bracketWidth * 2 + textWidth;
  const startX = PAGE.width / 2 - totalWidth / 2;
  cursor.doc.text('[', startX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'italic');
  cursor.doc.text(ruleText, startX + bracketWidth, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.text(']', startX + bracketWidth + textWidth, cursor.y);
  cursor.y += 6;
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, 'To:');
  cursor.doc.setFont(PDF_FONT, 'normal');
  addressBlock(cursor, buildDealerAddress(values), PAGE.marginX, 2, true);
  const drawDate = splitDrawnDate(values);
  
  // Build one continuous paragraph with bold values
  const mandal = values.mandal === 'Others' ? values.manualMandal : values.mandal || values.manualMandal || '';
  const paraText = `I have this ${drawDate.day} day of month ${drawDate.month} year 20${drawDate.year} taken sample from the premises of M/s ${values.dealerName || '____________________'} (Sale/stock/distribution License number ${values.authorizationLicenseNumber || '________'} dated ${formatDate(values.licenseDate) || '________'}) situated at ${dealerLocation(values) || '...........................................................'}${mandal ? `, ${mandal}` : ''}, a sample of the insecticide specified below for the purposes of test or analysis:`;
  
  // Bold values: day, month, year, dealer name, authorization/license number, license date, dealer address, mandal
  const boldValues = [
    drawDate.day,
    drawDate.month,
    `20${drawDate.year}`,
    values.dealerName,
    values.authorizationLicenseNumber,
    formatDate(values.licenseDate),
    dealerLocation(values),
    mandal
  ].filter(Boolean);
  
  // Only adjust cursor position upward if address has actual content to prevent overlap when empty
  const hasAddressContent = values.dealerName || values.dealerAddress || values.premisesLocation || values.mandal || values.district;
  if (hasAddressContent) {
    cursor.y -= 6;
  }
  
  // Render as one continuous justified paragraph with first-line indent
  renderJustifiedParagraph(cursor, paraText, boldValues);
  
  // Add consistent spacing after paragraph before numbered items
  cursor.y += LINE_HEIGHT;
  
  // Calculate stock after sampling: Stock Position - 3
  // Parse the stock position to extract quantity and preserve pack size/units
  const calculateStockAfter = (stockPosition: string): string => {
    if (!stockPosition || stockPosition.trim() === '') return '';
    
    const trimmed = stockPosition.trim();
    // Match pattern: first number at start, then everything else (including *, spaces, parentheses, etc.)
    const match = trimmed.match(/^(\d+)(.*)$/);
    
    if (match) {
      const quantity = parseInt(match[1], 10);
      const rest = match[2] || '';
      const newQuantity = Math.max(0, quantity - 3);
      
      return `${newQuantity}${rest}`;
    }
    
    // If no match, return empty (invalid format)
    return '';
  };
  
  const stockAfter = calculateStockAfter(values.stockPosition);
  // Display stock position value without appending "Units"
  const stockPositionDisplay = values.stockPosition || '';
  
  // Move point 1 up by 3 units
  cursor.y -= 3;
  
  fieldList(cursor, [
    ['1. Common name of the insecticide', pesticideNameWithoutTrade(values), '(Mention complete details like nominal content, formulation type, etc.)'],
    ['2. Trade name, if any', values.tradeName],
    ['3. Manufactured by', values.manufacturedBy],
    ['4. Registration number', values.registrationNumber],
    ['5. Marketed by', values.marketedBy],
    ['6. Manufacturing License No.', values.manufacturingLicenseNumber],
    ['7. Batch number', values.batchNumber],
    ['8. Date of manufacture', formatDate(values.manufactureDate)],
    ['9. Date of expiry', formatDate(values.expiryDate)],
    ['10. Stock before sampling', stockPositionDisplay, '(Mention units)'],
    ['11. Quantity of the sample taken', values.sampleQuantity, '(Mention units)'],
    ['12. Stock after sampling', stockAfter, '(Mention units)'],
    ['13. Folio/page number of stock register', values.stockRegisterFolio],
    ['14. Any other relevant information', values.otherInformation],
  ], 82);
  cursor.y += 3;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  signatureLine(cursor, `Place: ${resolvedMandal || '________________'}`, 'Insecticide Inspector Seal');
  cursor.y += 2;
  cursor.y += 6;
  const witness1Label = '1. Signature of witness:';
  cursor.doc.text(witness1Label, PAGE.marginX, cursor.y);
  const witness1Width = cursor.doc.getTextWidth(witness1Label);
  drawBlank(cursor.doc, PAGE.marginX + witness1Width + 3, cursor.y, 80);
  cursor.y += LINE_HEIGHT + 2;
  cursor.y += 3;
  const witness2Label = '2. Signature of witness:';
  cursor.doc.text(witness2Label, PAGE.marginX, cursor.y);
  const witness2Width = cursor.doc.getTextWidth(witness2Label);
  drawBlank(cursor.doc, PAGE.marginX + witness2Width + 3, cursor.y, 80);
  cursor.y += 8;
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text('(Received one sealed portion of sample along with a copy of this Form.)', PAGE.marginX, cursor.y);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT + 2;
  cursor.y += 6;
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text('Signature of the person from whom the sample is taken', PAGE.width / 2 + 23, cursor.y, { align: 'center' });
  cursor.y += 3.1;
  cursor.doc.text('with date and seal', PAGE.width / 2 + 23, cursor.y, { align: 'center' });
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.setLineHeightFactor(1.25);
}

function subItemField(cursor: PdfCursor, mainLabel: string, subItems: Array<[string, string]>, labelWidth = 74) {
  const x = PAGE.marginX;
  const indent = 8;
  const colonX = x + labelWidth + 1;
  const valueX = colonX + 4;
  
  // Calculate total height needed for the entire subItemField
  // Main label + spacing + each sub-item
  let totalHeight = LINE_HEIGHT + 2; // Main label + spacing
  subItems.forEach(([, subValue]) => {
    const availableValueWidth = PAGE.width - valueX - PAGE.marginX;
    const valueLines = split(cursor, subValue || '', availableValueWidth);
    totalHeight += Math.max(valueLines.length, 1) * LINE_HEIGHT + 0.5; // Reduced spacing between sub-items
  });
  totalHeight += 2; // Final spacing
  
  // Ensure the entire subItemField fits on the current page
  // If not, move to the next page to prevent splitting
  ensure(cursor, totalHeight);
  
  // Render main label
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.text(mainLabel, x, cursor.y);
  cursor.y += LINE_HEIGHT;
  
  // Render each sub-item with colon aligned to main fields
  subItems.forEach(([subLabel, subValue]) => {
    const subLabelX = x + indent;
    const availableValueWidth = PAGE.width - valueX - PAGE.marginX;
    
    cursor.doc.text(subLabel, subLabelX, cursor.y);
    cursor.doc.text(':', colonX, cursor.y);
    
    const valueLines = split(cursor, subValue || '', availableValueWidth);
    cursor.doc.text(valueLines, valueX, cursor.y);
    
    cursor.y += Math.max(valueLines.length, 1) * LINE_HEIGHT + 0.5; // Reduced spacing between sub-items
  });
  
  cursor.y += 2;
}

function drawDocket(cursor: PdfCursor, values: PesticidePdfValues) {
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  
  // Use Q.C.I. SEAL PARTICULARS value directly
  const qciSealValue = values.qciSealParticulars;
  // Map Quantity Drawn for Analysis to Quantity of Sample Drawn
  const sampleQuantityAnalysis = values.sampleQuantity || values.sampleQuantityAnalysis;
  // Format invoice particulars as "No: [invoiceNumber], Dt: [invoiceDate]"
  const invoiceParticularsFormatted = [
    values.invoiceNumber ? `No: ${values.invoiceNumber}` : '',
    values.invoiceDate ? `Dt: ${formatDate(values.invoiceDate)}` : ''
  ].filter(Boolean).join(', ');
  // Format stock receipt details as "[invoiceDate] from [distributorName]"
  const stockReceiptDetailsFormatted = [
    values.invoiceDate ? formatDate(values.invoiceDate) : '',
    values.distributorName ? `from ${values.distributorName}` : ''
  ].filter(Boolean).join(' ');
  // Format dealer name with mandal
  const dealerWithMandal = resolvedMandal ? `${values.dealerName}, ${resolvedMandal}` : values.dealerName;
  
  cursor.y -= 6;
  centeredTitle(cursor, 'DOCKET SHEET');
  // Move content up by 5pt (approximately 1.76mm) starting from Point 1
  cursor.y -= 5;
  fieldList(cursor, [
    ['1. Name of the District', resolvedDistrict],
  ], 82);
  
  // Sample drawn by with sub-items
  subItemField(cursor, '2. Sample drawn by', [
    ['a) Name', values.officerName],
    ['b) Designation', designationLine(values)],
  ], 82);
  
  // Name of the Chemical with sub-items
  subItemField(cursor, '3. Name of the Chemical', [
    ['a) Trade Name', values.tradeName],
    ['b) Technical Name', sanitizeTechnicalName(values.technicalName) || values.insecticideCommonName],
  ], 82);
  
  const normalizedValues = normalizeActiveIngredients(values);
  const formattedActiveIngredient = formatActiveIngredientsForDisplay(
    normalizedValues.activeIngredients,
    normalizedValues.activeIngredient
  );
  
  // Add formulation type to Guaranteed of % ai
  const formulationType = values.formulationType === 'Others' 
    ? values.manualFormulationType?.trim() || ''
    : values.formulationType?.trim() || '';
  // Remove trailing % from formulation type to avoid duplicate (e.g., w/w% -> w/w)
  const formulationTypeCleaned = formulationType?.replace(/%$/, '') || '';
  const guaranteedWithFormulation = formulationTypeCleaned 
    ? `${formattedActiveIngredient} ${formulationTypeCleaned}` 
    : formattedActiveIngredient;
  
  // Build the field list for items 4-20
  const mainFields: Array<[string, string, string?]> = [
    ['4. Guaranteed of % ai', guaranteedWithFormulation],
    ['5. Qty. of sample drawn for analysis', sampleQuantityAnalysis],
    ['6. Name of the dealer from whom the sample drawn', dealerWithMandal],
    ['7. Name of the Distributor', values.distributorName],
    ['8. Name of the Manufacturer', values.manufacturedBy],
    ['9. Batch Number', values.batchNumber],
    ['10. Date Manufacturing', formatDate(values.manufactureDate)],
    ['11. Date of Expiry', formatDate(values.expiryDate)],
    ['12. Date of Drawl of Sample', formatDate(values.sampleDrawnDate)],
    ['13. Date of receipt of stock by the dealer and from whom received', stockReceiptDetailsFormatted],
    ['14. Particulars of Invoice', invoiceParticularsFormatted],
    ['15. Stock position of batch at the time of drawl of sample', values.stockPosition],
    ['16. Code No. of A.O./A.D.A./D.D.A.', values.sampleSerialNumber],
    ['17. Q.C.I. Seal Particulars', qciSealValue],
    ['18. C.A. Seal Particulars', values.cdaCode],
    ['19. Name of the P.T.L.to which sent For analysis', 'Pesticide Testing Laboratory & Coding Centre,\nSAMETI Complex, Old Malakpet,\nHyderabad -500036'],
    ['20. Date of Dispatch', formatDate(values.dispatchDate)],
  ];
  
  // Calculate space needed for signature section (10mm spacing + signature line)
  const signatureSpaceNeeded = 10 + LINE_HEIGHT * 2;
  
  // Check if we're near the end of the page before rendering the last few fields
  // If we have less than 40mm remaining, move to next page to prevent awkward pagination
  if (cursor.y > PAGE.bottom - 40) {
    cursor.doc.addPage();
    cursor.y = PAGE.top;
  }
  
  // Render the main fields
  fieldList(cursor, mainFields, 82);
  
  // Ensure signature section fits on the current page
  // If not, move to the next page
  if (cursor.y + signatureSpaceNeeded > PAGE.bottom) {
    cursor.doc.addPage();
    cursor.y = PAGE.top;
  }
  
  cursor.y += 5;
  signatureLine(cursor, '', 'Signature of Insecticide Inspector');
  cursor.y += 2;
}

function centeredTitle(cursor: PdfCursor, title: string, subtitle = '') {
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.setFontSize(TITLE_SIZE);
  cursor.doc.text(title, PAGE.width / 2, cursor.y, { align: 'center' });
  const titleWidth = cursor.doc.getTextWidth(title);
  cursor.doc.line(PAGE.width / 2 - titleWidth / 2, cursor.y + 1.5, PAGE.width / 2 + titleWidth / 2, cursor.y + 1.5);
  cursor.y += 8;
  if (subtitle) {
    cursor.doc.setFontSize(BODY_SIZE);
    cursor.doc.setFont(PDF_FONT, 'normal');
    // Format subtitle with normal brackets and italic text
    if (subtitle.startsWith('[') && subtitle.endsWith(']')) {
      const innerText = subtitle.slice(1, -1);
      const bracketWidth = cursor.doc.getTextWidth('[');
      const textWidth = cursor.doc.getTextWidth(innerText);
      const totalWidth = bracketWidth * 2 + textWidth;
      const startX = PAGE.width / 2 - totalWidth / 2;
      cursor.doc.text('[', startX, cursor.y);
      cursor.doc.setFont(PDF_FONT, 'italic');
      cursor.doc.text(innerText, startX + bracketWidth, cursor.y);
      cursor.doc.setFont(PDF_FONT, 'normal');
      cursor.doc.text(']', startX + bracketWidth + textWidth, cursor.y);
    } else {
      cursor.doc.text(subtitle, PAGE.width / 2, cursor.y, { align: 'center' });
    }
    cursor.y += 12;
  } else {
    cursor.y += 8;
  }
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.doc.setFontSize(BODY_SIZE);
}

function fieldList(cursor: PdfCursor, rows: Array<[string, string, string?]>, labelWidth = 74, xOffset = 0) {
  rows.forEach(([label, value, note]) => {
    // Check if we're near the end of the page before rendering each field
    // If we have less than 25mm remaining, move to next page to prevent awkward pagination
    // This ensures that if an item doesn't fit, it moves to the next page with proper spacing
    if (cursor.y > PAGE.bottom - 25) {
      cursor.doc.addPage();
      cursor.y = PAGE.top;
    }
    fieldRow(cursor, label, value, note || '', labelWidth, xOffset);
  });
}

function fieldRow(cursor: PdfCursor, label: string, value: string, note = '', labelWidth = 74, xOffset = 0) {
  const x = PAGE.marginX + xOffset;
  const valueX = x + labelWidth + 5;
  const available = PAGE.width - valueX - PAGE.marginX;
  const valueLines = split(cursor, value || '', available);
  
  // Handle hanging indent for multi-line labels (both numbered and sub-point labels)
  const labelMatch = label.match(/^(\d+\.\s+|\([a-z]\)\s*)(.*)$/);
  let serialNumber = '';
  let labelText = label;
  let serialWidth = 0;
  
  if (labelMatch) {
    serialNumber = labelMatch[1];
    labelText = labelMatch[2];
    serialWidth = cursor.doc.getTextWidth(serialNumber);
  }
  
  const availableLabelWidth = labelWidth - serialWidth;
  const labelLines = split(cursor, labelText, availableLabelWidth);
  
  // Calculate note lines separately with font 10
  let noteLines: string[] = [];
  let noteHeight = 0;
  if (note) {
    const originalFontSize = cursor.doc.getFontSize();
    cursor.doc.setFontSize(10);
    noteLines = split(cursor, note, availableLabelWidth);
    noteHeight = noteLines.length * 4.5; // Tighter spacing for helper text
    cursor.doc.setFontSize(originalFontSize);
  }
  
  const rows = Math.max(labelLines.length, valueLines.length, 1);
  const totalHeight = rows * LINE_HEIGHT + noteHeight + 0.2;
  
  // Page-break handling: ensure the entire row fits on the current page
  // If not, move to the next page to prevent splitting
  ensure(cursor, totalHeight);
  
  const y = cursor.y;
  
  // Render serial number separately if exists
  if (serialNumber) {
    cursor.doc.text(serialNumber, x, y);
  }
  
  // Render label lines with hanging indent
  const labelStartX = x + serialWidth;
  cursor.doc.text(labelLines, labelStartX, y);
  cursor.doc.text(':', x + labelWidth + 1, y);
  
  // Render note with font 10 on new line
  if (noteLines.length > 0) {
    const originalFontSize = cursor.doc.getFontSize();
    cursor.doc.setFontSize(10);
    cursor.doc.text(noteLines, labelStartX, y + labelLines.length * 4.5);
    cursor.doc.setFontSize(originalFontSize);
  }
  
  if (valueLines.length) {
    cursor.doc.text(valueLines, valueX, y);
  } else {
    drawBlank(cursor.doc, valueX, y, available);
  }
  cursor.y += totalHeight;
}

function address(cursor: PdfCursor, label: string, value: string) {
  cursor.doc.setFont(PDF_FONT, 'bold');
  text(cursor, label);
  addressBlock(cursor, value, PAGE.marginX + 8, 4, true);
}

function addressBlock(cursor: PdfCursor, value: string, x: number, minRows: number, bold = false) {
  const lines = split(cursor, value || '', PAGE.width - PAGE.marginX - x);
  cursor.doc.setFont(PDF_FONT, bold ? 'bold' : 'normal');
  // Increase line spacing by 0.1 for address lines
  const originalLineHeightFactor = cursor.doc.getLineHeightFactor() || 1.15;
  cursor.doc.setLineHeightFactor(originalLineHeightFactor + 0.1);
  if (lines.length && lines.join('').trim()) {
    ensure(cursor, Math.max(lines.length, minRows) * LINE_HEIGHT);
    cursor.doc.text(lines, x, cursor.y);
  } else {
    ensure(cursor, minRows * LINE_HEIGHT);
    for (let i = 0; i < minRows; i += 1) drawBlank(cursor.doc, x, cursor.y + i * LINE_HEIGHT, 72);
  }
  cursor.doc.setLineHeightFactor(originalLineHeightFactor);
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += Math.max(lines.length || 0, minRows) * LINE_HEIGHT + 2;
}

function signatureLine(cursor: PdfCursor, left: string, right: string) {
  ensure(cursor, LINE_HEIGHT * 2, true);
  cursor.doc.setFont(PDF_FONT, 'bold');
  cursor.doc.text(left, PAGE.marginX, cursor.y);
  cursor.doc.text(right, PAGE.width - PAGE.marginX, cursor.y, { align: 'right' });
  cursor.doc.setFont(PDF_FONT, 'normal');
  cursor.y += LINE_HEIGHT;
}

function paragraph(cursor: PdfCursor, value: string) {
  const lines = split(cursor, value, cursor.contentWidth);
  ensure(cursor, lines.length * LINE_HEIGHT + 2);
  cursor.doc.text(lines, PAGE.marginX, cursor.y);
  cursor.y += lines.length * LINE_HEIGHT + 2;
}

function paragraphWithHangingIndent(cursor: PdfCursor, value: string) {
  const labelMatch = value.match(/^(\d+\.\s+)(.*)$/);
  if (!labelMatch) {
    paragraph(cursor, value);
    return;
  }
  
  const serialNumber = labelMatch[1];
  const labelText = labelMatch[2];
  const serialWidth = cursor.doc.getTextWidth(serialNumber);
  const availableWidth = cursor.contentWidth - serialWidth;
  
  const labelLines = split(cursor, labelText, availableWidth);
  ensure(cursor, labelLines.length * LINE_HEIGHT + 2);
  
  cursor.doc.text(serialNumber, PAGE.marginX, cursor.y);
  cursor.doc.text(labelLines, PAGE.marginX + serialWidth, cursor.y);
  cursor.y += labelLines.length * LINE_HEIGHT + 2;
}

function paragraphWithHangingIndentAndInlineValue(cursor: PdfCursor, value: string, inlineValue: string) {
  const labelMatch = value.match(/^(\d+\.\s+)(.*)$/);
  if (!labelMatch) {
    paragraph(cursor, value);
    if (inlineValue) {
      cursor.doc.setFont(PDF_FONT, 'bold');
      cursor.doc.text(inlineValue, PAGE.marginX, cursor.y);
      cursor.doc.setFont(PDF_FONT, 'normal');
      cursor.y += LINE_HEIGHT;
    }
    return;
  }
  
  const serialNumber = labelMatch[1];
  const labelText = labelMatch[2];
  const serialWidth = cursor.doc.getTextWidth(serialNumber);
  const labelStartX = PAGE.marginX + serialWidth;
  
  // Calculate text before the value
  const textBeforeValue = labelText + ' ';
  const availableWidth = cursor.contentWidth - serialWidth;
  
  // Split the text before value to handle wrapping
  const textBeforeLines = split(cursor, textBeforeValue, availableWidth);
  
  // Calculate total height needed
  const totalLines = textBeforeLines.length;
  ensure(cursor, totalLines * LINE_HEIGHT + 2);
  
  cursor.doc.text(serialNumber, PAGE.marginX, cursor.y);
  
  // Render text before value (normal font)
  cursor.doc.text(textBeforeLines, labelStartX, cursor.y);
  
  // Render the inline value in bold on the same line as the last line of text before value
  if (inlineValue) {
    const lastLineY = cursor.y + (textBeforeLines.length - 1) * LINE_HEIGHT;
    const lastLineWidth = cursor.doc.getTextWidth(textBeforeLines[textBeforeLines.length - 1]);
    const valueX = labelStartX + lastLineWidth + 2;
    
    cursor.doc.setFont(PDF_FONT, 'bold');
    cursor.doc.text(inlineValue, valueX, lastLineY);
    cursor.doc.setFont(PDF_FONT, 'normal');
  }
  
  cursor.y += totalLines * LINE_HEIGHT + 2;
}

function renderJustifiedParagraph(cursor: PdfCursor, text: string, boldValues: string[], firstLineIndent = 12) {
  const indentWidth = firstLineIndent;
  const availableWidth = cursor.contentWidth - indentWidth;
  
  // Split text into segments and identify which should be bold
  const segments: { text: string; bold: boolean }[] = [];
  let remaining = text;
  
  boldValues.forEach(boldValue => {
    if (!boldValue) return;
    const parts = remaining.split(boldValue);
    if (parts.length > 1) {
      segments.push({ text: parts[0], bold: false });
      segments.push({ text: boldValue, bold: true });
      remaining = parts.slice(1).join(boldValue);
    }
  });
  
  if (remaining) {
    segments.push({ text: remaining, bold: false });
  }
  
  // Build lines with proper wrapping
  let lines: { text: string; bold: boolean }[][] = [];
  let currentLine: { text: string; bold: boolean }[] = [];
  let currentLineWidth = 0;
  let isFirstLine = true;
  
  segments.forEach(segment => {
    const words = segment.text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordWithSpace = wordIndex === 0 ? word : ` ${word}`;
      const wordWidth = cursor.doc.getTextWidth(wordWithSpace);
      const maxWidth = isFirstLine ? availableWidth : cursor.contentWidth;
      
      if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [{ text: word, bold: segment.bold }];
        currentLineWidth = cursor.doc.getTextWidth(word);
        isFirstLine = false;
      } else {
        currentLine.push({ text: wordWithSpace, bold: segment.bold });
        currentLineWidth += wordWidth;
      }
    });
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Render lines with first-line indent and single line spacing
  ensure(cursor, lines.length * LINE_HEIGHT);
  
  lines.forEach((line, index) => {
    const x = index === 0 ? PAGE.marginX + indentWidth : PAGE.marginX;
    let currentX = x;
    
    line.forEach(segment => {
      cursor.doc.setFont(PDF_FONT, segment.bold ? 'bold' : 'normal');
      cursor.doc.text(segment.text, currentX, cursor.y);
      currentX += cursor.doc.getTextWidth(segment.text);
    });
    
    cursor.y += LINE_HEIGHT;
  });
  
  cursor.doc.setFont(PDF_FONT, 'normal');
}

function text(cursor: PdfCursor, value: string) {
  ensure(cursor, LINE_HEIGHT);
  cursor.doc.text(value, PAGE.marginX, cursor.y);
  cursor.y += LINE_HEIGHT;
}

function drawBlank(doc: JsPdfInstance, x: number, y: number, width: number) {
  doc.line(x, y + 1.4, Math.min(PAGE.width - PAGE.marginX, x + width), y + 1.4);
}

function ensure(cursor: PdfCursor, neededHeight: number, noPageBreak = false) {
  if (cursor.y + neededHeight <= PAGE.bottom) return;
  if (noPageBreak) return;
  cursor.doc.addPage();
  cursor.y = PAGE.top;
}

function split(cursor: PdfCursor, value: string, width: number) {
  return cursor.doc.splitTextToSize(value || '', width) as string[];
}

function normalizePesticideValues(values: PesticidePdfValues): PesticidePdfValues {
  let normalized = { ...initialPesticidePdfValues, ...values };
  if (!normalized.sampleDrawnDay || !normalized.sampleDrawnMonth || !normalized.sampleDrawnYear) {
    const date = new Date(`${normalized.sampleDrawnDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      normalized.sampleDrawnDay = normalized.sampleDrawnDay || String(date.getDate()).padStart(2, '0');
      normalized.sampleDrawnMonth = normalized.sampleDrawnMonth || date.toLocaleString('en-IN', { month: 'long' });
      normalized.sampleDrawnYear = normalized.sampleDrawnYear || String(date.getFullYear()).slice(-2);
    }
  }
  // Normalize active ingredients for backward compatibility
  normalized = normalizeActiveIngredients(normalized);
  // Ensure new fields have default values for backward compatibility
  // (already handled by spreading initialPesticidePdfValues which includes defaults)
  return normalized;
}

export function pesticideNameWithoutTrade(values: PesticidePdfValues) {
  // Check if this is a combination product based on active ingredient field
  const activeIngredientIsCombo = isCombinationProductFromActiveIngredient(values.activeIngredient);
  const technicalNameIsCombo = isCombinationProduct(values.technicalName);
  const staleCombinationIngredient = activeIngredientIsCombo && !technicalNameIsCombo;
  const isCombo = activeIngredientIsCombo && technicalNameIsCombo;
  
  if (isCombo) {
    // For combination products, build the display from the active ingredient field
    // which contains the name+concentration pairs (e.g., "Fipronil 18.5% Acephate 22%")
    // Normalize the entire active ingredient string before parsing to handle spaces around % and units
    const normalizedActiveIngredient = normalizeActiveIngredientString(values.activeIngredient);
    const parsed = parseCombinationActiveIngredient(normalizedActiveIngredient);
    const formulationType = values.formulationType === 'Others' 
      ? values.manualFormulationType?.trim() || ''
      : values.formulationType?.trim() || '';
    
    // Build the combination display: "Fipronil 18.5% + Acephate 22% GR"
    const parts = parsed.map(item => {
      const name = item.name?.trim() || '';
      const conc = item.concentration?.trim() || '';
      // Add % if missing, inserting it before w/w or w/v if present
      let finalConc = conc;
      if (conc && !conc.includes('%')) {
        // Check if it has w/w or w/v at the end
        const unitMatch = conc.match(/(w\/w|w\/v|v\/v)$/i);
        if (unitMatch) {
          // Insert % before the unit
          const unit = unitMatch[1];
          const baseConc = conc.substring(0, conc.length - unit.length).trim();
          finalConc = `${baseConc}% ${unit}`;
        } else {
          // No unit, just add % at the end
          finalConc = `${conc}%`;
        }
      }
      const part = name && finalConc ? `${name} ${finalConc}` : (name || finalConc);
      return part;
    }).filter(part => part && part.trim() !== '');
    
    const combinationDisplay = parts.join(' + ');
    const formulationDisplay = formulationType ? ` ${formulationType}` : '';
    
    return `${combinationDisplay}${formulationDisplay}`.trim();
  }
  
  // For single ingredient products, use the original behavior but ensure % is present
  const technical = values.technicalName || values.insecticideCommonName;
  let active = staleCombinationIngredient ? '' : values.activeIngredient || '';
  const formulation = staleCombinationIngredient ? '' : values.formulationType === 'Others' ? values.manualFormulationType : values.formulationType;
  const formulationDisplay = formulation ? ` ${formulation}` : '';
  
  // Ensure % is present for single ingredient
  if (active && !active.includes('%')) {
    active = `${active}%`;
  }
  
  const activeDisplay = active ? ` ${active}` : '';
  return `${technical}${activeDisplay}${formulationDisplay}`.trim();
}

function inspectorAddress(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  
  // Format district with PIN Code (e.g., "Kumrambheem Asifabad -504297")
  const districtWithPincode = values.pincode && resolvedDistrict 
    ? `${resolvedDistrict} -${values.pincode}`
    : resolvedDistrict || '';
  
  // Format email in brackets (e.g., "(email@example.com)")
  const emailInBrackets = values.officerEmail && values.officerEmail.trim() 
    ? `(${values.officerEmail.trim()})` 
    : '';
  
  const addressParts = [
    officerNameWithQualification,
    values.designation,
    resolvedMandal ? `${resolvedMandal} Mandal` : '',
    districtWithPincode,
  ]
    .map((part) => part.trim())
    .filter(Boolean);
  
  // Add email separately to avoid it being filtered out
  let address = addressParts.join('\n');
  if (emailInBrackets) {
    address += '\n' + emailInBrackets;
  }
  
  return formatAddressWithCommas(address);
}

function formatAddressWithCommas(address: string): string {
  if (!address || !address.trim()) return address;
  const lines = address.split('\n').filter(line => line.trim());
  const formatted = lines.map((line, index) => {
    const trimmedLine = line.trim();
    // Don't add punctuation to lines that are already in brackets (like email addresses)
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      return trimmedLine;
    }
    if (index === lines.length - 1) {
      return trimmedLine + '.';
    }
    return trimmedLine + ',';
  });
  return formatted.join('\n');
}

function inspectorLine(values: PesticidePdfValues) {
  const resolvedQualification = values.qualification === 'Others' ? values.manualQualification : values.qualification;
  const officerNameWithQualification = values.officerName && resolvedQualification 
    ? `${values.officerName}, ${resolvedQualification}`
    : values.officerName;
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  return [officerNameWithQualification, values.designation, resolvedMandal, resolvedDistrict].map((part) => part.trim()).filter(Boolean).join('\n');
}

function designationLine(values: PesticidePdfValues) {
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const parts = [values.designation];
  if (resolvedMandal) {
    parts.push(resolvedMandal);
  }
  return parts.map((part) => part.trim()).filter(Boolean).join(', ');
}

function buildDealerAddress(values: PesticidePdfValues) {
  const resolvedMandal = values.mandal === 'Others' ? values.manualMandal : values.mandal;
  const mandalWithText = resolvedMandal ? `${resolvedMandal} Mandal` : '';
  const resolvedDistrict = values.district === 'Others' ? values.manualDistrict : values.district;
  const districtWithPincode = values.pincode && resolvedDistrict ? `${resolvedDistrict} - ${values.pincode}` : resolvedDistrict;
  const addressLines = [values.dealerName, values.dealerAddress, values.premisesLocation, mandalWithText, districtWithPincode].map((part) => part.trim()).filter(Boolean);
  
  // Add punctuation: commas to all lines except last, full stop to last line
  const formattedLines = addressLines.map((line, index) => {
    if (index === addressLines.length - 1) {
      // Last line: add full stop if not already ending with . or ,
      return line.endsWith('.') || line.endsWith(',') ? line : `${line}.`;
    } else {
      // Other lines: add comma if not already ending with , or .
      return line.endsWith(',') || line.endsWith('.') ? line : `${line},`;
    }
  });
  
  return formattedLines.join('\n');
}

function dealerLocation(values: PesticidePdfValues) {
  const addressWithoutNewlines = values.dealerAddress.replace(/\n/g, ', ');
  const cleanedParts = [addressWithoutNewlines, values.premisesLocation]
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^,+|,+$/g, '').trim()); // Remove leading/trailing commas
  const joined = cleanedParts.join(', ');
  // Remove multiple consecutive commas and ensure single space after comma
  return joined.replace(/,+/g, ',').replace(/,\s*,/g, ',').replace(/,\s+/g, ', ');
}

function splitDrawnDate(values: PesticidePdfValues) {
  return {
    day: values.sampleDrawnDay || '__',
    month: values.sampleDrawnMonth || '________',
    year: values.sampleDrawnYear || '__',
  };
}

function getSampleFilePart(values: PesticidePdfValues) {
  return sanitizeFilePart(values.cdaCode || values.batchNumber || values.insecticideCommonName || values.dealerName) || 'PesticideSample';
}

function getPesticideFormFilePart(formType: PesticideStatutoryFormType) {
  if (formType === 'VC') return 'FormVC';
  if (formType === 'VD') return 'FormVD';
  if (formType === 'VE') return 'FormVE';
  return 'DocketSheet';
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
}

async function drawWatermark(doc: JsPdfInstance) {
  try {
    const response = await fetch('/images/telangana-govt_emblem.webp');
    const blob = await response.blob();
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Large watermark size to show complete emblem (increased by 50% total)
        const watermarkWidth = 156;
        const watermarkHeight = 104; // Maintain aspect ratio (3:2)
        
        // Center the watermark on the page with proper margins
        const watermarkX = (210 - watermarkWidth) / 2;
        const watermarkY = (297 - watermarkHeight) / 2;
        
        // Try to set opacity using GState if available
        try {
          const gState = (doc as any).GState({ opacity: 0.14 });
          doc.setGState(gState);
        } catch (e) {
          // GState not supported, continue without opacity
        }
        
        // Draw watermark
        doc.addImage(dataUrl, 'WEBP', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        
        // Reset opacity if GState was used
        try {
          doc.setGState((doc as any).GState({ opacity: 1.0 }));
        } catch (e) {
          // GState not supported, ignore
        }
        
        resolve(null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading watermark image:', error);
  }
}

