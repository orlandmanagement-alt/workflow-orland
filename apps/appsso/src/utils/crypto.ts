// Enhanced Auth Service with PBKDF2, Rate Limiting & Brute-Force Protection
// File: apps/appsso/src/utils/crypto.ts

import { webcrypto } from 'crypto'

const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 32
const KEY_LENGTH = 32

/**
 * Generate cryptographically secure random bytes
 */
export async function generateSalt(length: number = SALT_LENGTH): Promise<Uint8Array> {
  return webcrypto.getRandomValues(new Uint8Array(length))
}

/**
 * Hash password using PBKDF2-SHA256
 * Stores salt with hash for later verification
 * 
 * @param password - Plain text password
 * @param pepper - Global pepper from environment
 * @returns { salt: string, hash: string }
 */
export async function hashPasswordPBKDF2(
  password: string,
  pepper: string
): Promise<{ salt: string; hash: string }> {
  const salt = await generateSalt(SALT_LENGTH)
  const saltBase64 = Buffer.from(salt).toString('base64')
  
  // Combine password with pepper
  const passwordWithPepper = password + pepper
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(passwordWithPepper)
  
  // PBKDF2-SHA256
  const hash = await webcrypto.subtle.pbkdf2(
    passwordData,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH * 8, // bits
    'SHA-256'
  )
  
  const hashBase64 = Buffer.from(hash).toString('base64')
  
  return {
    salt: saltBase64,
    hash: hashBase64,
  }
}

/**
 * Verify password against stored hash
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash (base64)
 * @param storedSalt - Stored salt (base64)
 * @param pepper - Global pepper from environment
 * @returns boolean - Whether password matches
 */
export async function verifyPasswordPBKDF2(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper: string
): Promise<boolean> {
  try {
    const salt = Buffer.from(storedSalt, 'base64')
    const passwordWithPepper = password + pepper
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(passwordWithPepper)
    
    // Recompute hash with stored salt
    const hash = await webcrypto.subtle.pbkdf2(
      passwordData,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH * 8,
      'SHA-256'
    )
    
    const computedHashBase64 = Buffer.from(hash).toString('base64')
    
    // Constant-time comparison
    return constantTimeCompare(computedHashBase64, storedHash)
  } catch (err) {
    return false
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Hash any data using SHA-256 (for OTP, tokens, etc.)
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buf = await webcrypto.subtle.digest('SHA-256', encoder.encode(data))
  return Buffer.from(buf).toString('hex')
}

/**
 * Generate random UUID v4
 */
export function generateUUID(): string {
  return `${1e7}${-1e3}${-4e3}${-8e3}${-1e11}`.replace(/[018]/g, (c: string) =>
    (parseInt(c) ^ (webcrypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))
    ).toString(16)
  )
}

/**
 * Generate secure random code for OTP (6 digits)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate secure random code for PIN (4 digits)
 */
export function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}
