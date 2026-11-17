import { openDatabaseAsync } from 'expo-sqlite';
import { examples, type Workspace } from './seed';

let connection: ReturnType<typeof openDatabaseAsync> | undefined;

function open() {
  if (!connection) {
    connection = openDatabaseAsync('lofy-croche.db').then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY, data TEXT NOT NULL);');
      await db.runAsync('INSERT OR IGNORE INTO workspace (id, data) VALUES (1, ?)', JSON.stringify(examples()));
      return db;
    }).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

// Serialize writes made by this app to avoid lock contention on SQLite.
let pending = Promise.resolve();
export async function withWorkspace<T>(operation: (state: Workspace) => T, write = false) {
  const db = await open();
  if (!write) {
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM workspace WHERE id = 1');
    if (!row) throw new Error('Base local indisponível.');
    return operation(JSON.parse(row.data));
  }
  const task = pending.then(async () => {
    let result!: T;
    await db.withExclusiveTransactionAsync(async (transaction) => {
      const row = await transaction.getFirstAsync<{ data: string }>('SELECT data FROM workspace WHERE id = 1');
      if (!row) throw new Error('Base local indisponível.');
      const state = JSON.parse(row.data) as Workspace;
      result = operation(state);
      await transaction.runAsync('UPDATE workspace SET data = ? WHERE id = 1', JSON.stringify(state));
    });
    return result;
  });
  pending = task.then(() => {}, () => {});
  return task;
}
