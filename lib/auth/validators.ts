import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^1\d{10}$/, '手机号格式不正确')

export const emailSchema = z
  .string()
  .email('邮箱格式不正确')
  .max(100)

export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(64, '密码不超过 64 位')

export const codeSchema = z
  .string()
  .regex(/^\d{6}$/, '验证码为 6 位数字')
