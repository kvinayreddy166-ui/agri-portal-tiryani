// IndexedDB storage service for Tour Diary PDFs
// This service handles local storage of downloaded PDF files using IndexedDB

const DB_NAME = 'agronix-local';
const DB_VERSION = 1;
const STORE_NAME = 'diary-pdfs';

export interface DiaryPdfMetadata {
  id: string;
  diaryId: string;
  month: number;
  year: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryPdfRecord extends DiaryPdfMetadata {
  blob: Blob;
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
      
      // Create object store for diary PDFs
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient queries
        store.createIndex('diaryId', 'diaryId', { unique: false });
        store.createIndex('month', 'month', { unique: false });
        store.createIndex('year', 'year', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
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

// Generate unique ID for PDF record
function generatePdfId(diaryId: string, month: number, year: number): string {
  return `${diaryId}_${year}-${String(month).padStart(2, '0')}`;
}

// Generate default filename
function generateFileName(month: number, year: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `Tour-Diary-${months[month - 1]}-${year}.pdf`;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Save PDF to IndexedDB
export async function saveDiaryPdf(
  diaryId: string,
  month: number,
  year: number,
  blob: Blob,
  fileName?: string
): Promise<DiaryPdfMetadata> {
  try {
    const db = await getDatabase();
    const id = generatePdfId(diaryId, month, year);
    const finalFileName = fileName || generateFileName(month, year);
    const now = new Date().toISOString();

    const record: DiaryPdfRecord = {
      id,
      diaryId,
      month,
      year,
      fileName: finalFileName,
      mimeType: blob.type || 'application/pdf',
      fileSize: blob.size,
      blob,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        const { blob: _, ...metadata } = record;
        resolve(metadata);
      };

      request.onerror = () => {
        reject(new Error('Failed to save PDF to IndexedDB'));
      };
    });
  } catch (error) {
    throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if PDF exists for a diary
export async function hasDiaryPdf(diaryId: string, month: number, year: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    const id = generatePdfId(diaryId, month, year);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to check PDF existence'));
      };
    });
  } catch (error) {
    return false;
  }
}

// Get all PDF metadata (without blobs)
export async function getAllDiaryPdfs(): Promise<DiaryPdfMetadata[]> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as DiaryPdfRecord[];
        // Return metadata only, exclude blobs
        const metadata = records.map(({ blob: _, ...meta }) => meta);
        // Sort by creation date, newest first
        metadata.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(metadata);
      };

      request.onerror = () => {
        reject(new Error('Failed to get PDF metadata'));
      };
    });
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return [];
  }
}

// Get PDF blob by ID
export async function getDiaryPdf(id: string): Promise<Blob | null> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as DiaryPdfRecord | undefined;
        resolve(record?.blob || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get PDF blob'));
      };
    });
  } catch (error) {
    console.error('Error getting PDF blob:', error);
    return null;
  }
}

// Delete PDF from IndexedDB
export async function deleteDiaryPdf(id: string): Promise<boolean> {
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
        reject(new Error('Failed to delete PDF'));
      };
    });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}

// Rename PDF
export async function renameDiaryPdf(id: string, newFileName: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // First get the existing record
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const record = getRequest.result as DiaryPdfRecord | undefined;
        if (!record) {
          reject(new Error('PDF not found'));
          return;
        }

        // Update the filename and updatedAt
        const updatedRecord: DiaryPdfRecord = {
          ...record,
          fileName: newFileName,
          updatedAt: new Date().toISOString()
        };

        const putRequest = store.put(updatedRecord);
        
        putRequest.onsuccess = () => {
          resolve(true);
        };

        putRequest.onerror = () => {
          reject(new Error('Failed to rename PDF'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get PDF for renaming'));
      };
    });
  } catch (error) {
    console.error('Error renaming PDF:', error);
    return false;
  }
}

// Helper function to format file size for display
export { formatFileSize };
