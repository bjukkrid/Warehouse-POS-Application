import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { join, dirname } from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { db } from './database/db'
import { like, eq, desc, and, or, sql, inArray, asc } from 'drizzle-orm'
import { IPC_EVENTS } from '../shared/ipc-events';
import { registerDashboardHandlers } from './handlers/dashboard.handler';
import { registerProductHandlers } from './handlers/product.handler';
import { registerEmployeeHandlers } from './handlers/employee.handler';
import { registerSaleHandlers } from './handlers/sale.handler';
import { initializeDatabase } from './database/init';

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

  const isTestEnv = process.env.NODE_ENV === 'test';
  const dbName = isTestEnv ? 'test-warehouse.db' : 'warehouse.db';
  initializeDatabase(join(app.getPath('userData'), dbName));


  // --- Image Handling IPC ---
  ipcMain.handle(IPC_EVENTS.SAVE_PRODUCT_IMAGES, async (event, images: { base64Data: string; filename: string }[]) => {
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

  registerProductHandlers();
  registerEmployeeHandlers();
  registerSaleHandlers();
  registerDashboardHandlers();

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
