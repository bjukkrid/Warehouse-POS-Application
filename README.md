# Warehouse & POS Application

A modern desktop application for inventory management and point-of-sale (POS), built to run natively on Mac and Windows using Electron.

## 🌟 Key Features

- **📦 Inventory Management**: Add, edit, and organize products. Automatically compresses product images to save disk space and loads dynamically generated categories. Features image zooming and soft-deletion protection.
- **💳 Point of Sale (POS)**: Seamlessly checkout products, apply discounts, and generate order totals through an intuitive cart interface.
- **📊 Dashboard & Reports**: View live business statistics (total revenue, product counts, out-of-stock warnings) and export comprehensive paginated sales reports to Excel (`.xlsx`), with an expandable breakdown for specific sold products.
- **👥 Employee Management**: Add and manage employee details, roles, and status through a built-in staff directory.
- **💾 Local SQLite Database**: All data is securely stored locally on the machine for offline capability without needing a central server. Handles complex table relations natively.

## 🛠 Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) (Desktop runtime)
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `better-sqlite3`) and [Drizzle ORM](https://orm.drizzle.team/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: `browser-image-compression` (Image sizing), `react-router-dom` (Routing), `xlsx` (Excel exports)

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed along with `npm`.

### Installation

1. Clone the repository.
2. Install the required dependencies:
   ```bash
   npm install
   ```

### Running Locally

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

_Note: In development, the application will automatically launch an Electron window and open the Chrome DevTools so you can inspect network calls or UI elements._

### Building for Production

To package the app for distribution:

```bash
npm run build
```

## 🗄 Database Management

The application creates and connects to a local persistent SQLite database (`warehouse.db`).

- **In Development**: The database is stored inside the local project folder.
- **In Production**: The database is saved inside the official AppData / Application Support directory for the user's OS:
  - **Mac**: `~/Library/Application Support/warehouse-app/warehouse.db`
  - **Windows**: `%APPDATA%\warehouse-app\warehouse.db`

_Note: We utilize Write-Ahead Logging (WAL) in SQLite to resolve busy-lock issues during concurrent read/write actions. You may notice `warehouse.db-wal` or `warehouse.db-shm` files automatically generated in the same directory._
