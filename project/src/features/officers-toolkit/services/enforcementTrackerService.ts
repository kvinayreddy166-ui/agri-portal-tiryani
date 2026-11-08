import { supabase } from '../../../shared/lib/supabase';
import { safeStorage } from '../../../shared/lib/safeStorage';
import { OFFICER_LOCAL_STORAGE_KEYS, OfficerCloudSyncService } from './officerCloudSyncService';
import type {
  StatutoryCommodity,
  StatutoryOrderType,
  LabStatus,
  OfficerStatutoryOrderDbRecord,
  OfficerInspectionDbRecord,
  OfficerSampleDbRecord,
} from '../../auth/types/officerAuth';

export type CaseStage = 'INSPECTION' | 'SAMPLING' | 'LAB_TEST' | 'SHOW_CAUSE' | 'ENFORCEMENT' | 'CLOSED';
export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type ReplyStatus = 'PENDING' | 'REPLIED' | 'NO_REPLY' | 'EXPIRED' | 'WAIVED';

export interface OfficerCase {
  id: string;
  case_number: string;
  dealer_name: string;
  license_number?: string;
  commodity: StatutoryCommodity;
  stage: CaseStage;
  priority: CasePriority;
  opened_date: string;
  target_close_date?: string;
  linked_record_ids: string[];
  notes?: string;
  created_at?: string;
}

export interface OrderRow extends OfficerStatutoryOrderDbRecord {
  id: string;
  reply_deadline?: string | null;
  reply_status?: ReplyStatus;
  _local?: boolean;
}

export interface SampleRow extends OfficerSampleDbRecord {
  id: string;
  dispatched_at?: string | null;
  report_received_at?: string | null;
  lab_report_ref?: string | null;
}

export interface InspectionRow extends OfficerInspectionDbRecord {
  id: string;
}

export interface EnforcementData {
  cases: OfficerCase[];
  orders: OrderRow[];
  inspections: InspectionRow[];
  samples: SampleRow[];
}

export interface DealerScorecard {
  dealerName: string;
  commodity: StatutoryCommodity | 'mixed';
  inspections: number;
  orders: number;
  showCause: number;
  stopSale: number;
  seizures: number;
  samplesFailed: number;
  samplesTotal: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastActivity: string;
}

export interface CaseSuggestion {
  dealerName: string;
  commodity: StatutoryCommodity;
  recordCount: number;
  latestDate: string;
  hasSample: boolean;
  hasOrder: boolean;
}

export interface SamplePipelineItem {
  id: string;
  sampleCode: string;
  dealerName: string;
  commodity: StatutoryCommodity;
  labStatus: LabStatus;
  sampledDate: string;
  dispatchedAt?: string | null;
  reportReceivedAt?: string | null;
  daysInStage: number;
  labReportRef?: string | null;
  failureFinding?: string | null;
}

