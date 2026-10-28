import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient, isAdminConfigured } from './admin';
import { isSupabaseConfigured } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TableStatus {
  exists: boolean;
  count: number;
  error?: string;
}

export interface DatabaseHealthResult {
  isConnected: boolean;
  tablesExist: boolean;
  productCount: number;
  tables?: {
    products: TableStatus;
    categories: TableStatus;
    orders: TableStatus;
    profiles: TableStatus;
  };
  error?: string;
}

export interface SafeQueryResult<T> {
  data: T;
  isFallback: boolean;
  error?: string;
}

// Supabase Database Row Types (mirroring supabase/schema.sql)
export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  blurb: string;
  art: string[];
  colors: string[];
  created_at: string;
}

export interface DbProduct {
  id: number;
  name: string;
  cat: string | null;
  price: number;
  was: number | null;
  art: string;
  colors: string[];
  sizes: string[] | null;
  badge: string | null;
  desc: string;
  feat: string[];
  is_active: boolean;
  created_at: string;
}

export interface DbOrder {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  landmark: string | null;
  delivery_label: string;
  eta: string;
  pay_label: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number;
  fee: number;
  discount: number;
  total: number;
  paystack_ref: string | null;
  note: string | null;
  created_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: number | null;
  name: string;
  price: number;
  qty: number;
  art: string;
  color: string;
  opt: string;
  created_at: string;
}

export const REQUIRED_TABLES = [
  'products',
  'categories',
  'orders',
  'profiles',
] as const;

export type RequiredTableName = (typeof REQUIRED_TABLES)[number];

// ============================================================================
// Core Database Health Check
// ============================================================================

/**
 * Checks database connectivity and verifies if core tables (`products`, `categories`,
 * `orders`, `profiles`) exist and are populated.
 *
 * @param customClient - Optional SupabaseClient to use. Defaults to `createAdminClient()`.
 * @returns Object with `{ isConnected: boolean, tablesExist: boolean, productCount: number, error?: string }`
 */
export async function checkDatabaseHealth(
  customClient?: SupabaseClient
): Promise<DatabaseHealthResult> {
  // 1. Check if environment is configured
  if (!isSupabaseConfigured() && !isAdminConfigured()) {
    return {
      isConnected: false,
      tablesExist: false,
      productCount: 0,
      error: 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and key) are not configured or set to placeholder values.',
    };
  }

  const client = customClient || createAdminClient();

  const tableResults: Record<RequiredTableName, TableStatus> = {
    products: { exists: false, count: 0 },
    categories: { exists: false, count: 0 },
    orders: { exists: false, count: 0 },
    profiles: { exists: false, count: 0 },
  };

  let isConnected = false;
  let connectionError: string | undefined;

  for (const table of REQUIRED_TABLES) {
    try {
      const { data, count, error } = await client
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        // Distinguish network/connection failures from missing table errors
        const errMsg = error.message || '';
        const errCode = (error as any).code || '';

        const isMissingTable =
          errCode === '42P01' || // PostgreSQL: relation does not exist
          errCode === 'PGRST205' || // PostgREST: table not in schema cache
          errMsg.toLowerCase().includes('could not find the table') ||
          errMsg.toLowerCase().includes('relation') ||
          errMsg.toLowerCase().includes('does not exist');

        if (isMissingTable) {
          // Connected to PostgREST successfully, but table is missing
          isConnected = true;
          tableResults[table] = {
            exists: false,
            count: 0,
            error: errMsg,
          };
        } else if (
          errMsg.toLowerCase().includes('fetch failed') ||
          errMsg.toLowerCase().includes('enotfound') ||
          errMsg.toLowerCase().includes('econnrefused') ||
          errMsg.toLowerCase().includes('network')
        ) {
          // Network connection failed
          isConnected = false;
          connectionError = errMsg;
          tableResults[table] = {
            exists: false,
            count: 0,
            error: errMsg,
          };
          break; // Stop querying if network cannot be reached
        } else {
          // Other database error (e.g. RLS permission, bad request), but connection and table exist
          isConnected = true;
          tableResults[table] = {
            exists: true,
            count: count ?? 0,
            error: errMsg,
          };
        }
      } else {
        // Table exists and query succeeded
        isConnected = true;
        const resolvedCount =
          typeof count === 'number'
            ? count
            : Array.isArray(data)
            ? (data as any[]).length
            : 0;
        tableResults[table] = {
          exists: true,
          count: resolvedCount,
        };
      }
    } catch (err: any) {
      isConnected = false;
      connectionError = err?.message || 'Unknown network error';
      tableResults[table] = {
        exists: false,
        count: 0,
        error: connectionError,
      };
      break;
    }
  }

  if (!isConnected) {
    return {
      isConnected: false,
      tablesExist: false,
      productCount: 0,
      tables: tableResults,
      error: connectionError || 'Could not connect to Supabase database',
    };
  }

  const allTablesExist = REQUIRED_TABLES.every((t) => tableResults[t].exists);
  const missingTables = REQUIRED_TABLES.filter((t) => !tableResults[t].exists);
  const productCount = tableResults.products.count;

  let errorMessage: string | undefined;
  if (!allTablesExist) {
    errorMessage = `Database connected, but missing required tables: ${missingTables.join(', ')}`;
  }

  return {
    isConnected: true,
    tablesExist: allTablesExist,
    productCount,
    tables: tableResults,
    error: errorMessage,
  };
}

