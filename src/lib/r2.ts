import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME || "flatify-media"
const publicDomain = process.env.R2_PUBLIC_DOMAIN

let s3Client: S3Client | null = null

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName)
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  }
  return s3Client
}

export function getR2PublicUrl(key: string): string {
  if (publicDomain) {
    const cleanDomain = publicDomain.replace(/\/+$/, "")
    return `${cleanDomain}/${key}`
  }
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`
}

export interface StoredR2Object {
  url: string
  key: string
  sizeBytes: number
  contentType: string
}

/**
 * Uploads raw buffer to Cloudflare R2
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string = "image/jpeg"
): Promise<StoredR2Object | null> {
  const client = getR2Client()
  if (!client) return null

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await client.send(command)

    return {
      url: getR2PublicUrl(key),
      key,
      sizeBytes: buffer.length,
      contentType,
    }
  } catch (error) {
    console.error("Cloudflare R2 upload error:", error)
    return null
  }
}

/**
 * Deletes object from Cloudflare R2
 */
export async function deleteObjectFromR2(key: string): Promise<boolean> {
  const client = getR2Client()
  if (!client) return true

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    await client.send(command)
    return true
  } catch (error) {
    console.error("Cloudflare R2 delete error:", error)
    return false
  }
}

/**
 * Fetches media from URL or Data URI, uploads to R2, and returns permanent asset details
 */
export async function fetchAndUploadToR2(
  mediaUrlOrDataUri: string,
  key: string,
  defaultContentType: string = "image/jpeg"
): Promise<StoredR2Object> {
  // 1. Handle base64 data URIs
  if (mediaUrlOrDataUri.startsWith("data:")) {
    const match = mediaUrlOrDataUri.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      const contentType = match[1] || defaultContentType
      const buffer = Buffer.from(match[2], "base64")
      const r2Result = await uploadBufferToR2(buffer, key, contentType)
      if (r2Result) return r2Result
      return {
        url: mediaUrlOrDataUri,
        key,
        sizeBytes: buffer.length,
        contentType,
      }
    }
  }

  // 2. Handle remote URLs (e.g. Pollinations / CDN)
  try {
    const res = await fetch(mediaUrlOrDataUri)
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = res.headers.get("content-type") || defaultContentType

      const r2Result = await uploadBufferToR2(buffer, key, contentType)
      if (r2Result) return r2Result

      return {
        url: mediaUrlOrDataUri,
        key,
        sizeBytes: buffer.length,
        contentType,
      }
    }
  } catch (err) {
    console.warn("Could not stream media to R2 directly:", err)
  }

  // 3. Fallback estimate
  return {
    url: mediaUrlOrDataUri,
    key,
    sizeBytes: 350 * 1024, // ~350 KB estimate
    contentType: defaultContentType,
  }
}
