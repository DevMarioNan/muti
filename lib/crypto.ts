import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16

/**
 * Derives a 32-byte key from the encryption key using PBKDF2
 */
function deriveKey(encryptionKey: string): Buffer {
  const keyBuffer = Buffer.from(encryptionKey, "hex")
  if (keyBuffer.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  }
  return keyBuffer
}

/**
 * Encrypts a plaintext token using AES-256-GCM
 * Returns base64-encoded string: iv:authTag:ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = deriveKey(process.env.TOKEN_ENCRYPTION_KEY!)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":")
}

/**
 * Decrypts a token that was encrypted with encryptToken()
 * Expects format: iv:authTag:ciphertext (all base64)
 */
export function decryptToken(encrypted: string): string {
  const key = deriveKey(process.env.TOKEN_ENCRYPTION_KEY!)
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":")

  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(authTagB64, "base64")
  const ciphertext = Buffer.from(ciphertextB64, "base64")

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}