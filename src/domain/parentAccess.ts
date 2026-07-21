const PIN_PATTERN = /^\d{4,8}$/
const PBKDF2_ITERATIONS = 150_000
const encoder = new TextEncoder()

export type ParentExplanationLanguage = "de" | "en" | "it" | "es"

export const defaultParentExplanationLanguage: ParentExplanationLanguage = "de"

export interface ParentAccessRecord {
  version: 1
  algorithm: "PBKDF2-SHA-256"
  iterations: number
  salt: string
  verifier: string
  createdAt: string
  explanationLanguage?: ParentExplanationLanguage
}

export function normalizeParentExplanationLanguage(
  value: unknown,
): ParentExplanationLanguage {
  return value === "en" || value === "it" || value === "es"
    ? value
    : defaultParentExplanationLanguage
}

export function parentExplanationLanguage(
  record?: ParentAccessRecord,
): ParentExplanationLanguage {
  return normalizeParentExplanationLanguage(record?.explanationLanguage)
}

export function setParentExplanationLanguage(
  record: ParentAccessRecord,
  language: ParentExplanationLanguage,
): ParentAccessRecord {
  return {
    ...record,
    explanationLanguage: normalizeParentExplanationLanguage(language),
  }
}

function cryptoApi(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Dieser Browser kann den Eltern-PIN nicht sicher speichern.")
  }
  return globalThis.crypto
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength))
  copy.set(bytes)
  return copy.buffer
}

async function deriveVerifier(
  pin: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const api = cryptoApi()
  const source = await api.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await api.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: toArrayBuffer(salt),
    },
    source,
    256,
  )
  return new Uint8Array(bits)
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false
  let difference = 0
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index]! ^ right[index]!
  }
  return difference === 0
}

export function isValidParentPin(pin: string): boolean {
  return PIN_PATTERN.test(pin)
}

export async function createParentAccess(
  pin: string,
  now = new Date(),
  explanationLanguage: ParentExplanationLanguage = defaultParentExplanationLanguage,
): Promise<ParentAccessRecord> {
  if (!isValidParentPin(pin)) {
    throw new Error("Der Eltern-PIN braucht 4 bis 8 Ziffern.")
  }
  const api = cryptoApi()
  const salt = api.getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(pin, salt, PBKDF2_ITERATIONS)
  return {
    version: 1,
    algorithm: "PBKDF2-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
    createdAt: now.toISOString(),
    explanationLanguage: normalizeParentExplanationLanguage(explanationLanguage),
  }
}

export async function verifyParentPin(
  record: ParentAccessRecord,
  pin: string,
): Promise<boolean> {
  if (!isValidParentPin(pin)) return false
  if (
    record.version !== 1 ||
    record.algorithm !== "PBKDF2-SHA-256" ||
    !Number.isSafeInteger(record.iterations) ||
    record.iterations < 100_000 ||
    record.iterations > 1_000_000
  ) return false

  try {
    const salt = base64ToBytes(record.salt)
    const expected = base64ToBytes(record.verifier)
    if (salt.byteLength !== 16 || expected.byteLength !== 32) return false
    const actual = await deriveVerifier(pin, salt, record.iterations)
    return equalBytes(actual, expected)
  } catch {
    return false
  }
}
