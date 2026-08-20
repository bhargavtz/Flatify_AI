import { PrismaClient } from "@prisma/client"

// High-Concurrency Database Client Singleton
// Optimized for PgBouncer / Supabase Transaction Mode Connection Pooler

declare global {
  var prismaGlobal: PrismaClient | undefined
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export const db =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db
}

export default db
