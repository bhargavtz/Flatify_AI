import { MongoClient } from "mongodb"
import { db } from "../src/lib/db"
import dotenv from "dotenv"

dotenv.config()

/**
 * High-Concurrency Migration Script: MongoDB -> PostgreSQL (Supabase / Prisma)
 * Designed for safe, idempotent migration without dropping live operational data.
 */
async function migrateMongoToPostgres() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.error("❌ MONGODB_URI environment variable is missing.")
    process.exit(1)
  }

  console.log("🚀 Starting MongoDB -> PostgreSQL Data Migration...")
  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    console.log("✓ Connected to legacy MongoDB instance.")

    const mongoDb = client.db()
    const usersCollection = mongoDb.collection("users")

    const mongoUsers = await usersCollection.find({}).toArray()
    console.log(`Found ${mongoUsers.length} MongoDB user documents to migrate.`)

    let successCount = 0
    let skipCount = 0

    for (const userDoc of mongoUsers) {
      if (!userDoc.clerkId) {
        console.warn(`Skipping user without clerkId: ${userDoc._id}`)
        skipCount++
        continue
      }

      await db.user.upsert({
        where: { clerkId: userDoc.clerkId },
        update: {
          email: userDoc.email || `${userDoc.clerkId}@user.flatify.ai`,
          name: userDoc.name || "Flatify Creator",
        },
        create: {
          clerkId: userDoc.clerkId,
          email: userDoc.email || `${userDoc.clerkId}@user.flatify.ai`,
          name: userDoc.name || "Flatify Creator",
          credits: userDoc.credits || 100,
          subscriptionTier: userDoc.subscriptionTier || "FREE",
          createdAt: userDoc.createdAt ? new Date(userDoc.createdAt) : new Date(),
        },
      })
      successCount++
    }

    console.log("=========================================")
    console.log(`✅ PostgreSQL Migration Completed!`)
    console.log(`Successfully migrated: ${successCount} users`)
    console.log(`Skipped: ${skipCount} users`)
    console.log("=========================================")
  } catch (error) {
    console.error("❌ Migration error:", error)
  } finally {
    await client.close()
    await db.$disconnect()
  }
}

migrateMongoToPostgres()
