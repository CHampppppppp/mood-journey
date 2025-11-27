import { NextRequest, NextResponse } from 'next/server';
import { hasValidSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 验证用户是否已登录
    const authenticated = await hasValidSession();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取请求信息（可选）
    const userAgent = req.headers.get('user-agent') || null;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    // 记录登录日志（异步，不阻塞响应）
    pool
      .query(
        'INSERT INTO login_logs (logged_in_at, user_agent, ip_address) VALUES (NOW(), ?, ?)',
        [userAgent, ipAddress]
      )
      .catch((err) => {
        // 静默失败，不影响用户体验
        console.error('[log-login] Failed to log login', err);
      });

    // 立即返回成功，不等待数据库写入
    return NextResponse.json({ success: true });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('[log-login] Error', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

