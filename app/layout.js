import './globals.css'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'
import InstallBanner from '../components/InstallBanner'
import Splash from '../components/Splash'
import styles from './layout.module.css'

const BASE_URL = 'https://learn.bulgarian.dev'

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Learn Bulgarian',
    template: '%s - Learn Bulgarian',
  },
  description: 'Learn Bulgarian for free with interactive exercises, vocabulary lessons, and grammar practice. Start your journey to fluency today.',
  keywords: ['learn Bulgarian', 'Bulgarian language', 'Bulgarian course', 'Bulgarian lessons', 'study Bulgarian', 'Bulgarian for beginners'],
  authors: [{ name: 'Learn Bulgarian', url: BASE_URL }],
  creator: 'Learn Bulgarian',
  publisher: 'Learn Bulgarian',
  manifest: '/manifest.json',
  themeColor: '#58cc02',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Learn Bulgarian' },
  icons: {
    icon: [
      { url: '/icons/bulgarian_flag.png', type: 'image/png' },
    ],
    apple: '/icons/bulgarian_flag.png',
    shortcut: '/icons/bulgarian_flag.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Learn Bulgarian',
    title: 'Learn Bulgarian - Free Interactive Course',
    description: 'Learn Bulgarian for free with interactive exercises, vocabulary lessons, and grammar practice.',
    images: [{ url: '/icons/bulgarian_flag.png', width: 512, height: 512, alt: 'Learn Bulgarian' }],
  },
  twitter: {
    card: 'summary',
    title: 'Learn Bulgarian - Free Interactive Course',
    description: 'Learn Bulgarian for free with interactive exercises, vocabulary lessons, and grammar practice.',
    images: ['/icons/bulgarian_flag.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className={styles.appShell}>
          <div className={styles.content}>{children}</div>
          <footer className={styles.footer}>
            <Link href="/builder" className={styles.footerLink}>🏗️ Level Builder</Link>
            <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="/legal" className={styles.footerLink}>Legal Notice</Link>
            <a href="https://discord.gg/gnuh77Dxgm" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Discord</a>
          </footer>
        </div>
        <BottomNav />
        <InstallBanner />
        <Splash />
      </body>
    </html>
  )
}
