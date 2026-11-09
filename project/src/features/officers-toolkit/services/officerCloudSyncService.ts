import { supabase } from '../../../shared/lib/supabase';
import { safeStorage } from '../../../shared/lib/safeStorage';
import type {
  StatutoryOrderType,
  StatutoryCommodity,
  OfficerStatutoryOrderDbRecord,
  OfficerInspectionDbRecord,
  OfficerSampleDbRecord,
} from '../../auth/types/officerAuth';

export interface SyncResult {
  success: boolean;
  syncedToCloud: boolean;
  error?: string;
  id?: string;
}

export interface UnifiedOfficerRecord {
  id: string;
  source: 'cloud' | 'local';
  category: 'order' | 'inspection' | 'sample';
  subType: string;
  commodity: StatutoryCommodity;
  title: string;
  referenceNumber: string;
  entityName: string;
  recordDate: string;
  location: string;
  details: Record<string, unknown>;
  synced: boolean;
  createdAt: string;
}

export const OFFICER_LOCAL_STORAGE_KEYS = {
  ORDERS: {
    fertilizer_stop_sale: 'agri-legal-fertilizer-stop-sale-orders',
    pesticide_stop_sale: 'agri-legal-pesticide-stop-sale-orders',
    seed_stop_sale: 'agri-legal-seed-stop-sale-orders',
    fertilizer_seizure: 'agri-legal-fertilizer-seizure-orders',
    pesticide_seizure: 'agri-legal-pesticide-seizure-orders',
    seed_seizure: 'agri-legal-seed-seizure-orders',
    fertilizer_revocation: 'agri-legal-fertilizer-stop-sale-revoke-orders',
    pesticide_revocation: 'agri-legal-pesticide-stop-sale-revoke-orders',
    seed_revocation: 'agri-legal-seed-stop-sale-revoke-orders',
    show_cause: 'agri-legal-show-cause-notices',
  },
  INSPECTIONS: {
    fertilizer: 'tiryani-fertilizer-inspection-drafts',
    pesticide: 'tiryani-insecticide-inspection-drafts',
    seed: 'tiryani-seed-inspection-drafts',
  },
  SAMPLES: {
    fertilizer: 'tiryani-covering-letter-queue',
    pesticide: 'tiryani-pesticide-covering-letter-queue',
    seed: 'tiryani-seed-covering-letter-queue',
  },
};

export class OfficerCloudSyncService {
  /**
   * Helper to check current authenticated session user id
   */
  private static async getCurrentOfficerId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Saves or updates a statutory order both locally and to Supabase
   */
  static async syncStatutoryOrder(
    orderType: StatutoryOrderType,
    commodity: StatutoryCommodity,
    data: Record<string, unknown>,
    overrides?: { orderNumber?: string; orderDate?: string }
  ): Promise<SyncResult> {
    const officerId = await this.getCurrentOfficerId();
    const id = (data.id as string) || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = overrides?.orderNumber ?? String(data.orderNumber || data.noticeNumber || data.memoNumber || data.refNumber || id);
    const orderDate = overrides?.orderDate ?? String(data.noticeDate || data.orderDate || data.seizureDate || data.revokeDate || new Date().toISOString().slice(0, 10));
    const firmName = String(data.firmName || 'Unknown Dealer');
    const mandal = String(data.mandal || data.manualMandal || '');
    const district = String(data.district || data.manualDistrict || '');

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. If online & authenticated, persist to Supabase
    let syncedToCloud = false;
    let cloudError: string | undefined;

    if (officerId && isOnline) {
      try {
        const payload: OfficerStatutoryOrderDbRecord = {
          officer_id: officerId,
          order_type: orderType,
          commodity,
          order_number: orderNumber,
          order_date: orderDate,
          firm_name: firmName,
          mandal,
          district,
          payload_json: { ...data, id },
        };

        const { error } = await supabase
          .from('officer_statutory_orders')
          .upsert(payload, { onConflict: 'officer_id,order_number' });

        if (!error) {
          syncedToCloud = true;
          const { stage, priority } = this.orderCaseStage(orderType);
          await this.ensureEnforcementCase({
            officerId,
            dealerName: firmName,
            commodity,
            stage,
            priority,
            recordRef: orderNumber,
            recordDate: orderDate,
            recordKind: orderType,
          });
        } else {
          cloudError = error.message;
        }
      } catch (err) {
        cloudError = (err as Error).message;
      }
    }

    return {
      success: true,
      syncedToCloud,
      error: cloudError,
      id,
    };
  }

