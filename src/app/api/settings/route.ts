import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, verifyQuizPassword } from '@/lib/storage';

// 获取设置
export async function GET() {
  try {
    const settings = getSettings()
    // 不返回密码，只返回是否设置了密码
    return NextResponse.json({
      quizAccess: settings.quizAccess,
      hasPassword: !!settings.quizPassword
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 })
  }
}

// 更新设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizAccess, quizPassword } = body

    if (quizAccess && !['public', 'password'].includes(quizAccess)) {
      return NextResponse.json({ error: '无效的访问模式' }, { status: 400 })
    }

    const updateData: { quizAccess?: string; quizPassword?: string } = {}
    if (quizAccess) updateData.quizAccess = quizAccess
    if (quizPassword !== undefined) updateData.quizPassword = quizPassword

    const settings = updateSettings(updateData)
    return NextResponse.json({
      quizAccess: settings.quizAccess,
      hasPassword: !!settings.quizPassword
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}

// 验证做题密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    const valid = verifyQuizPassword(password)
    if (valid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json({ error: '验证失败' }, { status: 500 })
  }
}
