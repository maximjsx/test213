import './globals.css'
import Link from 'next/link'
import { Nunito } from 'next/font/google'
import AppNav from '../components/AppNav'
import InstallBanner from '../components/InstallBanner'
import Splash from '../components/Splash'
import { SITE_URL, SITE_NAME } from '../lib/seo'
import styles from './layout.module.css'

const DESCRIPTION = 'Learn Bulgarian for free with bite-sized interactive lessons: the Cyrillic alphabet, everyday phrases, listening and speaking practice.'

// Tells search engines what the site is, so results can show it as a course
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'en' },
    {
      '@type': 'Course',
      name: 'Bulgarian for beginners',
      description: DESCRIPTION,
      url: SITE_URL,
      inLanguage: 'en',
      teaches: 'Bulgarian language',
      isAccessibleForFree: true,
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT5M' },
    },
  ],
}

// Served from our own domain at build time, so visitors never contact Google
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Learn Bulgarian: free interactive course',
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  applicationName: SITE_NAME,
  keywords: ['learn Bulgarian', 'Bulgarian language', 'Bulgarian course', 'Bulgarian lessons', 'Bulgarian alphabet', 'Cyrillic', 'Bulgarian for beginners'],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE_NAME },
  icons: {
    icon: [
      { url: '/icons/bulgarian_flag.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Learn Bulgarian: free interactive course',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Bulgarian: free interactive course',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport = {
  themeColor: '#121825',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      </head>
      <body>
        <div className={styles.appShell}>
          <div className={styles.content}>{children}</div>
          <footer className={styles.footer}>
            <Link href="/wiki" className={styles.footerLink}>Wiki</Link>
            <Link href="/about-bulgarian" className={styles.footerLink}>About Bulgarian</Link>
            <Link href="/practice/typing" className={styles.footerLink}>Typing test</Link>
            <Link href="/builder" className={styles.footerLink}>Topic Builder</Link>
            <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms" className={styles.footerLink}>Terms</Link>
            <a href="https://legal.bulgarian.dev/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Legal Notice</a>
            <a href="https://discord.gg/gnuh77Dxgm" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Discord</a>
          </footer>
        </div>
        <AppNav />
        <InstallBanner />
        <Splash />
      </body>
    </html>
  )
}
