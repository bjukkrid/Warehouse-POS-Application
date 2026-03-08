import { app } from 'electron';
import { join } from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';
import { employees, products } from './schema.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';

export function initializeDatabase(dbPath: string) {
  try {
    const isDev = !app.isPackaged;
    // In dev mode, we look at the source structure.
    // In production (app.isPackaged = true), we must put migration files in process.resourcesPath or extraResources.
    const migrationsFolder = isDev
      ? join(app.getAppPath(), 'electron/database/migrations')
      : join(process.resourcesPath, 'migrations');

    console.log('Running Drizzle migrations from:', migrationsFolder);
    
    // 🔥 This 1 magic line creates or updates all tables automatically from .sql files
    if (fs.existsSync(migrationsFolder)) {
      migrate(db, { migrationsFolder });
      console.log('Database migrated successfully!');
    } else {
      console.warn('Migrations folder not found, skipping automated migration.');
    }

    // Seed some initial data if database is empty
    const empCount = db.select({ count: sql<number>`count(*)` }).from(employees).get();
    if (empCount && empCount.count === 0) {
      db.insert(employees).values([
        { id: 1, name: 'Alex Johnson', role: 'Manager', passcode: '1234' },
        { id: 2, name: 'Sara', role: 'Cashier', passcode: '1111' }
      ]).run();
      
      db.insert(products).values([
        { id: 1, name: 'Wireless Mouse Pro', category: 'Electronics', basePrice: 45.0, stock: 2, sku: 'WM-001-BLK' },
        { id: 2, name: 'HDMI Cable 6ft', category: 'Cables', basePrice: 12.0, stock: 4, sku: 'CB-HDMI-06', images: '[]' }
      ]).run();
      console.log('Seeded initial testing data.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}
