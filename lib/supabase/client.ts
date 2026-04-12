// PostgreSQL client for browser - mimics Supabase API
// Note: For client-side, we'll use API routes to interact with the database

import { Database } from '@/types/database.types'

class QueryBuilder {
  private tableName: string;
  private selectColumns: string = '*';
  private whereConditions: { column: string; value: any; operator?: string }[] = [];
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
    this.whereConditions.push({ column, value, operator: 'eq' });
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

  private buildParams() {
    return {
      table: this.tableName,
      select: this.selectColumns,
      where: this.whereConditions,
      order: this.orderByColumn ? { column: this.orderByColumn, ascending: this.orderAscending } : null,
      limit: this.limitCount,
      or: this.orConditions,
    };
  }

  async insert(data: Record<string, any> | Record<string, any>[]) {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'insert', table: this.tableName, data }),
    });
    return response.json();
  }

  async update(data: Record<string, any>) {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...this.buildParams(), data }),
    });
    return response.json();
  }

  async delete() {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ...this.buildParams() }),
    });
    return response.json();
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
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'select', ...this.buildParams() }),
    });
    return response.json();
  }

  then(resolve: (value: { data: any; error: any }) => void, reject?: (reason?: any) => void) {
    return this.execute().then(resolve, reject);
  }
}

class PostgresClient {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  }
}

export function createClient() {
  return new PostgresClient();
}
