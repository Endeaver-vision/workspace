import { NextRequest } from 'next/server'
import { pool } from '@/lib/supabase/server'

// POST /api/db - Handle database operations from client-side
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, table, data, select, where, order, limit, or } = body

    if (!table) {
      return Response.json({ data: null, error: { message: 'Table name is required' } }, { status: 400 })
    }

    // Validate table name to prevent SQL injection (whitelist approach)
    const allowedTables = [
      'profiles', 'workspaces', 'workspace_members', 'pages', 'sops',
      'sop_categories', 'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers',
      'certificates', 'notifications', 'api_keys', 'databases',
      'database_properties', 'database_rows', 'page_properties'
    ]

    if (!allowedTables.includes(table)) {
      return Response.json({ data: null, error: { message: 'Invalid table name' } }, { status: 400 })
    }

    switch (action) {
      case 'select':
        return handleSelect(table, select, where, order, limit, or)
      case 'insert':
        return handleInsert(table, data)
      case 'update':
        return handleUpdate(table, data, where)
      case 'delete':
        return handleDelete(table, where)
      default:
        return Response.json({ data: null, error: { message: 'Invalid action' } }, { status: 400 })
    }
  } catch (err: any) {
    return Response.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}

async function handleSelect(
  table: string,
  selectColumns: string = '*',
  where: { column: string; value: any; operator?: string }[] = [],
  order: { column: string; ascending: boolean } | null = null,
  limitCount: number | null = null,
  orConditions: string | null = null
) {
  let query = `SELECT ${selectColumns} FROM ${table}`
  const values: any[] = []
  let paramIndex = 1
  const whereParts: string[] = []

  // Handle eq conditions
  if (where && where.length > 0) {
    where.forEach((cond) => {
      values.push(cond.value)
      whereParts.push(`${cond.column} = $${paramIndex++}`)
    })
  }

  // Handle or conditions (format: "column.ilike.%value%,column2.ilike.%value2%")
  if (orConditions) {
    const orParts = orConditions.split(',').map(part => {
      const [column, operator, value] = part.split('.')
      if (operator === 'ilike') {
        values.push(value)
        return `${column} ILIKE $${paramIndex++}`
      }
      return ''
    }).filter(Boolean)

    if (orParts.length > 0) {
      whereParts.push(`(${orParts.join(' OR ')})`)
    }
  }

  if (whereParts.length > 0) {
    query += ` WHERE ${whereParts.join(' AND ')}`
  }

  if (order) {
    query += ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}`
  }

  if (limitCount !== null) {
    query += ` LIMIT ${limitCount}`
  }

  try {
    const result = await pool.query(query, values)
    return Response.json({ data: result.rows, error: null })
  } catch (err: any) {
    return Response.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}

async function handleInsert(table: string, data: Record<string, any> | Record<string, any>[]) {
  const rows = Array.isArray(data) ? data : [data]
  if (rows.length === 0) {
    return Response.json({ data: null, error: null })
  }

  const columns = Object.keys(rows[0])
  const values: any[] = []
  const placeholders: string[] = []

  rows.forEach((row, rowIndex) => {
    const rowPlaceholders: string[] = []
    columns.forEach((col, colIndex) => {
      values.push(row[col])
      rowPlaceholders.push(`$${rowIndex * columns.length + colIndex + 1}`)
    })
    placeholders.push(`(${rowPlaceholders.join(', ')})`)
  })

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    RETURNING *
  `

  try {
    const result = await pool.query(query, values)
    return Response.json({ data: result.rows, error: null })
  } catch (err: any) {
    return Response.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}

async function handleUpdate(
  table: string,
  data: Record<string, any>,
  where: { column: string; value: any }[] = []
) {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(data).forEach(([key, value]) => {
    setClauses.push(`${key} = $${paramIndex}`)
    values.push(value)
    paramIndex++
  })

  let query = `UPDATE ${table} SET ${setClauses.join(', ')}`

  if (where && where.length > 0) {
    const whereClauses = where.map((cond) => {
      values.push(cond.value)
      return `${cond.column} = $${paramIndex++}`
    })
    query += ` WHERE ${whereClauses.join(' AND ')}`
  }

  query += ' RETURNING *'

  try {
    const result = await pool.query(query, values)
    return Response.json({ data: result.rows, error: null })
  } catch (err: any) {
    return Response.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}

async function handleDelete(table: string, where: { column: string; value: any }[] = []) {
  let query = `DELETE FROM ${table}`
  const values: any[] = []
  let paramIndex = 1

  if (where && where.length > 0) {
    const whereClauses = where.map((cond) => {
      values.push(cond.value)
      return `${cond.column} = $${paramIndex++}`
    })
    query += ` WHERE ${whereClauses.join(' AND ')}`
  }

  query += ' RETURNING *'

  try {
    const result = await pool.query(query, values)
    return Response.json({ data: result.rows, error: null })
  } catch (err: any) {
    return Response.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}
