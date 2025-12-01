/**
 * Email Service - 邮件通知服务
 * 
 * 这个文件处理所有与邮件发送相关的功能。
 * 主要功能：
 * 1. 邮件传输配置：自动配置 Nodemailer Transporter，支持 SMTP 连接字符串或分离的参数配置。
 *    - 智能推断常用邮箱服务（如 QQ 邮箱）的配置。
 * 2. 心情预警 (Super Mood Alert)：当心情强度为 "超级" (3级) 时发送提醒邮件。
 * 3. 经期预警 (Period Alert)：发送经期预测提醒邮件。
 */

import nodemailer from 'nodemailer';

type SuperMoodPayload = {
  mood: string;
  note?: string | null;
  isUpdate: boolean;
};

const ALERT_EMAIL_TO = process.env.SUPER_INTENSITY_ALERT_EMAIL;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const connectionUrl = process.env.SMTP_URL;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE;
  const explicitHost = process.env.SMTP_HOST;
  const explicitPort = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : undefined;
  const explicitSecure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : undefined;

  try {
    if (connectionUrl) {
      transporter = nodemailer.createTransport(connectionUrl);
      return transporter;
    }

    if (!user || !pass) {
      console.warn(
        '[email] Missing SMTP_USER/SMTP_PASS, skip sending alert emails.'
      );
      return null;
    }

    if (service) {
      transporter = nodemailer.createTransport({
        service,
        auth: { user, pass },
      });
      return transporter;
    }

    const inferredHost =
      explicitHost ||
      (user.endsWith('@qq.com') || user.endsWith('@foxmail.com')
        ? 'smtp.qq.com'
        : undefined);
    const host = inferredHost;
    const port =
      explicitPort ??
      (host === 'smtp.qq.com' ? 465 : host ? 587 : undefined);
    const secure =
      explicitSecure ?? (typeof port === 'number' ? port === 465 : true);

    if (!host || !port) {
      console.warn(
        '[email] Missing SMTP host/port configuration, skip sending alert emails.'
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  } catch (error) {
    console.error('[email] Failed to create SMTP transporter', error);
    return null;
  }

  return transporter;
}

export async function sendSuperMoodAlert(payload: SuperMoodPayload) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[email] SMTP transporter not available, skipping alert email');
    return;
  }

  if (!ALERT_EMAIL_TO) {
    console.warn('[email] SUPER_INTENSITY_ALERT_EMAIL not configured, skipping alert email');
    return;
  }

  const subjectPrefix = payload.isUpdate ? '更新' : '新建';
  const smtpUser = process.env.SMTP_USER!;
  const customFrom = process.env.SMTP_FROM;

  // 只在自定义发件人看起来像邮箱地址或 "Name <email>" 时才使用，避免无效 MAIL FROM
  const validFrom =
    customFrom &&
    (/@/.test(customFrom) || /<[^>]+@[^>]+>/.test(customFrom))
      ? customFrom
      : smtpUser;

  const fromAddress = validFrom;

  const textLines = [
    `Piggy 刚刚${subjectPrefix}了一条情绪记录。`,
    `情绪：${payload.mood}`,
    `强度：超级`,
  ];

  if (payload.note) {
    textLines.push('', `留言：${payload.note}`);
  }

  await mailer.sendMail({
    from: fromAddress,
    to: ALERT_EMAIL_TO,
    subject: `Piggy 情绪提醒（${subjectPrefix}）`,
    text: textLines.join('\n'),
  });

  // 8. 发送的心情预警邮箱
  console.log(`[email] 心情预警邮件已发送至: ${ALERT_EMAIL_TO}`);
}

export async function sendPeriodAlert(nextPeriodDate: string, daysUntil: number) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[email] SMTP transporter not available, skipping period alert email');
    return;
  }

  const targetEmail = ALERT_EMAIL_TO;
  if (!targetEmail) {
    console.warn('[email] PERIOD_ALERT_EMAIL/SUPER_INTENSITY_ALERT_EMAIL not configured, skipping period alert email');
    return;
  }

  const smtpUser = process.env.SMTP_USER!;
  const customFrom = process.env.SMTP_FROM;

  const validFrom =
    customFrom &&
    (/@/.test(customFrom) || /<[^>]+@[^>]+>/.test(customFrom))
      ? customFrom
      : smtpUser;

  const subject = `经期预警`;
  const text = `
根据记录预测，piggy的生理期可能会在 ${daysUntil} 天后（${nextPeriodDate}）到来。
  `.trim();

  await mailer.sendMail({
    from: validFrom,
    to: targetEmail,
    subject,
    text,
  });
}

