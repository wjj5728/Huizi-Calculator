import { NextRequest, NextResponse } from 'next/server';
import { saveInputs, createTableIfNotExists } from '@/lib/db';
import { CalculatorInputs } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 检查数据库连接
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const postgresUrl = process.env.POSTGRES_URL;

    if (!supabaseUrl && !supabaseAnonKey && !postgresUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database not configured',
          message: 'Please configure SUPABASE_URL and SUPABASE_ANON_KEY, or POSTGRES_URL.'
        },
        { status: 503 }
      );
    }

    // 确保表存在（仅对 PostgreSQL 直接连接）
    if (postgresUrl && !supabaseUrl) {
      await createTableIfNotExists();
    }

    const body = await request.json();
    const { sessionId, inputs } = body;

    if (!sessionId || !inputs) {
      return NextResponse.json(
        { error: 'Missing sessionId or inputs' },
        { status: 400 }
      );
    }

    const validatedInputs: CalculatorInputs = {
      totalPeople: Number(inputs.totalPeople),
      baseMoney: Number(inputs.baseMoney),
      bidType: inputs.bidType,
      firstBid: inputs.firstBid ? Number(inputs.firstBid) : undefined,
      bidDecrease: inputs.bidDecrease ? Number(inputs.bidDecrease) : undefined,
      customBids: inputs.customBids || undefined,
    };

    await saveInputs(sessionId, validatedInputs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving inputs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    // 如果是连接错误，返回更友好的消息
    if (errorMessage.includes('missing_connection_string') || 
        errorMessage.includes('POSTGRES_URL') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          message: '无法连接到数据库。请检查：1) POSTGRES_URL 环境变量是否正确配置 2) 连接字符串格式是否正确 3) 网络连接是否正常。',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save inputs',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
