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
    fertilizer: 'tiryani-fertilizer-covering-letter-queue',
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
    data: Record<string, unknown>
  ): Promise<SyncResult> {
    const officerId = await this.getCurrentOfficerId();
    const id = (data.id as string) || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = String(data.orderNumber || data.noticeNumber || id);
    const orderDate = String(data.noticeDate || data.orderDate || new Date().toISOString().slice(0, 10));
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
    const firmName = String(data.firmName || data.dealerName || 'Dealer Inspection');
    const licenseNumber = String(data.licenseNumber || data.licenseNo || '');
    const inspectionDate = String(data.inspectionDate || data.date || new Date().toISOString().slice(0, 10));

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let syncedToCloud = false;
    let cloudError: string | undefined;

    if (officerId && isOnline) {
      try {
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
          .upsert(payload);

        if (!error) {
          syncedToCloud = true;
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
          .upsert(payload);

        if (!error) {
          syncedToCloud = true;
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
   * Fetches all records from both Supabase and safeStorage for a comprehensive view
   */
  static async fetchAllOfficerRecords(): Promise<UnifiedOfficerRecord[]> {
    const records: UnifiedOfficerRecord[] = [];
    const officerId = await this.getCurrentOfficerId();

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

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
              location: row.batch_no ? `Batch: ${row.batch_no}` : 'N/A',
              details: row.covering_letter_json || {},
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
    const knownRefNumbers = new Set(records.map((r) => r.referenceNumber));

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
          const refNo = String(item.orderNumber || item.noticeNumber || item.id || '');
          if (refNo && knownRefNumbers.has(refNo)) return; // already in cloud list

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

    return records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
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

    // Also remove from any local arrays if present
    Object.values(OFFICER_LOCAL_STORAGE_KEYS.ORDERS).forEach((key) => {
      try {
        const raw = safeStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: Record<string, unknown>) => item.id !== record.id && item.orderNumber !== record.referenceNumber);
          safeStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    });

    return cloudDeleted;
  }
}
