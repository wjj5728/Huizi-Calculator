import { NextRequest, NextResponse } from 'next/server';
import { loadInputs, createTableIfNotExists } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const postgresUrl = process.env.POSTGRES_URL;

    if (!supabaseUrl && !supabaseAnonKey && !postgresUrl) {
      return NextResponse.json(
        { 
          inputs: null,
          message: 'Database not configured.'
        }
      );
    }

    // 确保表存在（仅对 PostgreSQL 直接连接）
    if (postgresUrl && !supabaseUrl) {
      await createTableIfNotExists();
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const inputs = await loadInputs(sessionId);

    if (!inputs) {
      return NextResponse.json({ inputs: null });
    }

    return NextResponse.json({ inputs });
  } catch (error) {
    console.error('Error loading inputs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 如果是连接错误，返回更友好的消息
    if (errorMessage.includes('missing_connection_string') || errorMessage.includes('POSTGRES_URL')) {
      return NextResponse.json(
        { 
          inputs: null,
          message: 'Database not configured.'
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load inputs',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
