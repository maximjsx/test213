// Shared bits for page metadata. Private or tool pages opt out of search
// indexing; the sitemap (app/sitemap.js) lists only the public ones.
export const SITE_URL = 'https://learn.bulgarian.dev'
export const SITE_NAME = 'Learn Bulgarian'

export function privatePage(title) {
  return { title, robots: { index: false, follow: false } }
}

export const passThrough = ({ children }) => children