  /**
   * Saves or updates a dealer inspection
   */
  static async syncInspection(
    commodity: StatutoryCommodity,
    data: Record<string, unknown>
  ): Promise<SyncResult> {
    const officerId = await this.getCurrentOfficerId();
    const id = (data.id as string) || `insp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // DraftRecord payloads nest the form under `form` — resolve dealer fields
    // from either the top level or the nested form object.
    const nested = (data.form && typeof data.form === 'object' ? data.form : {}) as Record<string, unknown>;
    const firmName = String(data.firmName || data.dealerName || nested.dealerName || nested.firmName || 'Dealer Inspection');
    const licenseNumber = String(data.licenseNumber || data.licenseNo || data.licenceNo || nested.licenseNumber || nested.licenceNo || '');
    const inspectionDate = String(data.inspectionDate || data.date || nested.inspectionDate || new Date().toISOString().slice(0, 10));

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let syncedToCloud = false;
    let cloudError: string | undefined;

    if (officerId && isOnline) {
      try {
        // Dedupe by (officer_id, findings_json->>'id'): drafts carry a stable
        // id, so re-saving the same draft updates the existing row instead of
        // inserting duplicates on every save.
        const { data: existing } = await supabase
          .from('officer_inspections')
          .select('id, findings_json')
          .eq('officer_id', officerId)
          .filter('findings_json->>id', 'eq', id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const mergedJson = {
            ...((existing.findings_json && typeof existing.findings_json === 'object'
              ? existing.findings_json
              : {}) as Record<string, unknown>),
            ...data,
            id,
          };
          const { error } = await supabase
            .from('officer_inspections')
            .update({
              firm_name: firmName,
              license_number: licenseNumber,
              inspection_date: inspectionDate,
              findings_json: mergedJson,
            })
            .eq('id', existing.id);

          if (!error) {
            syncedToCloud = true;
            await this.ensureEnforcementCase({
              officerId,
              dealerName: firmName,
              commodity,
              stage: 'INSPECTION',
              recordRef: String(data.inspectionId || data.id || id),
              recordDate: inspectionDate,
              recordKind: 'inspection',
            });
          } else {
            cloudError = error.message;
          }
        } else {
          const payload: OfficerInspectionDbRecord = {
            officer_id: officerId,
            inspection_type: commodity,
            firm_name: firmName,
            license_number: licenseNumber,
            inspection_date: inspectionDate,
            findings_json: { ...data, id },
          };

          const { error } = await supabase
            .from('officer_inspections')
            .insert(payload);

          if (!error) {
            syncedToCloud = true;
            await this.ensureEnforcementCase({
              officerId,
              dealerName: firmName,
              commodity,
              stage: 'INSPECTION',
              recordRef: String(data.inspectionId || data.id || id),
              recordDate: inspectionDate,
              recordKind: 'inspection',
            });
          } else {
            cloudError = error.message;
          }
        }
      } catch (err) {
        cloudError = (err as Error).message;
      }
    }

    return {
      success: true,
      syncedToCloud,
      error: cloudError,
      id,
    };
  }

  /**
   * Saves or updates a sample memo
   */
  static async syncSampleMemo(
    commodity: StatutoryCommodity,
    data: Record<string, unknown>
  ): Promise<SyncResult> {
    const officerId = await this.getCurrentOfficerId();
    const id = (data.id as string) || `smp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sampleCode = String(data.sampleCode || data.codeNumber || id);
    const firmName = String(data.firmName || data.dealerName || 'Sample Source');
    const dateOfSampling = String(data.dateOfSampling || data.samplingDate || new Date().toISOString().slice(0, 10));
    const batchNo = String(data.batchNo || data.batchNumber || '');
    const labStatus = (data.labStatus as OfficerSampleDbRecord['lab_status']) || 'DISPATCHED';

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let syncedToCloud = false;
    let cloudError: string | undefined;

    if (officerId && isOnline) {
      try {
        // Dedupe by (officer_id, commodity, sample_code): re-downloading or
        // re-previewing the same sample updates the existing row instead of
        // creating duplicates. lab_status is preserved unless explicitly set,
        // and covering_letter_json is merged so tracker fields survive.
        const { data: existing } = await supabase
          .from('officer_samples')
          .select('id, lab_status, covering_letter_json')
          .eq('officer_id', officerId)
          .eq('commodity', commodity)
          .eq('sample_code', sampleCode)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const mergedJson = {
            ...((existing.covering_letter_json && typeof existing.covering_letter_json === 'object'
              ? existing.covering_letter_json
              : {}) as Record<string, unknown>),
            ...data,
            id: existing.id,
          };
          const updatePayload: Record<string, unknown> = {
            firm_name: firmName,
            date_of_sampling: dateOfSampling,
            batch_no: batchNo,
            covering_letter_json: mergedJson,
          };
          if (data.labStatus) updatePayload.lab_status = labStatus;

          const { error } = await supabase
            .from('officer_samples')
            .update(updatePayload)
            .eq('id', existing.id);

          if (!error) {
            syncedToCloud = true;
            await this.ensureSampleCase(officerId, commodity, firmName, sampleCode, dateOfSampling, labStatus);
            return { success: true, syncedToCloud, id: existing.id };
          }
          cloudError = error.message;
        } else {
          const payload: OfficerSampleDbRecord = {
            officer_id: officerId,
            commodity,
            sample_code: sampleCode,
            firm_name: firmName,
            date_of_sampling: dateOfSampling,
            batch_no: batchNo,
            covering_letter_json: { ...data, id },
            lab_status: labStatus,
          };

          const { error } = await supabase
            .from('officer_samples')
            .insert(payload);

          if (!error) {
            syncedToCloud = true;
            await this.ensureSampleCase(officerId, commodity, firmName, sampleCode, dateOfSampling, labStatus);
          } else {
            cloudError = error.message;
          }
        }
      } catch (err) {
        cloudError = (err as Error).message;
      }
    }

