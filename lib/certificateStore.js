import getClientPromise from './mongodb'
import { certificateLessons } from './certificates'
import { renderCertificatePdf } from './certificatePdf'
import { fingerprint, newCertificateId, sha256, signPayload } from './certificateSigning'

export async function certificatesCollection() {
  const client = await getClientPromise()
  return client.db('bulgario').collection('certificates')
}

export function publicCertificate(doc) {
  return {
    id: doc._id,
    tier: doc.tier,
    name: doc.name,
    title: doc.title,
    level: doc.level,
    seal: doc.seal,
    blurb: doc.blurb,
    topics: doc.topics,
    lessons: doc.lessons,
    issuedAt: doc.issuedAt,
    fingerprint: doc.fingerprint,
    fileHash: doc.fileHash,
  }
}

export async function userProgressLessons(discordId) {
  const client = await getClientPromise()
  const user = await client.db('bulgario').collection('users').findOne(
    { discordId },
    { projection: { _id: 0, 'progress.lessons': 1 } }
  )
  return user?.progress?.lessons || {}
}

// Renders, signs and stores the PDF once. Downloads serve these exact bytes,
// which is what lets the verify page recognise an untouched file by its hash.
export async function issueCertificate({ discordId, tier, name, origin }) {
  const id = newCertificateId()
  const issuedAt = new Date()
  const cert = {
    id,
    name,
    title: tier.title,
    level: tier.level,
    seal: tier.seal,
    blurb: tier.blurb,
    topics: tier.levelIds.length,
    lessons: certificateLessons(tier).length,
    issuedAt,
  }
  const verifyUrl = `${origin}/certificate/${id}`
  const token = signPayload({
    v: 1,
    id,
    name,
    credential: `${tier.title} · ${tier.level}`,
    lessons: cert.lessons,
    issuedAt: issuedAt.toISOString(),
    issuer: new URL(origin).host,
  })
  const print = fingerprint(token)
  const pdf = await renderCertificatePdf(cert, { token, verifyUrl, fingerprint: print })

  const { id: _, ...fields } = cert
  const doc = { _id: id, discordId, tier: tier.id, ...fields, token, fingerprint: print, fileHash: sha256(pdf), pdf }
  const col = await certificatesCollection()
  await col.insertOne(doc)
  return doc
}
