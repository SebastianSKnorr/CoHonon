import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(salt + password).digest('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  const attempt = createHash('sha256').update(salt + password).digest('hex')
  return timingSafeEqual(Buffer.from(hash), Buffer.from(attempt))
}
