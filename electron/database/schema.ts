import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull().default('Uncategorized'),
  brand: text('brand'),
  description: text('description'),
  basePrice: real('base_price').notNull().default(0),
  cost: real('cost').notNull().default(0),
  sku: text('sku').unique(),
  barcode: text('barcode'),
  stock: integer('stock').notNull().default(0),
  lowStockAlert: integer('low_stock_alert').notNull().default(10),
  status: text('status').notNull().default('Published'),
  images: text('images'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').notNull().default('Cashier'),
  passcode: text('passcode').notNull(),
  phone: text('phone'),
  email: text('email'),
  discountLimit: real('discount_limit').default(0),
  status: text('status').notNull().default('Active'),
});

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  totalAmount: real('total_amount').notNull(),
  discountAmount: real('discount_amount').default(0),
  employeeId: integer('employee_id').references(() => employees.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').references(() => sales.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceAtTime: real('price_at_time').notNull(),
});
