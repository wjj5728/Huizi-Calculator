import { NextRequest, NextResponse } from 'next/server';
import { createTableIfNotExists } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const postgresUrl = process.env.POSTGRES_URL;

    if (!supabaseUrl && !supabaseAnonKey && !postgresUrl) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        message: 'Please configure SUPABASE_URL and SUPABASE_ANON_KEY, or POSTGRES_URL.',
        ids: []
      });
    }

    // 确保表存在（仅对 PostgreSQL 直接连接）
    if (postgresUrl && !supabaseUrl) {
      await createTableIfNotExists();
    }

    // 获取所有唯一的 session_id
    const { listAllSessionIds } = await import('@/lib/db');
    const ids = await listAllSessionIds();

    return NextResponse.json({ 
      success: true,
      ids: ids || []
    });
  } catch (error) {
    console.error('Error listing session IDs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to list session IDs',
        message: errorMessage,
        ids: []
      },
      { status: 500 }
    );
  }
}
