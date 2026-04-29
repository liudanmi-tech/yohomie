import { AlipaySdk } from 'alipay-sdk'
import { createPrivateKey, createPublicKey } from 'node:crypto'

type AlipayEnv = {
  appId: string
  privateKeyRaw: string
  alipayPublicKeyRaw: string
  gateway: string
  notifyUrl: string
  returnUrl: string
}

function normalizeKeyInput(key: string): string {
  // systemd EnvironmentFile 场景下，用户常用 \n 写在一行；这里把字面量转为真实换行
  let v = key.trim().replace(/\\n/g, '\n')
  // 兼容值被单双引号整体包裹的情况
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v
}

function toPem(key: string, kind: string): string {
  const trimmed = normalizeKeyInput(key)
  if (trimmed.includes('BEGIN ') && trimmed.includes('END ')) return trimmed
  const base = trimmed.replace(/\s+/g, '')
  const wrapped = base.replace(/(.{64})/g, '$1\n')
  return `-----BEGIN ${kind}-----\n${wrapped}\n-----END ${kind}-----`
}

function toPemCandidates(key: string, keyType: 'private' | 'public'): string[] {
  const normalized = normalizeKeyInput(key)
  if (normalized.includes('BEGIN ') && normalized.includes('END ')) return [normalized]
  if (keyType === 'private') {
    return [toPem(normalized, 'PRIVATE KEY'), toPem(normalized, 'RSA PRIVATE KEY')]
  }
  return [toPem(normalized, 'PUBLIC KEY'), toPem(normalized, 'RSA PUBLIC KEY')]
}

function normalizePrivateKeyForNode(raw: string): string {
  const candidates = toPemCandidates(raw, 'private')
  let lastError: unknown = null
  for (const candidate of candidates) {
    try {
      const parsed = createPrivateKey(candidate)
      return parsed.export({ type: 'pkcs8', format: 'pem' }).toString()
    } catch (e) {
      lastError = e
    }
  }
  throw lastError instanceof Error ? lastError : new Error('应用私钥解析失败')
}

function normalizePublicKeyForNode(raw: string): string {
  const candidates = toPemCandidates(raw, 'public')
  let lastError: unknown = null
  for (const candidate of candidates) {
    try {
      const parsed = createPublicKey(candidate)
      return parsed.export({ type: 'spki', format: 'pem' }).toString()
    } catch (e) {
      lastError = e
    }
  }
  throw lastError instanceof Error ? lastError : new Error('支付宝公钥解析失败')
}

function mustEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`缺少环境变量 ${key}`)
  return value
}

/** 仅组装回调地址（走 Java 签名服务时不需要在 Node 加载私钥） */
export function getAlipayOrderUrls(): { notifyUrl: string; returnUrl: string } {
  return {
    notifyUrl: mustEnv('ALIPAY_NOTIFY_URL'),
    returnUrl: mustEnv('ALIPAY_RETURN_URL'),
  }
}

function getAlipayEnv(): AlipayEnv {
  return {
    appId: mustEnv('ALIPAY_APP_ID'),
    privateKeyRaw: mustEnv('ALIPAY_PRIVATE_KEY'),
    alipayPublicKeyRaw: mustEnv('ALIPAY_PUBLIC_KEY'),
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    notifyUrl: mustEnv('ALIPAY_NOTIFY_URL'),
    returnUrl: mustEnv('ALIPAY_RETURN_URL'),
  }
}

let cachedClient: AlipaySdk | null = null

export function getAlipayClient() {
  if (cachedClient) return cachedClient
  const cfg = getAlipayEnv()
  const privateKey = normalizePrivateKeyForNode(cfg.privateKeyRaw)
  const alipayPublicKey = normalizePublicKeyForNode(cfg.alipayPublicKeyRaw)
  cachedClient = new AlipaySdk({
    appId: cfg.appId,
    privateKey,
    alipayPublicKey,
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
