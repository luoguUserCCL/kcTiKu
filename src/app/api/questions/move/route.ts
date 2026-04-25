import { NextRequest, NextResponse } from 'next/server';
import { moveQuestion, getPoolById, getAllPools, getQuestionsByPool } from '@/lib/storage';

// 移动题目到其他题目池
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, sourcePoolId, targetPoolId, targetNumber } = body;

    if (!questionId || !targetPoolId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 如果没有提供sourcePoolId，需要查找
    let sourcePool = sourcePoolId;
    if (!sourcePool) {
      const pools = getAllPools();
      for (const pool of pools) {
        const questions = getQuestionsByPool(pool.id);
        if (questions.find(q => q.id === questionId)) {
          sourcePool = pool.id;
          break;
        }
      }
    }

    if (!sourcePool) {
      return NextResponse.json({ error: '找不到原题目' }, { status: 404 });
    }

    const question = moveQuestion(questionId, sourcePool, targetPoolId, targetNumber);

    if (!question) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const pool = getPoolById(targetPoolId);

    return NextResponse.json({
      ...question,
      pool: pool ? { id: pool.id, name: pool.name } : null
    });
  } catch (error: any) {
    console.error('Error moving question:', error);
    if (error.message === '目标题目池中已存在相同编号的题目') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '移动题目失败' }, { status: 500 });
  }
}
