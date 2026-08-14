import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/role-select'],
    },
    sitemap: 'https://flatify-ai.vercel.app/sitemap.xml',
  }
}
