// Enhanced Auth Service with PBKDF2, Rate Limiting & Brute-Force Protection
// File: apps/appsso/src/utils/crypto.ts

import { Buffer } from 'node:buffer'

const SALT_LENGTH = 32
const KEY_LENGTH = 32

// Helper untuk Web Crypto API
const getCrypto = () => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto;
  }
  throw new Error("Web Crypto API is not available in this environment");
};

export async function generateSalt(length: number = SALT_LENGTH): Promise<Uint8Array> {
  return getCrypto().getRandomValues(new Uint8Array(length));
}

/**
 * Hash password menggunakan PBKDF2
 * @param iterations Mengambil dari env PBKDF2_ITER (default: 100000)
 */
export async function hashPasswordPBKDF2(
  password: string,
  pepper: string,
  iterations: number = 100000 // Parameter baru agar dinamis
): Promise<{ salt: string; hash: string }> {
  const salt = await generateSalt(SALT_LENGTH);
  const saltBase64 = Buffer.from(salt).toString('base64');
  
  const passwordWithPepper = password + pepper;
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(passwordWithPepper);
  
  const c = getCrypto();
  const baseKey = await c.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
  
  const hash = await c.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
    baseKey,
    KEY_LENGTH * 8
  );
  
  return { salt: saltBase64, hash: Buffer.from(hash).toString('base64') };
}

/**
 * Verifikasi Password
 */
export async function verifyPasswordPBKDF2(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper: string,
  iterations: number = 100000 // Parameter baru agar dinamis
): Promise<boolean> {
  try {
    const salt = Buffer.from(storedSalt, 'base64');
    const passwordWithPepper = password + pepper;
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(passwordWithPepper);
    
    const c = getCrypto();
    const baseKey = await c.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
    
    const hash = await c.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
      baseKey,
      KEY_LENGTH * 8
    );
    
    return constantTimeCompare(Buffer.from(hash).toString('base64'), storedHash);
  } catch (err) {
    return false;
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) { result |= a.charCodeAt(i) ^ b.charCodeAt(i); }
  return result === 0;
}

export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await getCrypto().subtle.digest('SHA-256', encoder.encode(data));
  return Buffer.from(buf).toString('hex');
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${1e7}${-1e3}${-4e3}${-8e3}${-1e11}`.replace(/[018]/g, (c: any) =>
    (parseInt(c) ^ (getCrypto().getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))).toString(16)
  );
}

export function generateOTP(): string { return Math.floor(100000 + Math.random() * 900000).toString(); }
export function generatePIN(): string { return Math.floor(1000 + Math.random() * 9000).toString(); }