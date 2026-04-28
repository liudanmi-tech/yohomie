import { createHash, randomBytes } from 'node:crypto'

export function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function randomToken(size = 32) {
  return randomBytes(size).toString('hex')
}

export function randomNumericCode(length = 6) {
  const max = 10 ** length
  return String(Math.floor(Math.random() * max)).padStart(length, '0')
}
