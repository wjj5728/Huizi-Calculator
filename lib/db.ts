// 支持 Supabase 和 Vercel Postgres/标准 PostgreSQL
import { CalculatorInputs } from './types';

let supabaseClient: any = null;
let sql: any = null;
let isVercelPostgres = false;
let useSupabase = false;

// 初始化数据库连接
function initDb() {
  // 优先使用 Supabase（如果配置了 SUPABASE_URL）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    // 使用 Supabase 客户端
    try {
      const { createClient } = require('@supabase/supabase-js');
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      useSupabase = true;
      return;
    } catch (error) {
      console.error('Failed to load @supabase/supabase-js:', error);
      throw error;
    }
  }

  // 回退到 PostgreSQL 连接
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL or SUPABASE_URL environment variable is not set');
  }

  const url = process.env.POSTGRES_URL.toLowerCase();
  
  // 检测是否为 Vercel Postgres（使用 HTTP API）
  if (url.includes('vercel') || url.includes('pooler.supabase.com')) {
    // 使用 Vercel Postgres
    try {
      const { sql: vercelSql } = require('@vercel/postgres');
      sql = vercelSql;
      isVercelPostgres = true;
    } catch (error) {
      console.error('Failed to load @vercel/postgres:', error);
      throw error;
    }
  } else if (url.includes('neon.tech')) {
    // 使用 Neon Serverless 客户端（推荐）
    try {
      const { neon } = require('@neondatabase/serverless');
      sql = neon(process.env.POSTGRES_URL);
      isVercelPostgres = false;
    } catch (error) {
      console.error('Failed to load @neondatabase/serverless:', error);
      throw error;
    }
  } else {
    // 使用标准 PostgreSQL 客户端（其他数据库）
    try {
      const postgres = require('postgres');
      // Supabase 和其他标准 PostgreSQL 需要 SSL
      const needsSSL = url.includes('supabase') || url.includes('sslmode=require');
      sql = postgres(process.env.POSTGRES_URL, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
        ssl: needsSSL ? 'require' : false,
      });
      isVercelPostgres = false;
    } catch (error) {
      console.error('Failed to initialize postgres client:', error);
      throw error;
    }
  }
}

// 延迟初始化
function getDb() {
  if (!supabaseClient && !sql) {
    initDb();
  }
  return { supabaseClient, sql, useSupabase, isVercelPostgres };
}

export async function saveInputs(sessionId: string, inputs: CalculatorInputs): Promise<void> {
  const { supabaseClient, sql, useSupabase, isVercelPostgres } = getDb();
  const { totalPeople, baseMoney, bidType, firstBid, bidDecrease, customBids } = inputs;

  if (useSupabase && supabaseClient) {
    // 使用 Supabase 客户端
    const { error } = await supabaseClient
      .from('calculator_inputs')
      .upsert({
        session_id: sessionId,
        total_people: totalPeople,
        base_money: baseMoney,
        bid_type: bidType,
        first_bid: firstBid ?? null,
        bid_decrease: bidDecrease ?? null,
        custom_bids: customBids || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });

    if (error) {
      throw error;
    }
    return;
  }

  // 使用 PostgreSQL 连接
  const db = sql;
  
  // 先尝试更新
  const updateResult = await db`
    UPDATE calculator_inputs
    SET total_people = ${totalPeople},
        base_money = ${baseMoney},
        bid_type = ${bidType},
        first_bid = ${firstBid ?? null},
        bid_decrease = ${bidDecrease ?? null},
        custom_bids = ${customBids ? JSON.stringify(customBids) : null}::jsonb,
        updated_at = NOW()
    WHERE session_id = ${sessionId}
  `;

  // 如果没有更新任何行，则插入新记录
  // Neon serverless 返回格式不同，需要特殊处理
  let rowCount = 0;
  if (isVercelPostgres) {
    rowCount = updateResult.rowCount || 0;
  } else if (useSupabase) {
    // Supabase 已在 upsert 中处理
    return;
  } else {
    // Neon serverless 和标准 postgres
    rowCount = updateResult.count || updateResult.rowCount || 0;
  }
  
  if (rowCount === 0) {
    await db`
      INSERT INTO calculator_inputs (session_id, total_people, base_money, bid_type, first_bid, bid_decrease, custom_bids, updated_at)
      VALUES (${sessionId}, ${totalPeople}, ${baseMoney}, ${bidType}, ${firstBid ?? null}, ${bidDecrease ?? null}, ${customBids ? JSON.stringify(customBids) : null}::jsonb, NOW())
    `;
  }
}

