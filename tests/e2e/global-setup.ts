import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';

export default async function globalSetup() {
  console.log('--- Playwright Global Setup: Clearing old Test Database ---');
  let dbPath = '';
  
  if (process.platform === 'win32') {
    dbPath = join(process.env.APPDATA || '', 'warehouse-app', 'test-warehouse.db');
  } else if (process.platform === 'darwin') {
    dbPath = join(os.homedir(), 'Library', 'Application Support', 'warehouse-app', 'test-warehouse.db');
  } else {
    dbPath = join(os.homedir(), '.config', 'warehouse-app', 'test-warehouse.db');
  }

  // Delete all parts of SQLite db files
  const filesToDelete = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`];
  
  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`Deleted: ${file}`);
      } catch (e) {
        console.error(`Failed to delete ${file}`, e);
      }
    }
  }
}
