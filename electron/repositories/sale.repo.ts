import { db } from '../database/db';
import { sales, saleItems, products, employees } from '../database/schema.js';
import { sql, eq, desc, inArray } from 'drizzle-orm';

export class SaleRepository {
  async processCheckout(payload: any) {
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
  }

  async getSalesPaginated(params: any) {
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
  }

  async getAllSalesForExport() {
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
  }
}
