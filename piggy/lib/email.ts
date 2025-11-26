import nodemailer from 'nodemailer';

type SuperMoodPayload = {
  mood: string;
  note?: string | null;
  isUpdate: boolean;
};

const ALERT_EMAIL_TO =
  process.env.SUPER_INTENSITY_ALERT_EMAIL ?? '2681158691@qq.com';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !port || !user || !pass) {
    console.warn(
      '[email] Missing SMTP configuration, skip sending alert emails.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendSuperMoodAlert(payload: SuperMoodPayload) {
  const mailer = getTransporter();
  if (!mailer) return;

  const subjectPrefix = payload.isUpdate ? '更新' : '新建';
  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER!;

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
}

