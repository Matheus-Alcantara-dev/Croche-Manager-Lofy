import { examples, type Workspace } from './seed';

let connection: Promise<IDBDatabase> | undefined;

function open() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) return reject(new Error('O navegador não disponibilizou o banco local.'));
      const request = indexedDB.open('lofy-croche', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('workspace').put(examples(), 'data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

export async function withWorkspace<T>(operation: (state: Workspace) => T, write = false) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction('workspace', write ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('workspace');
    const request = store.get('data');
    let result: T;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        result = operation(request.result as Workspace);
        if (write) store.put(request.result, 'data');
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Falha no banco local.'));
  });
}
