export type EvidenceFileRecord = {
  id: string;
  studentId: string;
  courseId: string;
  name: string;
  size: number;
  type: string;
  addedAt: string;
  blob: Blob;
};

const DATABASE_NAME = 'internship-prep-local-files';
const DATABASE_VERSION = 1;
const STORE_NAME = 'evidence';

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('This browser does not support local file storage.'));
  }

  if (databasePromise) return databasePromise;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('studentId', 'studentId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local file storage.'));
    request.onblocked = () => reject(new Error('Local file storage is busy. Close other copies of this demo and try again.'));
  }).catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });

  databasePromise = opening;
  return opening;
}

export async function listEvidenceFiles(studentId: string): Promise<EvidenceFileRecord[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).index('studentId').getAll(studentId);
    request.onsuccess = () => resolve((request.result as EvidenceFileRecord[]).sort(
      (a, b) => b.addedAt.localeCompare(a.addedAt),
    ));
    request.onerror = () => reject(request.error ?? new Error('Could not read saved evidence files.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not read saved evidence files.'));
  });
}

export async function saveEvidenceFile(file: EvidenceFileRecord): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this evidence file.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving this evidence file was cancelled.'));
  });
}

export async function deleteEvidenceFile(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete this evidence file.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Deleting this evidence file was cancelled.'));
  });
}
