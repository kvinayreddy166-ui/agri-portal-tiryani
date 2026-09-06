// IndexedDB storage service for Tour Diary records
// This service handles local storage of completed/saved diary records and drafts using IndexedDB

const DB_NAME = 'agronix-local';
const DB_VERSION = 2; // Incremented to add new object store
const STORE_NAME = 'tour-diaries';
const DRAFTS_STORE_NAME = 'tour-diary-drafts';

export interface SavedDiaryRecord {
  id: string;
  officer_id: string;
  officer_name?: string;
  designation?: string;
  district?: string;
  mandal?: string;
  year: number;
  month: number;
  opening_meter: number;
  closing_meter: number | null;
  total_km: number;
  journeys: any[];
  dateStatusOverrides: Record<string, any>;
  dateRemarks: Record<string, string>;
  status: 'SAVED';
  createdAt: string;
  updatedAt: string;
}

export interface DraftRecord {
  id: string;
  officer_id: string;
  officer_name?: string;
  designation?: string;
  district?: string;
  mandal?: string;
  year: number;
  month: number;
  opening_meter: number;
  journeys: any[];
  dateStatusOverrides: Record<string, any>;
  dateRemarks: Record<string, string>;
  status: 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

// Initialize IndexedDB database
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for saved diaries
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient queries
        store.createIndex('officer_id', 'officer_id', { unique: false });
        store.createIndex('month', 'month', { unique: false });
        store.createIndex('year', 'year', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Create object store for drafts
      if (!db.objectStoreNames.contains(DRAFTS_STORE_NAME)) {
        const draftStore = db.createObjectStore(DRAFTS_STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient queries
        draftStore.createIndex('officer_id', 'officer_id', { unique: false });
        draftStore.createIndex('month', 'month', { unique: false });
        draftStore.createIndex('year', 'year', { unique: false });
        draftStore.createIndex('createdAt', 'createdAt', { unique: false });
        draftStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

// Get or create database instance
let dbInstance: IDBDatabase | null = null;

async function getDatabase(): Promise<IDBDatabase> {
  if (!dbInstance) {
    dbInstance = await openDatabase();
  }
  return dbInstance;
}

// Generate unique ID for saved diary
function generateDiaryId(officerId: string, month: number, year: number): string {
  return `${officerId}_${year}-${String(month).padStart(2, '0')}`;
}

// Save diary to IndexedDB
export async function saveDiary(
  officerId: string,
  officerName: string,
  designation: string,
  district: string,
  mandal: string,
  year: number,
  month: number,
  openingMeter: number,
  closingMeter: number | null,
  totalKm: number,
  journeys: any[],
  dateStatusOverrides: Record<string, any>,
  dateRemarks: Record<string, string>
): Promise<SavedDiaryRecord> {
  try {
    const db = await getDatabase();
    const id = generateDiaryId(officerId, month, year);
    const now = new Date().toISOString();

    const record: SavedDiaryRecord = {
      id,
      officer_id: officerId,
      officer_name: officerName,
      designation,
      district,
      mandal,
      year,
      month,
      opening_meter: openingMeter,
      closing_meter: closingMeter,
      total_km: totalKm,
      journeys,
      dateStatusOverrides,
      dateRemarks,
      status: 'SAVED',
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = () => {
        reject(new Error('Failed to save diary to IndexedDB'));
      };
    });
  } catch (error) {
    throw new Error(`Failed to save diary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all saved diaries
export async function getAllSavedDiaries(): Promise<SavedDiaryRecord[]> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as SavedDiaryRecord[];
        // Sort by updatedAt, newest first
        records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(records);
      };

      request.onerror = () => {
        reject(new Error('Failed to get saved diaries'));
      };
    });
  } catch (error) {
    console.error('Error getting saved diaries:', error);
    return [];
  }
}

// Get saved diary by ID
export async function getSavedDiary(id: string): Promise<SavedDiaryRecord | null> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as SavedDiaryRecord | undefined;
        resolve(record || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get saved diary'));
      };
    });
  } catch (error) {
    console.error('Error getting saved diary:', error);
    return null;
  }
}

// Delete saved diary
export async function deleteSavedDiary(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete saved diary'));
      };
    });
  } catch (error) {
    console.error('Error deleting saved diary:', error);
    return false;
  }
}

// Save draft to IndexedDB
export async function saveDraft(
  officerId: string,
  officerName: string,
  designation: string,
  district: string,
  mandal: string,
  year: number,
  month: number,
  openingMeter: number,
  journeys: any[],
  dateStatusOverrides: Record<string, any>,
  dateRemarks: Record<string, string>
): Promise<DraftRecord> {
  try {
    const db = await getDatabase();
    const id = generateDiaryId(officerId, month, year);
    const now = new Date().toISOString();

    const record: DraftRecord = {
      id,
      officer_id: officerId,
      officer_name: officerName,
      designation,
      district,
      mandal,
      year,
      month,
      opening_meter: openingMeter,
      journeys,
      dateStatusOverrides,
      dateRemarks,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DRAFTS_STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = () => {
        reject(new Error('Failed to save draft to IndexedDB'));
      };
    });
  } catch (error) {
    throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all drafts
export async function getAllDrafts(): Promise<DraftRecord[]> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DRAFTS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(DRAFTS_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as DraftRecord[];
        // Sort by updatedAt, newest first
        records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(records);
      };

      request.onerror = () => {
        reject(new Error('Failed to get drafts'));
      };
    });
  } catch (error) {
    console.error('Error getting drafts:', error);
    return [];
  }
}

// Get draft by ID
export async function getDraft(id: string): Promise<DraftRecord | null> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DRAFTS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(DRAFTS_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as DraftRecord | undefined;
        resolve(record || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get draft'));
      };
    });
  } catch (error) {
    console.error('Error getting draft:', error);
    return null;
  }
}

// Delete draft
export async function deleteDraft(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DRAFTS_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete draft'));
      };
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}
