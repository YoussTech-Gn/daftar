import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { exportAll, importAll, type BackupData } from '@/db/repository';
import { buildCsv } from '@/domain/csv';

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function writeAndShare(name: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

export async function shareCsv(db: SQLiteDatabase, currency: string): Promise<void> {
  const data = await exportAll(db);
  await writeAndShare(`daftar-${stamp()}.csv`, buildCsv(data.customers, data.entries, currency), 'text/csv');
}

export async function shareBackup(db: SQLiteDatabase): Promise<void> {
  const data = await exportAll(db);
  await writeAndShare(`daftar-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

/** Lets the user pick a backup file. Returns parsed data, or null if cancelled. Throws if invalid. */
export async function pickBackup(): Promise<BackupData | null> {
  const result = await File.pickFileAsync(undefined, 'application/json');
  const file = Array.isArray(result) ? result[0] : result;
  if (!file) return null;
  const data = JSON.parse(await file.text()) as BackupData;
  if (data?.app !== 'daftar' || !Array.isArray(data.customers) || !Array.isArray(data.entries)) {
    throw new Error('Invalid backup');
  }
  return data;
}

export { importAll };
