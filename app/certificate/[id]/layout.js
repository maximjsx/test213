import { certificatesCollection } from '@/lib/certificateStore'

export async function generateMetadata({ params }) {
  try {
    const col = await certificatesCollection()
    const cert = await col.findOne({ _id: String(params.id).toUpperCase() }, { projection: { name: 1, title: 1, level: 1 } })
    if (!cert) return { title: 'Certificate' }
    const description = `${cert.name} earned the ${cert.title} (${cert.level}) certificate on Learn Bulgarian.`
    return {
      title: `${cert.name}: ${cert.title}`,
      description,
      openGraph: { title: `${cert.name}: ${cert.title} certificate`, description },
      twitter: { title: `${cert.name}: ${cert.title} certificate`, description },
    }
  } catch (e) {
    console.error('certificate metadata error:', e)
    return { title: 'Certificate' }
  }
}

export default function CertificateLayout({ children }) {
  return children
}
