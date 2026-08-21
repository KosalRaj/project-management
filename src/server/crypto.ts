/**
 * Zero-dependency WebCrypto password hashing and token utilities.
 * Compatible with Node.js 20+, Cloudflare Workers, and modern Edge runtimes.
 */

// 100,000 iterations PBKDF2-HMAC-SHA-256
const ITERATIONS = 100_000
const KEY_LENGTH_BYTES = 32
const SALT_LENGTH_BYTES = 16

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const byteArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): Uint8Array {
  const length = hex.length / 2
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES))
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH_BYTES * 8,
  )

  const saltHex = bufferToHex(salt)
  const hashHex = bufferToHex(derivedBits)
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, originalHashHex] = storedHash.split(':')
  if (!saltHex || !originalHashHex) return false

  const encoder = new TextEncoder()
  const salt = hexToBuffer(saltHex)
  const originalHash = hexToBuffer(originalHashHex)

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH_BYTES * 8,
  )

  const derivedHash = new Uint8Array(derivedBits)
  if (derivedHash.length !== originalHash.length) return false

  // Constant-time comparison
  let mismatch = 0
  for (let i = 0; i < derivedHash.length; i++) {
    mismatch |= derivedHash[i] ^ originalHash[i]
  }

  return mismatch === 0
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bufferToHex(bytes)
}