    return {
      success: true,
      syncedToCloud,
      error: cloudError,
      id,
    };
  }

  /**
   * Fetches all records from both Supabase and safeStorage for a comprehensive view
   */
  static async fetchAllOfficerRecords(): Promise<UnifiedOfficerRecord[]> {
    const records: UnifiedOfficerRecord[] = [];
    const officerId = await this.getCurrentOfficerId();

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const cloudInspectionDraftIds = new Set<string>();
    const cloudOrderRefs = new Set<string>();
    const cloudSampleCodes = new Set<string>();

    // 1. Read Cloud Records if online
    if (officerId && isOnline) {
      try {
        const [ordersRes, inspRes, samplesRes] = await Promise.all([
          supabase.from('officer_statutory_orders').select('*').order('order_date', { ascending: false }),
          supabase.from('officer_inspections').select('*').order('inspection_date', { ascending: false }),
          supabase.from('officer_samples').select('*').order('date_of_sampling', { ascending: false }),
        ]);

        if (ordersRes.data) {
          ordersRes.data.forEach((row: OfficerStatutoryOrderDbRecord & { id: string }) => {
            if (row.order_number) cloudOrderRefs.add(String(row.order_number));
            records.push({
              id: row.id,
              source: 'cloud',
              category: 'order',
              subType: row.order_type,
              commodity: row.commodity,
              title: `${row.order_type.replace('_', ' ').toUpperCase()} - ${row.commodity.toUpperCase()}`,
              referenceNumber: row.order_number,
              entityName: row.firm_name,
              recordDate: row.order_date,
              location: [row.mandal, row.district].filter(Boolean).join(', ') || 'N/A',
              details: row.payload_json || {},
              synced: true,
              createdAt: row.created_at || row.order_date,
            });
          });
        }

        if (inspRes.data) {
          inspRes.data.forEach((row: OfficerInspectionDbRecord & { id: string }) => {
            const fj = row.findings_json as Record<string, unknown> | undefined;
            if (fj && typeof fj === 'object' && fj.id) cloudInspectionDraftIds.add(String(fj.id));
            records.push({
              id: row.id,
              source: 'cloud',
              category: 'inspection',
              subType: row.inspection_type,
              commodity: row.inspection_type,
              title: `${row.inspection_type.toUpperCase()} DEALER INSPECTION`,
              referenceNumber: row.license_number || 'N/A',
              entityName: row.firm_name,
              recordDate: row.inspection_date,
              location: 'Field Inspection',
              details: row.findings_json || {},
              synced: true,
              createdAt: row.created_at || row.inspection_date,
            });
          });
        }

        if (samplesRes.data) {
          samplesRes.data.forEach((row: OfficerSampleDbRecord & { id: string }) => {
            if (row.sample_code) cloudSampleCodes.add(String(row.sample_code));
            records.push({
              id: row.id,
              source: 'cloud',
              category: 'sample',
              subType: row.commodity,
              commodity: row.commodity,
              title: `${row.commodity.toUpperCase()} SAMPLE MEMO (${row.lab_status})`,
              referenceNumber: row.sample_code,
              entityName: row.firm_name,
              recordDate: row.date_of_sampling,
              location: (() => {
                const loc = (row.covering_letter_json || {}) as Record<string, unknown>;
                const mandal = [loc.mandal, loc.manualMandal, loc.placeOfCollectionMandal, loc.manualPlaceOfCollection, loc.sampleDrawingMandal, loc.place, loc.premisesLocation]
                  .map((v) => String(v ?? '').trim())
                  .find(Boolean) || '';
                const district = [loc.district, loc.manualDistrict]
                  .map((v) => String(v ?? '').trim())
                  .find(Boolean) || '';
                return [mandal, district].filter(Boolean).join(', ');
              })(),
              details: {
                ...((row.covering_letter_json && typeof row.covering_letter_json === 'object'
                  ? row.covering_letter_json
                  : {}) as Record<string, unknown>),
                labStatus: row.lab_status,
                labReportRef: row.lab_report_ref,
                dispatchedAt: row.dispatched_at,
                reportReceivedAt: row.report_received_at,
              },
              synced: true,
              createdAt: row.created_at || row.date_of_sampling,
            });
          });
        }
      } catch (err) {
        console.warn('Failed to fetch officer cloud records:', err);
      }
    }

    // 2. Read local records from safeStorage and include any that aren't already represented

    // Scan Orders
    Object.entries(OFFICER_LOCAL_STORAGE_KEYS.ORDERS).forEach(([keyName, storageKey]) => {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const subType = keyName.includes('stop_sale') ? 'stop_sale'
          : keyName.includes('seizure') ? 'seizure'
          : keyName.includes('revocation') ? 'revocation'
          : 'show_cause';
        
        const comm: StatutoryCommodity = keyName.includes('seed') ? 'seed'
          : keyName.includes('pesticide') ? 'pesticide'
          : 'fertilizer';

        parsed.forEach((item: Record<string, unknown>) => {
          // Record-on-issue: saved drafts are local working data, not records.
          if (!item.issuedAt) return;
          // Must mirror the order_number fallback chain used by syncStatutoryOrder
          // (orderNumber → noticeNumber → memoNumber → refNumber → id) or SCN and
          // seizure orders never match their cloud row and appear duplicated.
          const refNo = String(item.orderNumber || item.noticeNumber || item.memoNumber || item.refNumber || item.id || '');
          if (refNo && cloudOrderRefs.has(refNo)) return; // already in cloud list

          records.push({
            id: String(item.id || `local-${Math.random().toString(36).slice(2, 7)}`),
            source: 'local',
            category: 'order',
            subType,
            commodity: comm,
            title: `${subType.replace('_', ' ').toUpperCase()} (${comm.toUpperCase()}) [Local]`,
            referenceNumber: refNo || 'Draft',
            entityName: String(item.firmName || 'Local Draft'),
            recordDate: String(item.noticeDate || item.orderDate || item.savedAt || new Date().toISOString().slice(0, 10)),
            location: String(item.mandal || item.district || 'Local Storage'),
            details: item,
            synced: false,
            createdAt: String(item.savedAt || new Date().toISOString()),
          });
        });
      } catch {
        // skip malformed local keys
      }
    });

    // Scan issued inspection drafts (record-on-issue: only drafts whose document
    // was generated are official records)
    Object.entries(OFFICER_LOCAL_STORAGE_KEYS.INSPECTIONS).forEach(([keyName, storageKey]) => {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const comm = keyName as StatutoryCommodity;
        parsed.forEach((item: Record<string, unknown>) => {
          if (!item.issuedAt) return;
          const draftId = String(item.id || '');
          if (draftId && cloudInspectionDraftIds.has(draftId)) return;

          const form = (item.form && typeof item.form === 'object' ? item.form : {}) as Record<string, unknown>;
          records.push({
            id: `local-insp-${comm}-${draftId || 'draft'}`,
            source: 'local',
            category: 'inspection',
            subType: comm,
            commodity: comm,
            title: `${comm.toUpperCase()} DEALER INSPECTION [Local]`,
            referenceNumber: String(form.licenceNo || form.licenseNumber || draftId || 'Draft'),
            entityName: String(form.dealerName || form.firmName || 'Local Draft'),
            recordDate: String(form.inspectionDate || item.savedAt || new Date().toISOString().slice(0, 10)),
            location: String(form.mandal || form.district || 'Local Storage'),
            details: item,
            synced: false,
            createdAt: String(item.issuedAt || item.savedAt || new Date().toISOString()),
          });
        });
      } catch {
        // skip malformed local keys
      }
    });

    // Scan covering-letter queue samples (record-on-issue: queue items are
    // registered samples; dedupe against cloud by sample_code)
    Object.entries(OFFICER_LOCAL_STORAGE_KEYS.SAMPLES).forEach(([keyName, storageKey]) => {
      try {
        const raw = safeStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const comm = keyName as StatutoryCommodity;
        parsed.forEach((item: Record<string, unknown>, index: number) => {
          if (!item.issuedAt) return; // unissued covering-letter queue drafts are not records
          const sampleCode = String(item.sampleCode || '').trim();
          if (!sampleCode || cloudSampleCodes.has(sampleCode)) return;

          records.push({
            id: `local-sample-${comm}-${sampleCode}-${index}`,
            source: 'local',
            category: 'sample',
            subType: comm,
            commodity: comm,
            title: `${comm.toUpperCase()} SAMPLE MEMO [Local]`,
            referenceNumber: sampleCode,
            entityName: String(item.firmName || item.dealerName || 'Local Draft'),
            recordDate: String(item.dateOfSampling || item.samplingDate || new Date().toISOString().slice(0, 10)),
            location: (() => {
              const mandal = [item.mandal, item.manualMandal, item.placeOfCollectionMandal, item.manualPlaceOfCollection, item.sampleDrawingMandal, item.place, item.premisesLocation]
                .map((v) => String(v ?? '').trim())
                .find(Boolean) || '';
              const district = [item.district, item.manualDistrict]
                .map((v) => String(v ?? '').trim())
                .find(Boolean) || '';
              return [mandal, district].filter(Boolean).join(', ') || 'Local Storage';
            })(),
            details: item,
            synced: false,
            createdAt: new Date().toISOString(),
          });
        });
      } catch {
        // skip malformed local keys
      }
    });

    return records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  }

  /**
   * Re-pushes a local-only unified record to Supabase. Used by the Records Hub
   * "Sync now" action to flush records created offline.
   */
  static async resyncLocalRecord(record: UnifiedOfficerRecord): Promise<SyncResult | null> {
    if (record.source !== 'local') return null;
    if (record.category === 'order') {
      return this.syncStatutoryOrder(record.subType as StatutoryOrderType, record.commodity, record.details);
    }
    if (record.category === 'inspection') {
      return this.syncInspection(record.commodity, record.details);
    }
    return this.syncSampleMemo(record.commodity, record.details);
  }

  /**
   * Deletes a record from cloud and/or local storage
   */
  static async deleteRecord(record: UnifiedOfficerRecord): Promise<boolean> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let cloudDeleted = true;
    if (record.source === 'cloud' && isOnline) {
      try {
        const tableName = record.category === 'order' ? 'officer_statutory_orders'
          : record.category === 'inspection' ? 'officer_inspections'
          : 'officer_samples';

        const { error } = await supabase.from(tableName).delete().eq('id', record.id);
        if (error) cloudDeleted = false;
      } catch {
        cloudDeleted = false;
      }
    }

    // Also remove from any local arrays if present (orders, inspections, samples).
    // Match on every identifier a local item can carry — record.id covers cloud
    // rows and local order/draft ids, details.id covers inspection drafts whose
    // unified id is prefixed, and the reference fallbacks mirror the sync chain.
    const detailId = String((record.details as Record<string, unknown> | undefined)?.id ?? '');
    const allLocalKeys = [
      ...Object.values(OFFICER_LOCAL_STORAGE_KEYS.ORDERS),
      ...Object.values(OFFICER_LOCAL_STORAGE_KEYS.INSPECTIONS),
      ...Object.values(OFFICER_LOCAL_STORAGE_KEYS.SAMPLES),
    ];
    allLocalKeys.forEach((key) => {
      try {
        const raw = safeStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: Record<string, unknown>) => {
            const localRef = String(
              item.orderNumber || item.noticeNumber || item.memoNumber || item.refNumber || item.sampleCode || item.id || ''
            );
            return (
              item.id !== record.id &&
              item.id !== detailId &&
              localRef !== record.referenceNumber &&
              item.sampleCode !== record.referenceNumber
            );
          });
          safeStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    });

    // Unlink the record from any open enforcement case
    const officerId = await this.getCurrentOfficerId();
    if (officerId) {
      const detailId = String((record.details as Record<string, unknown> | undefined)?.id ?? '');
      const recordLink =
        record.category === 'order'
          ? `${record.subType}:${record.referenceNumber}`
          : record.category === 'sample'
            ? `sample:${record.referenceNumber}`
            : `inspection:${detailId || record.id}`;
      await this.unlinkCaseRecord(officerId, recordLink);
    }

    return cloudDeleted;
  }

  // ---------- Record deletion (form-level deletes) ----------

  /** Removes a `kind:ref` link from any open case that references a deleted record. */
  private static async unlinkCaseRecord(officerId: string, recordLink: string): Promise<void> {
    try {
      const { data: cases } = await supabase
        .from('officer_cases')
        .select('id, linked_record_ids')
        .eq('officer_id', officerId)
        .neq('stage', 'CLOSED');
      for (const c of cases ?? []) {
        const linked = Array.isArray(c.linked_record_ids) ? c.linked_record_ids.map(String) : [];
        if (!linked.includes(recordLink)) continue;
        await supabase
          .from('officer_cases')
          .update({ linked_record_ids: linked.filter((l) => l !== recordLink) })
          .eq('id', c.id);
      }
    } catch {
      // best-effort
    }
  }

  /** Deletes the cloud inspection row for an issued draft. */
  static async deleteInspectionRecord(commodity: StatutoryCommodity, draftId: string): Promise<boolean> {
    const officerId = await this.getCurrentOfficerId();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!officerId || !isOnline || !draftId) return false;
    try {
      const { error } = await supabase
        .from('officer_inspections')
        .delete()
        .eq('officer_id', officerId)
        .eq('inspection_type', commodity)
        .filter('findings_json->>id', 'eq', draftId);
      if (error) return false;
      await this.unlinkCaseRecord(officerId, `inspection:${draftId}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Deletes the cloud statutory-order row by its natural key. */
  static async deleteStatutoryOrderRecord(
    orderType: StatutoryOrderType,
    commodity: StatutoryCommodity,
    orderNumber: string
  ): Promise<boolean> {
    const officerId = await this.getCurrentOfficerId();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!officerId || !isOnline || !orderNumber) return false;
    try {
      const { error } = await supabase
        .from('officer_statutory_orders')
        .delete()
        .eq('officer_id', officerId)
        .eq('order_type', orderType)
        .eq('commodity', commodity)
        .eq('order_number', orderNumber);
      if (error) return false;
      await this.unlinkCaseRecord(officerId, `${orderType}:${orderNumber}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Deletes the cloud sample-memo row by commodity + sample code. */
  static async deleteSampleMemoRecord(commodity: StatutoryCommodity, sampleCode: string): Promise<boolean> {
    const officerId = await this.getCurrentOfficerId();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!officerId || !isOnline || !sampleCode) return false;
    try {
      const { error } = await supabase
        .from('officer_samples')
        .delete()
        .eq('officer_id', officerId)
        .eq('commodity', commodity)
        .eq('sample_code', sampleCode);
      if (error) return false;
      await this.unlinkCaseRecord(officerId, `sample:${sampleCode}`);
      return true;
    } catch {
      return false;
    }
  }

  // ---------- Enforcement case auto-linking ----------

  private static readonly CASE_STAGE_RANK: Record<string, number> = {
    INSPECTION: 0,
    SAMPLING: 1,
    LAB_TEST: 2,
    SHOW_CAUSE: 3,
    ENFORCEMENT: 4,
    CLOSED: 5,
  };

  private static normalizeCaseDealer(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private static orderCaseStage(orderType: StatutoryOrderType): { stage: string; priority: 'NORMAL' | 'HIGH' } {
    if (orderType === 'show_cause') return { stage: 'SHOW_CAUSE', priority: 'NORMAL' };
    return { stage: 'ENFORCEMENT', priority: 'HIGH' };
  }

  private static sampleCaseStage(labStatus: OfficerSampleDbRecord['lab_status']): string {
    return labStatus === 'TEST_PASSED' || labStatus === 'TEST_FAILED' ? 'LAB_TEST' : 'SAMPLING';
  }

  private static async ensureSampleCase(
    officerId: string,
    commodity: StatutoryCommodity,
    firmName: string,
    sampleCode: string,
    dateOfSampling: string,
    labStatus: OfficerSampleDbRecord['lab_status']
  ): Promise<void> {
    await this.ensureEnforcementCase({
      officerId,
      dealerName: firmName,
      commodity,
      stage: this.sampleCaseStage(labStatus),
      recordRef: sampleCode,
      recordDate: dateOfSampling,
      recordKind: 'sample',
    });
  }

  /**
   * Auto-creates or updates an enforcement case for a dealer+commodity whenever
   * a statutory record (inspection, sample memo, show-cause, stop-sale, seizure,
   * revocation) is synced — so cases appear in the tracker without manual entry.
   * Best-effort: failures never block record sync.
   */
  private static async ensureEnforcementCase(params: {
    officerId: string;
    dealerName: string;
    commodity: StatutoryCommodity;
    stage: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    recordRef: string;
    recordDate: string;
    recordKind: string;
  }): Promise<void> {
    const dealerName = params.dealerName.trim();
    const dealerKey = this.normalizeCaseDealer(dealerName);
    if (!dealerKey || /unknown|sample source|dealer inspection/i.test(dealerKey)) return;
    if (!(params.stage in this.CASE_STAGE_RANK)) return;

    try {
      const { data: openCases } = await supabase
        .from('officer_cases')
        .select('id, dealer_name, commodity, stage, linked_record_ids')
        .eq('officer_id', params.officerId)
        .neq('stage', 'CLOSED');

      const recordLink = `${params.recordKind}:${params.recordRef}`;
      const existing = (openCases ?? []).find(
        (c) =>
          c.commodity === params.commodity &&
          this.normalizeCaseDealer(String(c.dealer_name ?? '')) === dealerKey
      );

      if (existing) {
        const linked: string[] = Array.isArray(existing.linked_record_ids)
          ? existing.linked_record_ids.map(String)
          : [];
        const updates: Record<string, unknown> = {};
        if (!linked.includes(recordLink)) updates.linked_record_ids = [...linked, recordLink];
        const currentRank = this.CASE_STAGE_RANK[String(existing.stage)] ?? 0;
        const nextRank = this.CASE_STAGE_RANK[params.stage] ?? 0;
        if (nextRank > currentRank) updates.stage = params.stage;
        if (Object.keys(updates).length > 0) {
          await supabase.from('officer_cases').update(updates).eq('id', existing.id);
        }
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      await supabase.from('officer_cases').insert({
        officer_id: params.officerId,
        case_number: `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        dealer_name: dealerName,
        commodity: params.commodity,
        stage: params.stage,
        priority: params.priority ?? 'NORMAL',
        opened_date: params.recordDate || today,
        linked_record_ids: [recordLink],
        notes: `Auto-created from ${params.recordKind} record ${params.recordRef}`,
      });
    } catch {
      // Case auto-linking is best-effort; never block record sync.
    }
  }

  // ---------- Offline pending-record flush ----------

  private static flushListenerRegistered = false;
  private static lastFlushAt = 0;
  private static flushing = false;

  /**
   * Re-syncs every locally stored official record (orders, issued inspection
   * drafts, sample memos) to Supabase. All sync methods dedupe server-side, so
   * re-running is safe — this is the safety net for records created while
   * offline. Called automatically on reconnect; safe to call manually.
   */
  static async flushPendingLocalRecords(): Promise<{ attempted: number; synced: number }> {
    const now = Date.now();
    if (this.flushing || now - this.lastFlushAt < 30_000) {
      return { attempted: 0, synced: 0 };
    }
    this.flushing = true;
    this.lastFlushAt = now;

    let attempted = 0;
    let synced = 0;

    const run = async (fn: () => Promise<SyncResult>) => {
      attempted += 1;
      try {
        const result = await fn();
        if (result.syncedToCloud) synced += 1;
      } catch {
        // keep flushing the rest; failures retry on next reconnect
      }
    };

    try {
      // Orders — every saved order is eligible (they persist on issue/save)
      for (const [keyName, storageKey] of Object.entries(OFFICER_LOCAL_STORAGE_KEYS.ORDERS)) {
        const items = this.readLocalArray(storageKey);
        const orderType = (keyName.includes('stop_sale') ? 'stop_sale'
          : keyName.includes('seizure') ? 'seizure'
          : keyName.includes('revocation') ? 'revocation'
          : 'show_cause') as StatutoryOrderType;
        const commodity = (keyName.includes('seed') ? 'seed'
          : keyName.includes('pesticide') ? 'pesticide'
          : 'fertilizer') as StatutoryCommodity;
        for (const item of items) {
          // Record-on-issue: only orders whose document was actually generated
          // (issuedAt set) are official records — saved drafts stay local.
          if (!item.issuedAt) continue;
          // Revocations must prefer revokeDate over the original notice's
          // noticeDate; only override when a real value exists.
          const overrides =
            orderType === 'revocation' && item.revokeDate
              ? { orderDate: String(item.revokeDate) }
              : undefined;
          await run(() => this.syncStatutoryOrder(orderType, commodity, item, overrides));
        }
      }

      // Inspections — only issued drafts are official records
      for (const [keyName, storageKey] of Object.entries(OFFICER_LOCAL_STORAGE_KEYS.INSPECTIONS)) {
        const commodity = keyName as StatutoryCommodity;
        for (const item of this.readLocalArray(storageKey)) {
          if (!item.issuedAt) continue;
          await run(() => this.syncInspection(commodity, item));
        }
      }

      // Samples — covering-letter queue items; only issued samples are records
      for (const [keyName, storageKey] of Object.entries(OFFICER_LOCAL_STORAGE_KEYS.SAMPLES)) {
        const commodity = keyName as StatutoryCommodity;
        for (const item of this.readLocalArray(storageKey)) {
          if (!item.issuedAt) continue;
          await run(() => this.syncSampleMemo(commodity, item));
        }
      }
    } finally {
      this.flushing = false;
    }

    return { attempted, synced };
  }

  /**
   * Registers a one-time `online` listener that flushes pending local records
   * when connectivity returns, plus an initial flush for records created while
   * the app was offline in a previous session.
   */
  static initOfflineSyncRetry(): void {
    if (typeof window === 'undefined' || this.flushListenerRegistered) return;
    this.flushListenerRegistered = true;

    window.addEventListener('online', () => {
      void this.flushPendingLocalRecords();
    });

    // Flush shortly after boot in case connectivity returned while the app
    // was closed — covers records issued offline in a previous session.
    window.setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void this.flushPendingLocalRecords();
      }
    }, 5_000);
  }

  private static readLocalArray(key: string): Record<string, unknown>[] {
    try {
      const raw = safeStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