export function getStatutoryNonComplianceInfo(commodity: StatutoryCommodity) {
  switch (commodity) {
    case 'pesticide':
      return {
        label: 'Misbranded',
        shortLabel: 'Misbranded',
        telugu: 'మిస్‌బ్రాండెడ్',
        buttonText: 'Mark Misbranded',
        buttonTelugu: 'మిస్‌బ్రాండెడ్‌గా గుర్తించండి',
        description: 'Insecticides Act, 1968 (Sec 3(k) / 24) — Product does not conform to registered active ingredient or chemical specifications.',
        actRef: 'Insecticides Act, 1968 · Sec 3(k) & 24',
        badgeCls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
        buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
      };
    case 'fertilizer':
      return {
        label: 'Not according to Specifications',
        shortLabel: 'Not to Spec',
        telugu: 'స్పెసిఫికేషన్ల ప్రకారం లేదు',
        buttonText: 'Mark Not to Spec',
        buttonTelugu: 'స్పెసిఫికేషన్ల ప్రకారం లేదుగా గుర్తించండి',
        description: 'Fertiliser (Control) Order, 1985 (Clause 19 / Sch I) — Sample fails to satisfy prescribed statutory nutrient specifications.',
        actRef: 'FCO, 1985 · Clause 19 & Schedule I',
        badgeCls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        buttonCls: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
      };
    case 'seed':
      return {
        label: 'Substandard',
        shortLabel: 'Substandard',
        telugu: 'సబ్‌స్టాండర్డ్ (నాసిరకం)',
        buttonText: 'Mark Substandard',
        buttonTelugu: 'సబ్‌స్టాండర్డ్‌గా గుర్తించండి',
        description: 'Seeds Act, 1966 (Sec 6 / 15) — Germination percentage, physical purity or genetic quality below notified minimum standards.',
        actRef: 'Seeds Act, 1966 · Sec 6 & 15',
        badgeCls: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
        buttonCls: 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs',
      };
    default:
      return {
        label: 'Non-Standard',
        shortLabel: 'Non-Standard',
        telugu: 'నాన్-స్టాండర్డ్',
        buttonText: 'Mark Non-Standard',
        buttonTelugu: 'నాన్-స్టాండర్డ్‌గా గుర్తించండి',
        description: 'Sample does not conform to prescribed statutory quality standards.',
        actRef: 'Statutory Control Act',
        badgeCls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
        buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
      };
  }
}

const CASE_STAGES: CaseStage[] = ['INSPECTION', 'SAMPLING', 'LAB_TEST', 'SHOW_CAUSE', 'ENFORCEMENT', 'CLOSED'];

function daysBetween(fromIso: string, toIso: string = new Date().toISOString()): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.floor((to - from) / 86400000));
}

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86400000);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Exported for dealer-profile aggregation (Enforcement Tracker 360 view). */
export function normalizeDealerName(name: string): string {
  return normalizeName(name);
}

