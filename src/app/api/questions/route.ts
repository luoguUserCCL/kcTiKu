import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, getQuestionsByPool, createQuestion } from '@/lib/storage';

// 获取题目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    const excludePoolId = searchParams.get('excludePoolId');
    const limit = searchParams.get('limit');

    let questions;
    
    if (poolId) {
      questions = getQuestionsByPool(poolId);
    } else {
      questions = getAllQuestions(excludePoolId || undefined);
    }

    // 添加题目池信息
    const pools = getAllQuestions().reduce((acc, q) => {
      // @ts-ignore - 我们会在下面添加pool信息
      if (!acc[q.poolId]) {
        // 从其他地方获取pool名称需要额外处理
      }
      return acc;
    }, {} as Record<string, string>);

    // 随机打乱并限制数量
    if (!poolId) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    if (limit) {
      questions = questions.slice(0, parseInt(limit));
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: '获取题目失败' }, { status: 500 });
  }
}

// 创建题目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, options, answer, poolId, number } = body;

    if (!content || !options || !answer || !poolId) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const question = createQuestion({
      content,
      options,
      answer,
      poolId,
      number
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    if (error.message === '题目编号在该题目池中已存在') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '创建题目失败' }, { status: 500 });
  }
}
