import { db } from '../database/db';
import { products } from '../database/schema.js';
import { sql, like, eq, desc, asc, and, or, inArray } from 'drizzle-orm';

export class ProductRepository {
  async getProducts(search?: string) {
    if (search) {
      return await db.select().from(products)
        .where(and(like(products.name, `%${search}%`), sql`status != 'Deleted'`));
    }
    return await db.select().from(products)
      .where(sql`status != 'Deleted'`)
      .orderBy(desc(products.id));
  }

  async getProduct(id: number) {
    const res = await db.select().from(products).where(eq(products.id, id));
    return res[0] || null;
  }

  async getProductsPaginated(params: any) {
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
  }

  async getLowStockItems() {
    return await db.select().from(products)
      .where(and(sql`stock <= low_stock_alert`, sql`status != 'Deleted'`));
  }

  async addProduct(data: any) {
    return await db.insert(products).values(data).returning();
  }

  async updateProduct(id: number, data: any) {
    return await db.update(products).set(data).where(eq(products.id, id)).returning();
  }

  async deleteProduct(id: number) {
    try {
      return await db.delete(products).where(eq(products.id, id)).returning();
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return await db.update(products).set({ status: 'Deleted' }).where(eq(products.id, id)).returning();
      }
      throw e;
    }
  }

  async deleteProducts(ids: number[]) {
    // Basic soft delete for multiple items because of potential foreign key constraints
    return await db.update(products).set({ status: 'Deleted' }).where(inArray(products.id, ids)).returning();
  }
}
