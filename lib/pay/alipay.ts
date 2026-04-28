import { AlipaySdk } from 'alipay-sdk'

type AlipayEnv = {
  appId: string
  privateKey: string
  alipayPublicKey: string
  gateway: string
  notifyUrl: string
  returnUrl: string
}

function normalizeKeyInput(key: string): string {
  // systemd EnvironmentFile 场景下，用户常用 \n 写在一行；这里把字面量转为真实换行
  return key.trim().replace(/\\n/g, '\n')
}

function toPem(key: string, kind: 'PRIVATE KEY' | 'PUBLIC KEY'): string {
  const trimmed = normalizeKeyInput(key)
  if (trimmed.includes('BEGIN ') && trimmed.includes('END ')) return trimmed
  const base = trimmed.replace(/\s+/g, '')
  const wrapped = base.replace(/(.{64})/g, '$1\n')
  return `-----BEGIN ${kind}-----\n${wrapped}\n-----END ${kind}-----`
}

function mustEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`缺少环境变量 ${key}`)
  return value
}

function getAlipayEnv(): AlipayEnv {
  return {
    appId: mustEnv('ALIPAY_APP_ID'),
    privateKey: toPem(mustEnv('ALIPAY_PRIVATE_KEY'), 'PRIVATE KEY'),
    alipayPublicKey: toPem(mustEnv('ALIPAY_PUBLIC_KEY'), 'PUBLIC KEY'),
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    notifyUrl: mustEnv('ALIPAY_NOTIFY_URL'),
    returnUrl: mustEnv('ALIPAY_RETURN_URL'),
  }
}

let cachedClient: AlipaySdk | null = null

export function getAlipayClient() {
  if (cachedClient) return cachedClient
  const cfg = getAlipayEnv()
  cachedClient = new AlipaySdk({
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    alipayPublicKey: cfg.alipayPublicKey,
    gateway: cfg.gateway,
  })
  return cachedClient
}

export function getAlipayUrls() {
  const cfg = getAlipayEnv()
  return {
    notifyUrl: cfg.notifyUrl,
    returnUrl: cfg.returnUrl,
    appId: cfg.appId,
  }
}
