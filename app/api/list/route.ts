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
        message: 'Please configure SUPABASE_URL and SUPABASE_ANON_KEY, or POSTGRES_URL. Please configure it to use database features.',
        count: 0,
        data: []
      });
    }

    // 确保表存在（仅对 PostgreSQL 直接连接）
    if (postgresUrl && !supabaseUrl) {
      await createTableIfNotExists();
    }

    // 使用 db.ts 中的查询函数
    const { listAllInputs } = await import('@/lib/db');
    const result = await listAllInputs();

    // listAllInputs 已经处理了不同客户端的返回格式，直接使用
    const rows = Array.isArray(result) ? result : [];
    
    // 调试日志
    console.log('API /list - result type:', typeof result, 'isArray:', Array.isArray(result), 'rows length:', rows.length);

    return NextResponse.json({ 
      success: true,
      count: rows.length,
      data: rows 
    });
  } catch (error) {
    console.error('Error listing inputs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 如果是连接错误，返回更友好的消息
    if (errorMessage.includes('missing_connection_string') || 
        errorMessage.includes('POSTGRES_URL') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND')) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: '无法连接到数据库。请检查：1) POSTGRES_URL 环境变量是否正确配置 2) 连接字符串格式是否正确 3) 网络连接是否正常。',
        count: 0,
        data: [],
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to list inputs',
        message: errorMessage,
        count: 0,
        data: [],
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
