import Dysmsapi20170525, {
  SendSmsRequest,
} from '@alicloud/dysmsapi20170525'
import { Config } from '@alicloud/openapi-client'
import nodemailer from 'nodemailer'

type SendCodeParams = {
  target: string
  code: string
}

function hasAliyunSmsConfig() {
  return Boolean(
    process.env.ALIYUN_ACCESS_KEY_ID &&
      process.env.ALIYUN_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_SMS_SIGN_NAME &&
      process.env.ALIYUN_SMS_TEMPLATE_CODE,
  )
}

export async function sendSmsCode({ target, code }: SendCodeParams) {
  if (!hasAliyunSmsConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[DEV MOCK] sms code', { target, code })
      return
    }
    throw new Error('短信网关未配置')
  }

  const client = new Dysmsapi20170525(
    new Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com',
    }),
  )

  const req = new SendSmsRequest({
    phoneNumbers: target,
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
    templateParam: JSON.stringify({ code }),
  })

  const resp = await client.sendSms(req)
  if (resp.body?.code !== 'OK') {
    throw new Error(`短信发送失败: ${resp.body?.message ?? 'unknown'}`)
  }
}

function hasAliyunMailConfig() {
  return Boolean(
    process.env.ALIYUN_SMTP_HOST &&
      process.env.ALIYUN_SMTP_PORT &&
      process.env.ALIYUN_SMTP_USER &&
      process.env.ALIYUN_SMTP_PASS &&
      process.env.ALIYUN_SMTP_FROM,
  )
}

export async function sendEmailCode({ target, code }: SendCodeParams) {
  if (!hasAliyunMailConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[DEV MOCK] email code', { target, code })
      return
    }
    throw new Error('邮件网关未配置')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.ALIYUN_SMTP_HOST,
    port: Number(process.env.ALIYUN_SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.ALIYUN_SMTP_USER,
      pass: process.env.ALIYUN_SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.ALIYUN_SMTP_FROM,
    to: target,
    subject: '【有厚米科技】您的账号验证码',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height: 1.7; color: #1f2937;">
        <p>您好！</p>
        <p>您本次登录验证码为：<b style="font-size: 20px;">${code}</b>，5 分钟内有效。</p>
        <p>本邮件由 <b>北京有厚米科技有限公司</b> 发送，请勿将验证码泄露给他人。</p>
      </div>
    `,
  })
}
