import { PrismaClient } from "@prisma/client"

// High-Concurrency Database Client Singleton
// Optimized for PgBouncer / Supabase Transaction Mode Connection Pooler (50k active users)

declare global {
  var prismaGlobal: PrismaClient | undefined
}

export const db =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db
}

export default db
