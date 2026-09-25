import { SITE_URL } from './seo'

// Shared look for the link preview cards (app/**/opengraph-image.js). They run
// on the edge runtime, so they read data over HTTP from the public API routes.
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_COLORS = {
  bg: '#121825', surface: '#1a2438', surfaceHi: '#22304a', text: '#e2ecfa',
  muted: '#809fcb', teal: '#00bfa0', yellow: '#ffc800', orange: '#ff9600',
}
export const FLAG = ['#ffffff', '#00966e', '#d62612']

// The deployment serving this request: production, a Vercel preview, or local dev
export function ogOrigin() {
  if (process.env.VERCEL_ENV === 'production') return SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function ogFonts() {
  const data = await fetch(new URL('./fonts/Nunito-Black.ttf', import.meta.url)).then(r => r.arrayBuffer())
  return [{ name: 'Nunito', data, weight: 900, style: 'normal' }]
}

export async function fetchJson(path) {
  try {
    const res = await fetch(`${ogOrigin()}${path}`, { cache: 'no-store' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export function Flag({ width = 132, height = 84 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width, height, borderRadius: 14, overflow: 'hidden' }}>
      {FLAG.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

// Page background with the rounded card every preview sits on
export function Frame({ children }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: OG_COLORS.bg, padding: 56, fontFamily: 'Nunito' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, padding: '0 64px', background: OG_COLORS.surface, borderRadius: 48 }}>
        {children}
      </div>
    </div>
  )
}
