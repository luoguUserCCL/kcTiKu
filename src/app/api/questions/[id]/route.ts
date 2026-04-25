import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuestionsByPool, 
  updateQuestion, 
  deleteQuestion,
  getPoolById
} from '@/lib/storage';

// 获取单个题目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 需要遍历所有题目池找到这个题目
    // 这里我们通过URL参数获取poolId
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    
    if (!poolId) {
      return NextResponse.json({ error: '需要提供poolId参数' }, { status: 400 });
    }
    
    const questions = getQuestionsByPool(poolId);
    const question = questions.find(q => q.id === id);

    if (!question) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const pool = getPoolById(poolId);

    return NextResponse.json({
      ...question,
      pool: pool ? { id: pool.id, name: pool.name } : null
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: '获取题目失败' }, { status: 500 });
  }
}

// 更新题目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, options, answer, number, poolId } = body;

    if (!poolId) {
      return NextResponse.json({ error: '需要提供poolId' }, { status: 400 });
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (options !== undefined) updateData.options = options;
    if (answer !== undefined) updateData.answer = answer;
    if (number !== undefined) updateData.number = number;

    const question = updateQuestion(poolId, id, updateData);

    if (!question) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const pool = getPoolById(poolId);

    return NextResponse.json({
      ...question,
      pool: pool ? { id: pool.id, name: pool.name } : null
    });
  } catch (error: any) {
    console.error('Error updating question:', error);
    if (error.message === '题目编号在该题目池中已存在') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '更新题目失败' }, { status: 500 });
  }
}

// 删除题目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    
    if (!poolId) {
      return NextResponse.json({ error: '需要提供poolId参数' }, { status: 400 });
    }
    
    const success = deleteQuestion(poolId, id);

    if (!success) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: '删除题目失败' }, { status: 500 });
  }
}
