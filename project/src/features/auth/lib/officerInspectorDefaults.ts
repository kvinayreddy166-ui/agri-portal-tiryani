import { safeStorage } from '../../../shared/lib/safeStorage';
import {
  TELANGANA_DISTRICTS,
  QUALIFICATION_OPTIONS,
  getMandalsForDistrict,
  getDivisionsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import type { OfficerProfile } from '../types/officerAuth';

/**
 * Maps an officer profile (collected at registration) onto the inspector
 * detail fields used by statutory sampling forms, dealer inspection forms,
 * and statutory order entries. Everything stays editable — the helpers only
 * propose values and only fill fields that are currently empty.
 */

// Signup uses slightly different spellings than the shared district data.
const DISTRICT_ALIASES: Record<string, string> = {
  'hanumakonda': 'Hanamkonda',
  'kumuram bheem asifabad': 'Kumrambheem Asifabad',
  'kumurambheem asifabad': 'Kumrambheem Asifabad',
  'medchal-malkajgiri': 'Medchal–Malkajgiri',
  'medchal–malkajgiri': 'Medchal–Malkajgiri',
  'rangareddy': 'Ranga Reddy',
  'ranga reddy': 'Ranga Reddy',
};

export function normalizeTelanganaDistrict(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  const direct = TELANGANA_DISTRICTS.find((d) => d.toLowerCase() === trimmed.toLowerCase());
  if (direct) return direct;
  const alias = DISTRICT_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  // Fallback: match ignoring hyphen/en-dash and whitespace differences
  const squash = trimmed.toLowerCase().replace(/[\s\-–—]+/g, '');
  return TELANGANA_DISTRICTS.find((d) => d.toLowerCase().replace(/[\s\-–—]+/g, '') === squash) || '';
}

/** Canonical district key usable with getMandalsForDistrict / getDivisionsForDistrict. */
export function canonicalDistrictKey(value: string): string {
  return normalizeTelanganaDistrict(value);
}

/** Maps a profile designation (code or free text) to the statutory form designation value. */
export function statutoryDesignationForProfile(designation: string | undefined | null): string {
  const raw = (designation || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper === 'ADA' || /assistant director|asst\.?\s*director/i.test(raw)) return 'Asst. Director of Agriculture';
  if (upper === 'DAO' || /district agriculture officer|\bdao\b/i.test(raw)) return 'District Agriculture Officer';
  if (upper === 'MAO' || /mandal agriculture officer|\bmao\b/i.test(raw)) return 'Mandal Agriculture Officer';
  return '';
}

/** Combined designation used by dealer inspection forms and statutory order entries. */
export function inspectorDesignationForProfile(
  designation: string | undefined | null,
  inspectorLabel: string
): string {
  const base = statutoryDesignationForProfile(designation) || 'Mandal Agriculture Officer';
  return `${base} & ${inspectorLabel}`;
}

export interface OfficerInspectorPatch {
  officerName?: string;
  qualification?: string;
  manualQualification?: string;
  designation?: string;
  district?: string;
  manualDistrict?: string;
  mandal?: string;
  manualMandal?: string;
  manualDivision?: string;
  division?: string;
  customDivision?: string;
  officerPhone?: string;
  officerEmail?: string;
  officeAddress?: string;
}

const KNOWN_QUALIFICATIONS = new Set(QUALIFICATION_OPTIONS.map((o) => o.value));

function qualificationPatch(qualification: string | undefined): Pick<OfficerInspectorPatch, 'qualification' | 'manualQualification'> {
  const value = (qualification || '').trim();
  if (!value) return {};
  if (KNOWN_QUALIFICATIONS.has(value)) return { qualification: value };
  return { qualification: 'Others', manualQualification: value };
}

function locationPatch(profile: OfficerProfile): OfficerInspectorPatch {
  const patch: OfficerInspectorPatch = {};
  const district = normalizeTelanganaDistrict(profile.district || '');
  if (district) {
    patch.district = district;
  } else if ((profile.district || '').trim()) {
    patch.district = 'Others';
    patch.manualDistrict = profile.district.trim();
  }

  const isAda = statutoryDesignationForProfile(profile.designation) === 'Asst. Director of Agriculture';
  const mandal = (profile.mandal || '').trim();
  const division = (profile.division || '').trim();
  if (isAda) {
    // ADA officers work at division level — only the division is relevant.
    if (division) {
      patch.manualDivision = division;
      patch.division = division;
    }
    return patch;
  }
  if (mandal) {
    if (district) {
      const options = getMandalsForDistrict(district);
      const match = options.find((m) => m.toLowerCase() === mandal.toLowerCase());
      if (match) {
        patch.mandal = match;
      } else {
        patch.mandal = 'Others';
        patch.manualMandal = mandal;
      }
    } else {
      patch.mandal = 'Others';
      patch.manualMandal = mandal;
    }
  }

  // Resolve the officer's division against the district's division list so
  // module dropdowns receive a valid preset (or 'Others' + custom text).
  if (division) {
    const options = district ? getDivisionsForDistrict(district) : [];
    const match = options.find((d) => d.toLowerCase() === division.toLowerCase());
    if (match) {
      patch.division = match;
    } else {
      patch.division = 'Others';
      patch.customDivision = division;
    }
  }
  return patch;
}

/** Field patch for the statutory sampling form drafts (fertilizer/pesticide/seed share keys). */
export function buildOfficerInspectorPatch(profile: OfficerProfile | null | undefined): OfficerInspectorPatch {
  if (!profile) return {};
  const designation = statutoryDesignationForProfile(profile.designation);

  const patch: OfficerInspectorPatch = {
    officerName: (profile.full_name || '').trim(),
    ...qualificationPatch(profile.qualification),
    officerPhone: (profile.phone || '').trim(),
    officerEmail: (profile.email || '').trim(),
    officeAddress: officeSuggestion(profile),
  };
  if (designation) patch.designation = designation;
  Object.assign(patch, locationPatch(profile));
  return patch;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Merge patch into an object, only filling keys that are currently empty. */
export function fillEmptyFields<T extends Record<string, unknown>>(target: T, patch: Record<string, unknown>): T {
  const next = { ...target };
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') continue;
    if (isEmpty(next[key])) {
      (next as Record<string, unknown>)[key] = value;
      changed = true;
    }
  }
  return changed ? next : target;
}

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: Record<string, unknown>) {
  try {
    safeStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — autofill is best-effort
  }
}

