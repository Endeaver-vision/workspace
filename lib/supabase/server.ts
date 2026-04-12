// PostgreSQL server client - mimics Supabase API for server-side operations
import { Pool } from 'pg'
import { Database } from '@/types/database.types'

// PostgreSQL connection pool (server-side only)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://officeapps:officeapps123@localhost:5432/officeapps',
})

class QueryBuilder {
  private tableName: string;
  private selectColumns: string = '*';
  private whereConditions: { column: string; value: any }[] = [];
  private orderByColumn: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private orConditions: string | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, value });
    return this;
  }

  or(conditions: string) {
    this.orConditions = conditions;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async insert(data: Record<string, any> | Record<string, any>[]) {
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return { data: null, error: null };

    const columns = Object.keys(rows[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    rows.forEach((row, rowIndex) => {
      const rowPlaceholders: string[] = [];
      columns.forEach((col, colIndex) => {
        values.push(row[col]);
        rowPlaceholders.push(`$${rowIndex * columns.length + colIndex + 1}`);
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return { data: result.rows, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async update(data: Record<string, any>) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    let query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')}`;

    if (this.whereConditions.length > 0) {
      const whereClauses = this.whereConditions.map((cond) => {
        values.push(cond.value);
        return `${cond.column} = $${paramIndex++}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' RETURNING *';

    try {
      const result = await pool.query(query, values);
      return { data: result.rows, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async delete() {
    let query = `DELETE FROM ${this.tableName}`;
    const values: any[] = [];
    let paramIndex = 1;

    if (this.whereConditions.length > 0) {
      const whereClauses = this.whereConditions.map((cond) => {
        values.push(cond.value);
        return `${cond.column} = $${paramIndex++}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' RETURNING *';

    try {
      const result = await pool.query(query, values);
      return { data: result.rows, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async single() {
    this.limitCount = 1;
    const result = await this.execute();
    if (result.error) return result;
    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: null
    };
  }

  private async execute() {
    let query = `SELECT ${this.selectColumns} FROM ${this.tableName}`;
    const values: any[] = [];
    let paramIndex = 1;

    const whereParts: string[] = [];

    if (this.whereConditions.length > 0) {
      this.whereConditions.forEach((cond) => {
        values.push(cond.value);
        whereParts.push(`${cond.column} = $${paramIndex++}`);
      });
    }

    if (this.orConditions) {
      const orParts = this.orConditions.split(',').map(part => {
        const [column, operator, value] = part.split('.');
        if (operator === 'ilike') {
          values.push(value);
          return `${column} ILIKE $${paramIndex++}`;
        }
        return '';
      }).filter(Boolean);

      if (orParts.length > 0) {
        whereParts.push(`(${orParts.join(' OR ')})`);
      }
    }

    if (whereParts.length > 0) {
      query += ` WHERE ${whereParts.join(' AND ')}`;
    }

    if (this.orderByColumn) {
      query += ` ORDER BY ${this.orderByColumn} ${this.orderAscending ? 'ASC' : 'DESC'}`;
    }

    if (this.limitCount !== null) {
      query += ` LIMIT ${this.limitCount}`;
    }

    try {
      const result = await pool.query(query, values);
      return { data: result.rows, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  then(resolve: (value: { data: any; error: any }) => void, reject?: (reason?: any) => void) {
    return this.execute().then(resolve, reject);
  }
}

class PostgresServerClient {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  }

  async query(text: string, values?: any[]) {
    try {
      const result = await pool.query(text, values);
      return { data: result.rows, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

export async function createClient() {
  return new PostgresServerClient();
}

// Export pool for direct access if needed
export { pool };
