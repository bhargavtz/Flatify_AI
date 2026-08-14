import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/settings",
        "/generate",
        "/profile",
        "/help",
        "/api/",
        "/role-select",
      ],
    },
    sitemap: "https://flatify-ai.vercel.app/sitemap.xml",
  }
}
