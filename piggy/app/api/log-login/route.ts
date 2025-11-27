import { NextRequest, NextResponse } from 'next/server';
import { hasValidSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('[LoginLog API] 收到登录日志请求');

    // 验证用户是否已登录
    const authenticated = await hasValidSession();
    if (!authenticated) {
      console.warn('[LoginLog API] 用户未认证，拒绝记录登录日志');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取请求信息（可选）
    const userAgent = req.headers.get('user-agent') || null;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    console.log('[LoginLog API] 记录登录事件:', {
      ip: ipAddress || 'unknown',
      userAgent: userAgent ? userAgent.substring(0, 100) + (userAgent.length > 100 ? '...' : '') : 'unknown',
      timestamp: new Date().toISOString()
    });

    // 同步等待数据库写入，确保能捕获错误
    try {
      await pool.query(
        'INSERT INTO login_logs (logged_in_at, user_agent, ip_address) VALUES (NOW(), ?, ?)',
        [userAgent, ipAddress]
      );
      console.log('[LoginLog API] 登录日志保存成功');
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('[LoginLog API] 数据库写入失败:', dbError);
      // 返回错误信息以便调试
      return NextResponse.json({ 
        success: false, 
        error: 'Database write failed',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[LoginLog API] 处理登录日志时发生错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}