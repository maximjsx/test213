import { SITE_URL } from '../lib/seo'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/builder', '/voice', '/test-stt', '/play/', '/practice/mistakes', '/speed', '/profile', '/lesson/', '/u/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
