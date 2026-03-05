import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { join, dirname } from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { db } from './db'
import { products, sales, saleItems, employees } from './schema.js'
import { like, eq, desc, and, or, sql, inArray, asc } from 'drizzle-orm'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Try to create tables simple way for dev, better way is drizzle-kit
  try {
    const dbsqlite = new Database(join(app.getPath('userData'), 'warehouse.db'));
    dbsqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Uncategorized',
        brand TEXT,
        description TEXT,
        base_price REAL NOT NULL DEFAULT 0,
        cost REAL NOT NULL DEFAULT 0,
        sku TEXT UNIQUE,
        barcode TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        low_stock_alert INTEGER NOT NULL DEFAULT 10,
        status TEXT NOT NULL DEFAULT 'Published',
        images TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Cashier',
        passcode TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        discount_limit REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Active'
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_amount REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        employee_id INTEGER REFERENCES employees(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER REFERENCES sales(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_time REAL NOT NULL
      );
      
      -- Seed some initial data for testing
      INSERT OR IGNORE INTO employees (id, name, role, passcode) VALUES (1, 'Alex Johnson', 'Manager', '1234');
      INSERT OR IGNORE INTO employees (id, name, role, passcode) VALUES (2, 'Sara', 'Cashier', '1111');
      INSERT OR IGNORE INTO products (id, name, category, base_price, stock, sku) VALUES (1, 'Wireless Mouse Pro', 'Electronics', 45.0, 2, 'WM-001-BLK');
      INSERT OR IGNORE INTO products (id, name, category, base_price, stock, sku, images) VALUES (2, 'HDMI Cable 6ft', 'Cables', 12.0, 4, 'CB-HDMI-06', '[]');
    `);
  } catch (error) {
    const e = error as Error;
    if (!e.message?.includes('images')) {
      console.error('Migration error:', e);
    }
  }

  // Auto-migrate newly added columns for local dev databases gracefully
  try { 
    const dbsqlite = new Database(join(app.getPath('userData'), 'warehouse.db'));
    dbsqlite.exec(`
      ALTER TABLE products ADD COLUMN images TEXT;
    `); 
  } catch (error) {
    const e = error as Error;
    if (!e.message?.includes('images')) {
      console.error('Migration error:', e);
    }
  }

  try {
    const dbsqlite = new Database(join(app.getPath('userData'), 'warehouse.db'));
    const employeeColumns = [
      "ALTER TABLE employees ADD COLUMN phone TEXT;",
      "ALTER TABLE employees ADD COLUMN email TEXT;",
      "ALTER TABLE employees ADD COLUMN discount_limit REAL DEFAULT 0;",
      "ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'Active';"
    ];
    for (const statement of employeeColumns) {
      try {
        dbsqlite.exec(statement);
      } catch (err: any) {
        if (!err.message?.includes('duplicate column')) {
          console.error('Employee migration error:', err);
        }
      }
    }
  } catch (err) {
    console.error('Database connection error during migration', err);
  }

  ipcMain.handle('get-products', async (event, search?: string) => {
    if (search) {
      return await db.select().from(products)
        .where(and(like(products.name, `%${search}%`), sql`status != 'Deleted'`));
    }
    return await db.select().from(products).where(sql`status != 'Deleted'`).orderBy(desc(products.id));
  });

  ipcMain.handle('get-products-paginated', async (event, params: any) => {
    const { page = 1, limit = 10, search = '', category = '', stockStatus = '', status = '', sortBy = 'id', sortOrder = 'desc' } = params || {};
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.category, `%${search}%`)
        )
      );
    }
    
    if (category && category !== 'All Categories' && category !== 'Category') {
      conditions.push(eq(products.category, category));
    }

    if (stockStatus && stockStatus !== 'Stock Status' && stockStatus !== 'All Status') {
      if (stockStatus === 'In Stock') {
        conditions.push(sql`stock > low_stock_alert`);
      } else if (stockStatus === 'Low Stock' || stockStatus === 'Low Stock ') {
        conditions.push(sql`stock <= low_stock_alert`);
      }
    }

    if (status && status !== 'Product Status' && status !== 'All Status') {
      conditions.push(eq(products.status, status));
    } else {
      conditions.push(sql`status != 'Deleted'`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    let orderClause = desc(products.id);
    let column: any = products.id;
    if (sortBy === 'name') column = products.name;
    if (sortBy === 'sku') column = products.sku;
    if (sortBy === 'category') column = products.category;
    if (sortBy === 'stock') column = products.stock;
    if (sortBy === 'basePrice') column = products.basePrice;
    if (sortBy === 'status') column = products.status;

    if (sortOrder === 'asc') orderClause = asc(column);
    else orderClause = desc(column);

    const data = await db.select().from(products)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
      
    const total = countResult[0].count;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  });

  ipcMain.handle('get-low-stock-items', async () => {
    return await db.select().from(products)
      .where(and(sql`stock <= low_stock_alert`, sql`status != 'Deleted'`));
  });

  ipcMain.handle('add-product', async (event, data) => {
    return await db.insert(products).values(data).returning();
  });

  ipcMain.handle('update-product', async (event, id, data) => {
    return await db.update(products).set(data).where(eq(products.id, id)).returning();
  });

  ipcMain.handle('delete-product', async (event, id) => {
    try {
      return await db.delete(products).where(eq(products.id, id)).returning();
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return await db.update(products).set({ status: 'Deleted' }).where(eq(products.id, id)).returning();
      }
      throw e;
    }
  });

  // --- Employees IPC ---
  ipcMain.handle('get-employees-paginated', async (event, params: any) => {
    const { page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'id', sortOrder = 'desc' } = params || {};
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          like(employees.name, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.phone, `%${search}%`)
        )
      );
    }
    
    if (role && role !== 'All Roles' && role !== 'Role') {
      conditions.push(eq(employees.role, role));
    }

    if (status && status !== 'All Status' && status !== 'Status') {
      conditions.push(eq(employees.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    let orderClause = desc(employees.id);
    let column: any = employees.id;
    if (sortBy === 'name') column = employees.name;
    if (sortBy === 'role') column = employees.role;
    if (sortBy === 'status') column = employees.status;
    if (sortBy === 'discountLimit') column = employees.discountLimit;

    if (sortOrder === 'asc') {
      orderClause = asc(column);
    } else {
      orderClause = desc(column);
    }

    const data = await db.select().from(employees)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
      
    const total = countResult[0].count;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  });

  ipcMain.handle('get-employees', async (event, search?: string) => {
    if (search) {
      return await db.select().from(employees).where(
        or(
          like(employees.name, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.phone, `%${search}%`)
        )
      ).orderBy(asc(employees.name));
    }
    return await db.select().from(employees).orderBy(asc(employees.name));
  });

  ipcMain.handle('get-employee', async (event, id: number) => {
    const res = await db.select().from(employees).where(eq(employees.id, id));
    return res[0] || null;
  });

  ipcMain.handle('add-employee', async (event, data) => {
    return await db.insert(employees).values(data).returning();
  });

  ipcMain.handle('update-employee', async (event, id, data) => {
    return await db.update(employees).set(data).where(eq(employees.id, id)).returning();
  });

  ipcMain.handle('delete-employee', async (event, id) => {
    return await db.delete(employees).where(eq(employees.id, id)).returning();
  });

  ipcMain.handle('delete-products', async (event, ids: number[]) => {
    try {
      return await db.delete(products).where(inArray(products.id, ids)).returning();
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return await db.update(products).set({ status: 'Deleted' }).where(inArray(products.id, ids)).returning();
      }
      throw e;
    }
  });

  ipcMain.handle('get-product', async (event, id: number) => {
    const res = await db.select().from(products).where(eq(products.id, id));
    return res[0] || null;
  });

  // --- Image Handling IPC ---
  ipcMain.handle('save-product-images', async (event, images: { base64Data: string; filename: string }[]) => {
    const imagesDir = join(app.getPath('userData'), 'product_images');
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const savedPaths: string[] = [];
    
    for (const img of images) {
      // img.base64Data is expected to be "data:image/jpeg;base64,/9j/4AA..."
      const matches = img.base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageBuffer = Buffer.from(matches[2], 'base64');
        const uniqueFilename = `${Date.now()}-${img.filename}`;
        const filePath = join(imagesDir, uniqueFilename);
        
        fs.writeFileSync(filePath, imageBuffer);
        // We can serve files using a custom protocol like atom:// or just use file:// explicitly
        savedPaths.push(`local://${filePath}`);
      }
    }
    
    return savedPaths; // Return file URIs
  });
  // --- POS / Checkout IPC ---
  ipcMain.handle('process-checkout', async (event, payload) => {
    // payload: { employeeId, totalAmount, discountAmount, items: [{ productId, quantity, priceAtTime }] }
    try {
      // In real-world, wrap in transaction. better-sqlite3 supports transactions via db.transaction()
      const newSale = await db.insert(sales).values({
        totalAmount: payload.totalAmount,
        discountAmount: payload.discountAmount,
        employeeId: payload.employeeId
      }).returning();
      
      const saleId = newSale[0].id;
      
      for (const item of payload.items) {
        await db.insert(saleItems).values({
          saleId: saleId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime
        });
        
        // Decrement stock
        await db.update(products)
          .set({ stock: sql`stock - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      return { success: true, saleId };
    } catch (e) {
      console.error(e);
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle('get-sales-paginated', async (event, params: any) => {
    const { page = 1, limit = 10 } = params || {};
    const offset = (page - 1) * limit;
    
    const dbSales = await db.select({
      id: sales.id,
      totalAmount: sales.totalAmount,
      discountAmount: sales.discountAmount,
      createdAt: sales.createdAt,
      employeeName: employees.name,
    })
    .from(sales)
    .leftJoin(employees, eq(sales.employeeId, employees.id))
    .orderBy(desc(sales.createdAt))
    .limit(limit)
    .offset(offset);

    let data: any[] = [];
    if (dbSales.length > 0) {
      const saleIds = dbSales.map(s => s.id);
      
      const allItems = await db.select({
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        productName: products.name,
        quantity: saleItems.quantity,
        priceAtTime: saleItems.priceAtTime
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(inArray(saleItems.saleId, saleIds));

      data = dbSales.map(s => {
        const items = allItems.filter(i => i.saleId === s.id);
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
        
        let discountPercentage = 0;
        if (s.discountAmount && s.discountAmount > 0 && subtotal > 0) {
          discountPercentage = Math.round((s.discountAmount / subtotal) * 100);
        }

        return {
          ...s,
          items,
          discountPercentage
        };
      });
    }

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(sales);
    const total = countResult[0].count;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  });

  ipcMain.handle('get-all-sales-for-export', async () => {
    const dbSales = await db.select({
      id: sales.id,
      totalAmount: sales.totalAmount,
      discountAmount: sales.discountAmount,
      createdAt: sales.createdAt,
      employeeName: employees.name,
    })
    .from(sales)
    .leftJoin(employees, eq(sales.employeeId, employees.id))
    .orderBy(desc(sales.createdAt));

    let data: any[] = [];
    if (dbSales.length > 0) {
      const saleIds = dbSales.map(s => s.id);
      
      const allItems = await db.select({
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        productName: products.name,
        quantity: saleItems.quantity,
        priceAtTime: saleItems.priceAtTime
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(inArray(saleItems.saleId, saleIds));

      data = dbSales.map(s => {
        const items = allItems.filter(i => i.saleId === s.id);
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
        
        let discountPercentage = 0;
        if (s.discountAmount && s.discountAmount > 0 && subtotal > 0) {
          discountPercentage = Math.round((s.discountAmount / subtotal) * 100);
        }

        return {
          ...s,
          items,
          discountPercentage
        };
      });
    }

    return data;
  });

  ipcMain.handle('get-dashboard-stats', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Total sales today
    const salesData = await db.select({
      total: sql`SUM(total_amount)`,
      count: sql`COUNT(id)`
    }).from(sales).where(like(sales.createdAt, `${today}%`));

    // Low stock count and items
    const lowStockItems = await db.select().from(products).where(and(sql`stock <= low_stock_alert`, sql`status != 'Deleted'`));
    const lowStockCount = lowStockItems.length;
    
    // Active staff count
    const staffData = await db.select({
      count: sql`COUNT(id)`
    }).from(employees).where(eq(employees.status, 'Active'));

    return {
      totalSales: salesData[0]?.total || 0,
      transactions: salesData[0]?.count || 0,
      lowStockCount,
      activeStaff: staffData[0]?.count || 0,
      lowStockItems
    };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  protocol.handle('local', (request) => {
    return net.fetch('file://' + request.url.slice('local://'.length));
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
