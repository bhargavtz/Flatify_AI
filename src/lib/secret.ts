import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

function secret(): string {
  const dedicated = process.env.SETTINGS_SECRET
  if (dedicated && dedicated.length >= 16) return dedicated
  if (process.env.NODE_ENV === "production") {
    throw new Error("SETTINGS_SECRET must be set in production.")
  }
  const fallback = process.env.CLERK_SECRET_KEY
  if (fallback && fallback.length >= 16) return fallback
  return "flatify-local-settings"
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const key = scryptSync(secret(), "flatify-salt", 32)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".")
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid secret payload")
  const key = scryptSync(secret(), "flatify-salt", 32)
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ])
  return dec.toString("utf8")
}

export function last4(value: string): string {
  return value.slice(-4)
}
