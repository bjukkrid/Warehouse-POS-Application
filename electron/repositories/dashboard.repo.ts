import { db } from '../database/db';
import { sales, products, employees } from '../database/schema.js';
import { sql, like, eq, and } from 'drizzle-orm';

export class DashboardRepository {
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Total sales today
    const salesData = await db.select({
      total: sql`SUM(total_amount)`,
      count: sql`COUNT(id)`
    }).from(sales).where(like(sales.createdAt, `${today}%`));

    // Low stock count and items
    const lowStockItems = await db.select().from(products).where(
      and(sql`stock <= low_stock_alert`, sql`status != 'Deleted'`)
    );
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
  }
}