async function getOfficerId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export class EnforcementTrackerService {
  static async fetchAll(): Promise<EnforcementData> {
    const [casesRes, ordersRes, inspRes, samplesRes] = await Promise.all([
      supabase.from('officer_cases').select('*').order('opened_date', { ascending: false }),
      supabase.from('officer_statutory_orders').select('*').order('order_date', { ascending: false }),
      supabase.from('officer_inspections').select('*').order('inspection_date', { ascending: false }),
      supabase.from('officer_samples').select('*').order('date_of_sampling', { ascending: false }),
    ]);

    const cloudOrders = (ordersRes.data ?? []) as OrderRow[];
    const cloudOrderNumbers = new Set(cloudOrders.map((o) => o.order_number).filter(Boolean));
    const localOrders = this.fetchLocalOrders(cloudOrderNumbers);

    const cloudSamples = (samplesRes.data ?? []) as SampleRow[];
    const cloudSampleCodes = new Set(
      cloudSamples.map((s) => String(s.sample_code || '').toLowerCase()).filter(Boolean)
    );
    const localSamples = this.fetchLocalSamples(cloudSampleCodes);

    return {
      cases: (casesRes.data ?? []) as OfficerCase[],
      orders: [...cloudOrders, ...localOrders],
      inspections: (inspRes.data ?? []) as InspectionRow[],
      samples: [...cloudSamples, ...localSamples],
    };
  }

  /**
   * Reads local covering-letter sample queues so samples created offline or
   * before cloud sync still appear in the tracker. Deduped against cloud rows
   * by sample code.
   */
  private static fetchLocalSamples(cloudSampleCodes: Set<string>): SampleRow[] {
    const rows: SampleRow[] = [];
    const detailsKeys: Record<string, string> = {
      fertilizer: 'tiryani-covering-letter-details',
      pesticide: 'tiryani-pesticide-covering-letter-details',
      seed: 'tiryani-seed-covering-letter-details',
    };

    const dealerNameFor = (storageKey: string): string => {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) return '';
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const dealer = (parsed.dealerDetails ?? parsed.dealer ?? parsed) as Record<string, unknown>;
        return String(dealer.dealerName || dealer.firmName || '');
      } catch {
        return '';
      }
    };

    for (const [keyName, storageKey] of Object.entries(OFFICER_LOCAL_STORAGE_KEYS.SAMPLES)) {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) continue;
        const items = JSON.parse(raw) as unknown;
        if (!Array.isArray(items)) continue;

        const commodity = keyName as StatutoryCommodity;
        const dealerName = dealerNameFor(detailsKeys[keyName] || '');

        items.forEach((item, idx) => {
          if (!item || typeof item !== 'object') return;
          const rec = item as Record<string, unknown>;
          const sampleCode = String(rec.sampleCode || rec.codeNumber || rec.codeNo || '').trim();
          if (!sampleCode) return;
          if (cloudSampleCodes.has(sampleCode.toLowerCase())) return;

          rows.push({
            id: `local-${keyName}:${idx}`,
            officer_id: '',
            commodity,
            sample_code: sampleCode,
            firm_name: String(rec.dealerName || rec.firmName || dealerName || 'Local sample'),
            date_of_sampling: String(
              rec.dateOfSampling || rec.samplingDate || rec.date || new Date().toISOString().slice(0, 10)
            ),
            batch_no: rec.batchNo ? String(rec.batchNo) : undefined,
            covering_letter_json: rec,
            lab_status: (rec.labStatus as LabStatus) || 'DRAFT',
            dispatched_at: rec.dispatchedAt ? String(rec.dispatchedAt) : null,
            report_received_at: rec.reportReceivedAt ? String(rec.reportReceivedAt) : null,
            lab_report_ref: rec.labReportRef ? String(rec.labReportRef) : null,
          });
        });
      } catch {
        // skip malformed local payloads
      }
    }
    return rows;
  }

  /** Reads legacy local-storage order records so pre-cloud data still appears in the tracker. */
  private static fetchLocalOrders(cloudOrderNumbers: Set<string>): OrderRow[] {
    const rows: OrderRow[] = [];
    for (const [keyName, storageKey] of Object.entries(OFFICER_LOCAL_STORAGE_KEYS.ORDERS)) {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) continue;
        const items = JSON.parse(raw) as unknown;
        if (!Array.isArray(items)) continue;

        const orderType: StatutoryOrderType = keyName.includes('stop_sale')
          ? 'stop_sale'
          : keyName.includes('seizure')
            ? 'seizure'
            : keyName.includes('revocation')
              ? 'revocation'
              : 'show_cause';
        const keyCommodity: StatutoryCommodity = keyName.includes('seed')
          ? 'seed'
          : keyName.includes('pesticide')
            ? 'pesticide'
            : 'fertilizer';

        items.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          const rec = item as Record<string, unknown>;
          const orderNumber = String(rec.orderNumber || rec.noticeNumber || rec.memoNumber || '');
          if (!orderNumber || cloudOrderNumbers.has(orderNumber)) return;

          const rawCategory = String(rec.category || '').toLowerCase();
          const commodity: StatutoryCommodity =
            orderType === 'show_cause' && ['seed', 'pesticide', 'fertilizer', 'fertiliser'].includes(rawCategory)
              ? rawCategory === 'fertiliser' ? 'fertilizer' : (rawCategory as StatutoryCommodity)
              : keyCommodity;

          const orderDate = String(
            rec.noticeDate || rec.orderDate || rec.inspectionDate ||
            (typeof rec.savedAt === 'string' ? rec.savedAt.slice(0, 10) : '') || ''
          );

          rows.push({
            id: `local-${storageKey}-${orderNumber}`,
            officer_id: '',
            order_type: orderType,
            commodity,
            order_number: orderNumber,
            order_date: orderDate,
            firm_name: String(rec.dealerName || rec.firmName || rec.dealer || 'Unknown dealer'),
            mandal: typeof rec.mandal === 'string' ? rec.mandal : undefined,
            district: typeof rec.district === 'string' ? rec.district : undefined,
            payload_json: rec,
            reply_deadline: null,
            reply_status: 'PENDING',
            _local: true,
          });
        });
      } catch {
        // skip malformed local payloads
      }
    }
    return rows;
  }

  // ---------- Feature 1: Case Management ----------

  static async createCase(input: {
    dealerName: string;
    licenseNumber?: string;
    commodity: StatutoryCommodity;
    stage?: CaseStage;
    priority?: CasePriority;
    openedDate?: string;
    targetCloseDate?: string;
    linkedRecordIds?: string[];
    notes?: string;
  }): Promise<{ success: boolean; error?: string; id?: string }> {
    const officerId = await getOfficerId();
    if (!officerId) return { success: false, error: 'Not authenticated' };

    const caseNumber = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const { data, error } = await supabase
      .from('officer_cases')
      .insert({
        officer_id: officerId,
        case_number: caseNumber,
        dealer_name: input.dealerName,
        license_number: input.licenseNumber || null,
        commodity: input.commodity,
        stage: input.stage ?? 'INSPECTION',
        priority: input.priority ?? 'NORMAL',
        opened_date: input.openedDate ?? new Date().toISOString().slice(0, 10),
        target_close_date: input.targetCloseDate || null,
        linked_record_ids: input.linkedRecordIds ?? [],
        notes: input.notes || null,
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  }

  static async updateCaseStage(caseId: string, stage: CaseStage): Promise<boolean> {
    const { error } = await supabase
      .from('officer_cases')
      .update({ stage })
      .eq('id', caseId);
    return !error;
  }

  static async deleteCase(caseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('officer_cases')
      .delete()
      .eq('id', caseId);
    return !error;
  }

  static async updateCasePriority(caseId: string, priority: CasePriority): Promise<boolean> {
    const { error } = await supabase
      .from('officer_cases')
      .update({ priority })
      .eq('id', caseId);
    return !error;
  }

  static async addCaseNote(caseId: string, note: string): Promise<boolean> {
    const { data } = await supabase.from('officer_cases').select('notes').eq('id', caseId).single();
    const existing = (data?.notes as string) || '';
    const stamped = `[${new Date().toISOString().slice(0, 10)}] ${note}`;
    const merged = existing ? `${existing}\n${stamped}` : stamped;
    const { error } = await supabase.from('officer_cases').update({ notes: merged }).eq('id', caseId);
    return !error;
  }

  static buildCaseSuggestions(data: EnforcementData): CaseSuggestion[] {
    const caseDealerKeys = new Set(
      data.cases
        .filter((c) => c.stage !== 'CLOSED')
        .map((c) => `${normalizeName(c.dealer_name)}|${c.commodity}`)
    );

    const groups = new Map<string, CaseSuggestion & { recordIds: Set<string> }>();
    const add = (dealer: string, commodity: StatutoryCommodity, recordId: string, date: string) => {
      const key = `${normalizeName(dealer)}|${commodity}`;
      if (caseDealerKeys.has(key)) return;
      const g = groups.get(key) ?? {
        dealerName: dealer,
        commodity,
        recordCount: 0,
        latestDate: date,
        hasSample: false,
        hasOrder: false,
        recordIds: new Set<string>(),
      };
      g.recordCount += 1;
      g.recordIds.add(recordId);
      if (date > g.latestDate) g.latestDate = date;
      groups.set(key, g);
    };

    data.inspections.forEach((i) => add(i.firm_name, i.inspection_type, i.id, i.inspection_date));
    data.samples.forEach((s) => {
      add(s.firm_name, s.commodity, s.id, s.date_of_sampling);
      const key = `${normalizeName(s.firm_name)}|${s.commodity}`;
      const g = groups.get(key);
      if (g) g.hasSample = true;
    });
    data.orders.forEach((o) => {
      add(o.firm_name, o.commodity, o.id, o.order_date);
      const key = `${normalizeName(o.firm_name)}|${o.commodity}`;
      const g = groups.get(key);
      if (g) g.hasOrder = true;
    });

    return [...groups.values()]
      .map(({ recordIds: _recordIds, ...rest }) => rest)
      .filter((g) => g.recordCount >= 2 || g.hasSample || g.hasOrder)
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }

  // ---------- Feature 2: Notice Deadline Tracker ----------

  static buildDeadlineItems(orders: OrderRow[]): { order: OrderRow; daysLeft: number | null; status: 'URGENT' | 'DUE_SOON' | 'OK' | 'CLOSED' | 'UNSET' }[] {
    type DeadlineStatus = 'URGENT' | 'DUE_SOON' | 'OK' | 'CLOSED' | 'UNSET';
    return orders
      .filter((o) => o.order_type === 'show_cause')
      .map((order): { order: OrderRow; daysLeft: number | null; status: DeadlineStatus } => {
        const replyStatus = order.reply_status ?? 'PENDING';
        if (replyStatus !== 'PENDING' || !order.reply_deadline) {
          return { order, daysLeft: null, status: replyStatus === 'PENDING' ? 'UNSET' : 'CLOSED' };
        }
        const daysLeft = daysUntil(order.reply_deadline);
        const status: DeadlineStatus = daysLeft < 0 ? 'CLOSED' : daysLeft <= 3 ? 'URGENT' : daysLeft <= 7 ? 'DUE_SOON' : 'OK';
        return { order, daysLeft, status };
      })
      .sort((a, b) => {
        const ad = a.daysLeft ?? 9999;
        const bd = b.daysLeft ?? 9999;
        return ad - bd;
      });
  }

  static async setReplyDeadline(orderId: string, deadline: string | null, status: ReplyStatus = 'PENDING'): Promise<boolean> {
    const { error } = await supabase
      .from('officer_statutory_orders')
      .update({ reply_deadline: deadline, reply_status: status })
      .eq('id', orderId);
    return !error;
  }

  /**
   * Sets reply deadline/status on an order. Local-only records are first pushed
   * to the officer's cloud account, then the cloud row is updated — so legacy
   * records become claimable without losing the deadline tracking.
   */
  static async updateOrderReply(order: OrderRow, deadline: string | null, status: ReplyStatus = 'PENDING'): Promise<boolean> {
    if (!order._local) {
      return this.setReplyDeadline(order.id, deadline, status);
    }
    const synced = await OfficerCloudSyncService.syncStatutoryOrder(
      order.order_type,
      order.commodity,
      order.payload_json
    );
    if (!synced) return false;

    const officerId = await getOfficerId();
    if (!officerId) return false;
    const { data } = await supabase
      .from('officer_statutory_orders')
      .select('id')
      .eq('officer_id', officerId)
      .eq('order_number', order.order_number)
      .eq('order_type', order.order_type)
      .eq('commodity', order.commodity)
      .maybeSingle();
    if (!data?.id) return false;
    return this.setReplyDeadline(data.id, deadline, status);
  }

  // ---------- Feature 3: Dealer Compliance Scorecard ----------

  static buildDealerScorecards(data: EnforcementData): DealerScorecard[] {
    const map = new Map<string, DealerScorecard & { _commSet: Set<StatutoryCommodity> }>();

    const bucket = (name: string) => {
      const key = normalizeName(name);
      let entry = map.get(key);
      if (!entry) {
        entry = {
          dealerName: name.trim(),
          commodity: 'mixed',
          inspections: 0,
          orders: 0,
          showCause: 0,
          stopSale: 0,
          seizures: 0,
          samplesFailed: 0,
          samplesTotal: 0,
          riskScore: 0,
          riskLevel: 'LOW',
          lastActivity: '',
          _commSet: new Set<StatutoryCommodity>(),
        };
        map.set(key, entry);
      }
      return entry;
    };

    const touch = (entry: DealerScorecard & { _commSet: Set<StatutoryCommodity> }, commodity: StatutoryCommodity, date: string) => {
      entry._commSet.add(commodity);
      if (date > entry.lastActivity) entry.lastActivity = date;
    };

    data.inspections.forEach((i) => {
      const e = bucket(i.firm_name);
      e.inspections += 1;
      touch(e, i.inspection_type, i.inspection_date);
    });
    data.orders.forEach((o) => {
      const e = bucket(o.firm_name);
      e.orders += 1;
      if (o.order_type === 'show_cause') e.showCause += 1;
      if (o.order_type === 'stop_sale' || o.order_type === 'revocation') e.stopSale += 1;
      if (o.order_type === 'seizure') e.seizures += 1;
      touch(e, o.commodity, o.order_date);
    });
    data.samples.forEach((s) => {
      const e = bucket(s.firm_name);
      e.samplesTotal += 1;
      if (s.lab_status === 'TEST_FAILED') e.samplesFailed += 1;
      touch(e, s.commodity, s.date_of_sampling);
    });

    return [...map.values()]
      .map((e) => {
        const firstComm = [...e._commSet][0];
        const commodity: StatutoryCommodity | 'mixed' = e._commSet.size === 1 && firstComm ? firstComm : 'mixed';
        // Weighted risk: seizures > failed samples > stop sale > show cause > inspections
        const riskScore =
          e.seizures * 25 +
          e.samplesFailed * 15 +
          e.stopSale * 10 +
          e.showCause * 6 +
          e.inspections * 1;
        const riskLevel: DealerScorecard['riskLevel'] =
          riskScore >= 60 ? 'CRITICAL' : riskScore >= 30 ? 'HIGH' : riskScore >= 10 ? 'MEDIUM' : 'LOW';
        const { _commSet: _ignored, ...rest } = e;
        return { ...rest, commodity, riskScore, riskLevel };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  // ---------- Feature 4: Sample Lifecycle Tracker ----------

  static buildSamplePipeline(samples: SampleRow[]): SamplePipelineItem[] {
    const stageAnchor = (s: SampleRow): string => {
      switch (s.lab_status) {
        case 'DRAFT': return s.date_of_sampling;
        case 'DISPATCHED': return s.dispatched_at ?? s.date_of_sampling;
        case 'RECEIVED_LAB': return s.dispatched_at ?? s.date_of_sampling;
        case 'TEST_PASSED':
        case 'TEST_FAILED': return s.report_received_at ?? s.dispatched_at ?? s.date_of_sampling;
        default: return s.date_of_sampling;
      }
    };

    return samples.map((s) => {
      let failureFinding: string | null = null;
      if (s.lab_status === 'TEST_FAILED') {
        const json = (s.covering_letter_json || {}) as Record<string, unknown>;
        if (typeof json.failureFinding === 'string' && json.failureFinding) {
          failureFinding = json.failureFinding;
        } else if (s.lab_report_ref && (s.lab_report_ref.includes('Misbranded') || s.lab_report_ref.includes('Specifications') || s.lab_report_ref.includes('Substandard'))) {
          failureFinding = s.lab_report_ref;
        } else {
          failureFinding = s.commodity === 'pesticide' ? 'Misbranded' : s.commodity === 'fertilizer' ? 'Not according to Specifications' : 'Substandard';
        }
      }
      return {
        id: s.id,
        sampleCode: s.sample_code,
        dealerName: s.firm_name,
        commodity: s.commodity,
        labStatus: s.lab_status,
        sampledDate: s.date_of_sampling,
        dispatchedAt: s.dispatched_at,
        reportReceivedAt: s.report_received_at,
        daysInStage: daysBetween(stageAnchor(s)),
        labReportRef: s.lab_report_ref,
        failureFinding,
      };
    });
  }

  static async updateSampleLab(
    sampleId: string,
    updates: {
      labStatus?: LabStatus;
      dispatchedAt?: string | null;
      reportReceivedAt?: string | null;
      labReportRef?: string | null;
      failureFinding?: string | null;
    }
  ): Promise<boolean> {
    // Local queue samples (id format: local-<commodity>:<index>) persist
    // status updates back into the covering-letter queue in safeStorage.
    if (sampleId.startsWith('local-')) {
      const match = sampleId.match(/^local-([a-z_]+):(\d+)$/);
      if (!match) return false;
      const [, keyName, idxStr] = match;
      const storageKey =
        OFFICER_LOCAL_STORAGE_KEYS.SAMPLES[keyName as keyof typeof OFFICER_LOCAL_STORAGE_KEYS.SAMPLES];
      if (!storageKey) return false;
      try {
        const raw = safeStorage.getItem(storageKey);
        const items = raw ? (JSON.parse(raw) as unknown[]) : [];
        const idx = Number(idxStr);
        if (!Array.isArray(items) || !items[idx] || typeof items[idx] !== 'object') return false;
        const rec = items[idx] as Record<string, unknown>;
        if (updates.labStatus) rec.labStatus = updates.labStatus;
        if (updates.dispatchedAt !== undefined) rec.dispatchedAt = updates.dispatchedAt;
        if (updates.reportReceivedAt !== undefined) rec.reportReceivedAt = updates.reportReceivedAt;
        if (updates.labReportRef !== undefined) rec.labReportRef = updates.labReportRef;
        if (updates.failureFinding) rec.failureFinding = updates.failureFinding;
        safeStorage.setItem(storageKey, JSON.stringify(items));
        return true;
      } catch {
        return false;
      }
    }

    const payload: Record<string, unknown> = {};
    if (updates.labStatus) payload.lab_status = updates.labStatus;
    if (updates.dispatchedAt !== undefined) payload.dispatched_at = updates.dispatchedAt;
    if (updates.reportReceivedAt !== undefined) payload.report_received_at = updates.reportReceivedAt;
    if (updates.labReportRef !== undefined) payload.lab_report_ref = updates.labReportRef;

    if (updates.failureFinding) {
      try {
        const { data: cur } = await supabase.from('officer_samples').select('covering_letter_json').eq('id', sampleId).maybeSingle();
        const currentJson = (cur?.covering_letter_json && typeof cur.covering_letter_json === 'object' ? cur.covering_letter_json : {}) as Record<string, unknown>;
        payload.covering_letter_json = {
          ...currentJson,
          failureFinding: updates.failureFinding,
          reportReceivedAt: updates.reportReceivedAt,
          labReportRef: updates.labReportRef,
        };
      } catch {
        // ignore
      }
    }

    const { error } = await supabase.from('officer_samples').update(payload).eq('id', sampleId);
    return !error;
  }

  static async deleteSample(sampleId: string): Promise<boolean> {
    // Local queue samples (id format: local-<commodity>:<index>) are removed
    // from the covering-letter queue in safeStorage.
    if (sampleId.startsWith('local-')) {
      const match = sampleId.match(/^local-([a-z_]+):(\d+)$/);
      if (!match) return false;
      const storageKey =
        OFFICER_LOCAL_STORAGE_KEYS.SAMPLES[match[1] as keyof typeof OFFICER_LOCAL_STORAGE_KEYS.SAMPLES];
      if (!storageKey) return false;
      try {
        const raw = safeStorage.getItem(storageKey);
        const items = raw ? (JSON.parse(raw) as unknown[]) : [];
        const idx = Number(match[2]);
        if (!Array.isArray(items) || idx < 0 || idx >= items.length) return false;
        items.splice(idx, 1);
        safeStorage.setItem(storageKey, JSON.stringify(items));
        return true;
      } catch {
        return false;
      }
    }

    const { error } = await supabase.from('officer_samples').delete().eq('id', sampleId);
    return !error;
  }

  static caseStageIndex(stage: CaseStage): number {
    return CASE_STAGES.indexOf(stage);
  }

  static readonly CASE_STAGES = CASE_STAGES;
}