// Statutory sampling form autosave drafts — officer detail fields are shared.
// `designations` limits the autofilled designation to values each form's
// dropdown actually offers.
const STATUTORY_DRAFT_KEYS = [
  {
    key: 'tiryani-fertilizer-forms-draft',
    designations: ['Mandal Agriculture Officer', 'Asst. Director of Agriculture', 'Asst. Director of Agriculture (T)', 'Fertilizer Inspector'],
  },
  {
    key: 'tiryani-pesticide-forms-draft',
    designations: ['Mandal Agriculture Officer', 'Asst. Director of Agriculture', 'Asst. Director of Agriculture (T)', 'Insecticide Inspector'],
  },
  {
    key: 'tiryani-seed-forms-draft',
    designations: ['Mandal Agriculture Officer', 'Asst. Director of Agriculture', 'Asst. Director of Agriculture (T)', 'District Agriculture Officer', 'Seed Inspector'],
  },
];

// Dealer inspection form autosave keys — inspector identity fields.
const INSPECTION_FORM_KEYS = [
  { key: 'tiryani-fertilizer-inspection-form', inspector: 'Fertilizer Inspector' },
  { key: 'tiryani-insecticide-inspection-form', inspector: 'Insecticide Inspector' },
  { key: 'tiryani-seed-inspection-form', inspector: 'Seed Inspector' },
];

// Covering letter metadata — division & officer phone prefill.
const COVERING_LETTER_DETAIL_KEYS = [
  'tiryani-covering-letter-details',
  'tiryani-pesticide-covering-letter-details',
  'tiryani-seed-covering-letter-details',
];

function officeSuggestion(profile: OfficerProfile): string {
  const designation = statutoryDesignationForProfile(profile.designation);
  const parts = [designation, profile.mandal ? `${profile.mandal} Mandal` : '', profile.district ? `${profile.district} District` : '']
    .filter(Boolean);
  return parts.length ? `O/o ${parts.join(', ')}` : '';
}

/**
 * Seeds officer profile details into the locally persisted form drafts so
 * every module (statutory sampling forms, dealer inspections, statutory
 * order entries via readStatutoryDetails) opens with the officer's details
 * prefilled. Only empty fields are filled — user edits are never overwritten.
 */
export function applyOfficerProfileDefaults(profile: OfficerProfile | null | undefined): void {
  if (!profile?.id) return;

  const patch = buildOfficerInspectorPatch(profile);
  const designation = statutoryDesignationForProfile(profile.designation);
  const isAda = designation === 'Asst. Director of Agriculture';

  // 1. Statutory sampling form drafts (fertilizer / pesticide / seed)
  for (const { key, designations } of STATUTORY_DRAFT_KEYS) {
    const saved = readJson(key);
    const base = saved ?? {};
    const { designation: _ignoredDesignation, ...patchWithoutDesignation } = patch;
    const next = fillEmptyFields(base, {
      ...patchWithoutDesignation,
      ...(patch.designation && designations.includes(patch.designation) ? { designation: patch.designation } : {}),
      // ADA officers use division entry rather than mandal
      ...(isAda ? { manualDivision: patch.manualDivision || patch.division } : {}),
    });
    // Division is profile-owned: keep it in sync with signup/settings updates
    // even when the draft already has a value.
    if (!isAda && patch.division) {
      const synced = { ...next, division: patch.division, customDivision: patch.customDivision || '' };
      writeJson(key, synced);
      continue;
    }
    if (next !== base) writeJson(key, next);
  }

  // 2. Dealer inspection current-form drafts (versioned { v, data } envelope)
  const office = officeSuggestion(profile);
  for (const { key, inspector } of INSPECTION_FORM_KEYS) {
    const saved = readJson(key);
    const envelope = saved && typeof saved.data === 'object' && saved.data !== null
      ? { v: typeof saved.v === 'number' ? saved.v : 1, data: { ...(saved.data as Record<string, unknown>) } }
      : { v: 1, data: {} as Record<string, unknown> };
    const nextData = fillEmptyFields(envelope.data, {
      inspectorName: patch.officerName,
      inspectorDesignation: inspectorDesignationForProfile(profile.designation, inspector),
      inspectorOffice: office,
    });
    if (nextData !== envelope.data) {
      writeJson(key, { ...envelope, data: nextData });
    }
  }

  // 3. Covering letter metadata (division + officer phone)
  const letterPatch: Record<string, string> = {};
  const letterDivision = patch.division === 'Others' ? (patch.customDivision || '') : (patch.division || '');
  if (letterDivision) letterPatch.division = letterDivision;
  if (patch.officerPhone) letterPatch.officerPhone = patch.officerPhone;
  if (patch.officerEmail) letterPatch.officerEmail = patch.officerEmail;
  for (const key of COVERING_LETTER_DETAIL_KEYS) {
    const saved = readJson(key) ?? {};
    const next = fillEmptyFields(saved, letterPatch);
    if (next !== saved) writeJson(key, next);
  }
}

