/**
 * Zero-dependency WebCrypto password hashing and token utilities.
 * Compatible with Node.js 20+, Cloudflare Workers, and modern Edge runtimes.
 */

/** Number of PBKDF2-HMAC-SHA-256 rounds applied when deriving a password hash. */
// 100,000 iterations PBKDF2-HMAC-SHA-256
const ITERATIONS = 100_000
/** Length, in bytes, of the derived key produced by PBKDF2. */
const KEY_LENGTH_BYTES = 32
/** Length, in bytes, of the random salt generated for each password hash. */
const SALT_LENGTH_BYTES = 16

/**
 * Converts a binary buffer to a lowercase hexadecimal string.
 *
 * @param buffer - The bytes to encode, as an `ArrayBuffer` or `Uint8Array`.
 * @returns The hex-encoded representation of `buffer`, two characters per byte.
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const byteArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Converts a lowercase hexadecimal string back into raw bytes.
 *
 * @param hex - A hex-encoded string, as produced by {@link bufferToHex}.
 * @returns The decoded bytes.
 */
function hexToBuffer(hex: string): Uint8Array {
  const length = hex.length / 2
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Hashes a plaintext password using PBKDF2-HMAC-SHA-256 with a freshly
 * generated random salt.
 *
 * @param password - The plaintext password to hash.
 * @returns A string in the form `"<saltHex>:<hashHex>"`, suitable for
 *   persisting and later verifying with {@link verifyPassword}.
 */
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

/**
 * Verifies a plaintext password against a hash produced by {@link hashPassword}.
 *
 * Re-derives the hash using the salt embedded in `storedHash` and compares
 * it to the stored value in constant time to avoid timing side-channels.
 *
 * @param password - The plaintext password to check.
 * @param storedHash - The `"<saltHex>:<hashHex>"` string previously
 *   returned by {@link hashPassword}.
 * @returns `true` if `password` matches `storedHash`; `false` if it does
 *   not match, or if `storedHash` is malformed.
 */
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

/**
 * Generates a cryptographically random session token.
 *
 * @returns A 64-character hex string encoding 32 random bytes (256 bits of entropy).
 */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bufferToHex(bytes)
}
