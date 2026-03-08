import { db } from '../database/db';
import { employees } from '../database/schema.js';
import { sql, like, eq, desc, asc, and, or } from 'drizzle-orm';

export class EmployeeRepository {
  async getEmployeesPaginated(params: any) {
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
  }

  async getEmployees(search?: string) {
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
  }

  async getEmployee(id: number) {
    const res = await db.select().from(employees).where(eq(employees.id, id));
    return res[0] || null;
  }

  async addEmployee(data: any) {
    return await db.insert(employees).values(data).returning();
  }

  async updateEmployee(id: number, data: any) {
    return await db.update(employees).set(data).where(eq(employees.id, id)).returning();
  }

  async deleteEmployee(id: number) {
    return await db.delete(employees).where(eq(employees.id, id)).returning();
  }
}