export async function loadInputs(sessionId: string): Promise<CalculatorInputs | null> {
  const { supabaseClient, sql, useSupabase, isVercelPostgres } = getDb();

  if (useSupabase && supabaseClient) {
    // 使用 Supabase 客户端
    const { data, error } = await supabaseClient
      .from('calculator_inputs')
      .select('total_people, base_money, bid_type, first_bid, bid_decrease, custom_bids')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      totalPeople: data.total_people,
      baseMoney: data.base_money,
      bidType: data.bid_type as 'fixed' | 'custom',
      firstBid: data.first_bid ?? undefined,
      bidDecrease: data.bid_decrease ?? undefined,
      customBids: data.custom_bids as number[] | undefined,
    };
  }

  // 使用 PostgreSQL 连接
  const db = sql;
  const result = await db`
    SELECT total_people, base_money, bid_type, first_bid, bid_decrease, custom_bids
    FROM calculator_inputs
    WHERE session_id = ${sessionId}
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  // 处理不同客户端的返回格式
  let rows: any[];
  if (isVercelPostgres) {
    rows = result.rows || [];
  } else if (useSupabase) {
    // Supabase 已在上面处理
    return null;
  } else {
    // Neon serverless 和标准 postgres
    rows = Array.isArray(result) ? result : (result.rows || []);
  }
  
  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  let customBids: number[] | undefined;
  
  if (row.custom_bids) {
    if (Array.isArray(row.custom_bids)) {
      customBids = row.custom_bids as number[];
    } else if (typeof row.custom_bids === 'string') {
      customBids = JSON.parse(row.custom_bids) as number[];
    }
  }

  return {
    totalPeople: row.total_people as number,
    baseMoney: row.base_money as number,
    bidType: row.bid_type as 'fixed' | 'custom',
    firstBid: (row.first_bid as number | null) ?? undefined,
    bidDecrease: (row.bid_decrease as number | null) ?? undefined,
    customBids,
  };
}

export async function createTableIfNotExists(): Promise<void> {
  const { supabaseClient, sql, useSupabase } = getDb();

  if (useSupabase && supabaseClient) {
    // Supabase 表需要通过 SQL Editor 手动创建，或使用 migration
    // 这里只检查表是否存在，如果不存在会返回错误
    // 表创建请参考 database-init.sql
    return;
  }

  // 使用 PostgreSQL 连接
  const db = sql;
  await db`
    CREATE TABLE IF NOT EXISTS calculator_inputs (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      total_people INTEGER NOT NULL,
      base_money INTEGER NOT NULL,
      bid_type VARCHAR(20) NOT NULL,
      first_bid INTEGER,
      bid_decrease INTEGER,
      custom_bids JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// 导出查询函数供 API 路由使用
export async function listAllInputs() {
  const { supabaseClient, sql, useSupabase, isVercelPostgres } = getDb();

  if (useSupabase && supabaseClient) {
    // 使用 Supabase 客户端
    const { data, error } = await supabaseClient
      .from('calculator_inputs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return data || [];
  }

  // 使用 PostgreSQL 连接
  const db = sql;
  const result = await db`
    SELECT 
      id,
      session_id,
      total_people,
      base_money,
      bid_type,
      first_bid,
      bid_decrease,
      custom_bids,
      created_at,
      updated_at
    FROM calculator_inputs
    ORDER BY updated_at DESC
    LIMIT 50
  `;
  
  // 调试日志
  console.log('listAllInputs result type:', typeof result, 'isArray:', Array.isArray(result));
  if (!Array.isArray(result) && result) {
    console.log('result keys:', Object.keys(result));
  }
  
  // 处理不同客户端返回格式
  if (isVercelPostgres) {
    return result.rows || [];
  } else if (useSupabase) {
    // Supabase 已在上面处理
    return [];
  } else {
    // Neon serverless (@neondatabase/serverless) 直接返回数组
    // 标准 postgres 可能返回对象 { rows: [...] }
    if (Array.isArray(result)) {
      console.log('Returning array result, length:', result.length);
      return result;
    }
    // 标准 postgres 返回 { rows: [...] }
    const rows = result.rows || [];
    console.log('Returning rows from object, length:', rows.length);
    return rows;
  }
}

// 获取所有唯一的 session_id 列表
export async function listAllSessionIds() {
  const { supabaseClient, sql, useSupabase, isVercelPostgres } = getDb();

  if (useSupabase && supabaseClient) {
    // 使用 Supabase 客户端
    const { data, error } = await supabaseClient
      .from('calculator_inputs')
      .select('session_id')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 去重并返回
    const uniqueIds = [...new Set((data || []).map((row: any) => row.session_id))];
    return uniqueIds;
  }

  // 使用 PostgreSQL 连接
  const db = sql;
  const result = await db`
    SELECT DISTINCT session_id
    FROM calculator_inputs
    ORDER BY session_id
  `;
  
  // 处理不同客户端返回格式
  let rows: any[];
  if (isVercelPostgres) {
    rows = result.rows || [];
  } else {
    rows = Array.isArray(result) ? result : (result.rows || []);
  }
  
  // 处理不同格式的返回
  const ids: string[] = [];
  for (const row of rows) {
    if (typeof row === 'string') {
      ids.push(row);
    } else if (row && typeof row === 'object') {
      const id = row.session_id;
      if (id && typeof id === 'string') {
        ids.push(id);
      }
    }
  }
  
  // 去重并排序
  return [...new Set(ids)].sort();
}