// ============================================================================
// Helper Utilities for Safe Supabase Server-Side Queries
// ============================================================================

/**
 * Safely executes a Supabase query promise with a default fallback.
 * Catches all runtime errors and returns the fallback if the query fails.
 *
 * @param queryPromise - The Supabase query promise to await.
 * @param fallback - The fallback value to return if the query fails.
 */
export async function safeServerQuery<T>(
  queryPromise: Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await queryPromise;
    if (error || data === null || data === undefined) {
      if (error) {
        console.warn('[Supabase Server Query Error]:', error.message || error);
      }
      return fallback;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase Server Query Exception]:', err);
    return fallback;
  }
}

/**
 * Safely executes a Supabase query generator function, returning structured metadata
 * indicating whether the result came from the database or the fallback.
 *
 * @param queryFn - A function that returns a Supabase query promise.
 * @param fallback - The fallback value if query fails or returns null.
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<SafeQueryResult<T>> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      return {
        data: fallback,
        isFallback: true,
        error: error.message || String(error),
      };
    }
    if (data === null || data === undefined) {
      return {
        data: fallback,
        isFallback: true,
      };
    }
    return {
      data,
      isFallback: false,
    };
  } catch (err: any) {
    return {
      data: fallback,
      isFallback: true,
      error: err?.message || String(err),
    };
  }
}

/**
 * Checks if a specific table exists in the database.
 */
export async function checkTableExists(
  tableName: string,
  customClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = customClient || createAdminClient();
    const { error } = await client.from(tableName).select('*').limit(1);
    if (!error) return true;

    const errMsg = (error.message || '').toLowerCase();
    const errCode = (error as any).code || '';
    if (
      errCode === '42P01' ||
      errCode === 'PGRST205' ||
      errMsg.includes('could not find the table') ||
      errMsg.includes('does not exist')
    ) {
      return false;
    }
    // Any other error (e.g. RLS / 42501) implies table exists
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves the total row count for a given table safely.
 * Returns 0 if the table is empty, missing, or encounters an error.
 */
export async function getTableCount(
  tableName: string,
  customClient?: SupabaseClient
): Promise<number> {
  try {
    const client = customClient || createAdminClient();
    const { count, error, data } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) return 0;
    return typeof count === 'number'
      ? count
      : Array.isArray(data)
      ? (data as any[]).length
      : 0;
  } catch {
    return 0;
  }
}

/**
 * Verifies if all required tables exist in the database and returns a breakdown.
 */
export async function verifyRequiredSchema(
  customClient?: SupabaseClient
): Promise<{
  valid: boolean;
  missingTables: string[];
  details: Record<RequiredTableName, boolean>;
}> {
  const client = customClient || createAdminClient();
  const details: Record<RequiredTableName, boolean> = {
    products: false,
    categories: false,
    orders: false,
    profiles: false,
  };

  const missingTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const exists = await checkTableExists(table, client);
    details[table] = exists;
    if (!exists) {
      missingTables.push(table);
    }
  }

  return {
    valid: missingTables.length === 0,
    missingTables,
    details,
  };
}
