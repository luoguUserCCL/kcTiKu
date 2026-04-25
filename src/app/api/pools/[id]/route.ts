import { NextRequest, NextResponse } from 'next/server';
import { 
  getPoolById, 
  getQuestionsByPool, 
  updatePool, 
  deletePool 
} from '@/lib/storage';

// 获取单个题目池
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPoolById(id);

    if (!pool) {
      return NextResponse.json({ error: '题目池不存在' }, { status: 404 });
    }

    const questions = getQuestionsByPool(id);
    
    return NextResponse.json({
      ...pool,
      questions
    });
  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json({ error: '获取题目池失败' }, { status: 500 });
  }
}

// 更新题目池
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const pool = updatePool(id, { name, description });

    if (!pool) {
      return NextResponse.json({ error: '题目池不存在' }, { status: 404 });
    }

    return NextResponse.json(pool);
  } catch (error: any) {
    console.error('Error updating pool:', error);
    if (error.message === '题目池名称已存在') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '更新题目池失败' }, { status: 500 });
  }
}

// 删除题目池
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deletePool(id);

    if (!success) {
      return NextResponse.json({ error: '题目池不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pool:', error);
    return NextResponse.json({ error: '删除题目池失败' }, { status: 500 });
  }
}
