import { Webhook } from "svix"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

interface ClerkUserData {
  id: string
  email_addresses?: Array<{ email_address?: string }>
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
}

interface ClerkEvent {
  type: string
  data: ClerkUserData
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkEvent
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent
  } catch (err) {
    console.error("Error verifying webhook:", err instanceof Error ? err.message : err)
    return new Response("Invalid signature", { status: 400 })
  }

  const { id, email_addresses, first_name, last_name, image_url } = evt.data
  if (!id) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 })
  }

  const email = email_addresses?.[0]?.email_address || ""
  const name = `${first_name || ""} ${last_name || ""}`.trim()

  try {
    if (evt.type === "user.deleted") {
      await db.user.deleteMany({ where: { clerkId: id } })
      return NextResponse.json({ success: true })
    }

    if (evt.type === "user.created" || evt.type === "user.updated") {
      await db.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name,
          avatarUrl: image_url,
        },
        create: {
          clerkId: id,
          email,
          name,
          avatarUrl: image_url,
          credits: 100,
          subscriptionTier: "FREE",
        },
      })
    }
  } catch (error) {
    console.error("Webhook user sync failed:", error)
    return NextResponse.json({ error: "User sync failed." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
