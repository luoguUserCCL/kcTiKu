import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllPools, 
  createPool,
  initializeDefaultPools
} from '@/lib/storage';

// 初始化默认题目池
initializeDefaultPools();

// 获取所有题目池
export async function GET() {
  try {
    const pools = getAllPools();
    return NextResponse.json(pools);
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json({ error: '获取题目池失败' }, { status: 500 });
  }
}

// 创建题目池
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '题目池名称不能为空' }, { status: 400 });
    }

    const pool = createPool(name, description);
    return NextResponse.json(pool, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pool:', error);
    if (error.message === '题目池名称已存在') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '创建题目池失败' }, { status: 500 });
  }
}
