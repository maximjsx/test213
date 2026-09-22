import crypto from 'crypto'

// PKCS#8 header for a raw 32-byte Ed25519 seed
const ED25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')

let keys

// Derived from AUTH_SECRET so there is no extra secret to manage.
// Rotating AUTH_SECRET invalidates signatures on already downloaded files.
function signingKeys() {
  if (keys) return keys
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not defined')
  const seed = Buffer.from(crypto.hkdfSync('sha256', secret, 'bulgario', 'certificate-ed25519-v1', 32))
  const privateKey = crypto.createPrivateKey({
    key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  })
  keys = { privateKey, publicKey: crypto.createPublicKey(privateKey) }
  return keys
}

export function publicKeyPem() {
  return signingKeys().publicKey.export({ type: 'spki', format: 'pem' })
}

// Token layout: base64url(payload JSON) + "." + base64url(Ed25519 signature)
export function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.sign(null, Buffer.from(body), signingKeys().privateKey).toString('base64url')
  return `${body}.${signature}`
}

export function verifyToken(token) {
  if (typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const valid = crypto.verify(null, Buffer.from(body), signingKeys().publicKey, Buffer.from(signature, 'base64url'))
  if (!valid) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return null
  }
}

// Short, human-comparable digest of the signature printed on the certificate
export function fingerprint(token) {
  const hex = crypto.createHash('sha256').update(token).digest('hex').toUpperCase()
  return hex.slice(0, 16).match(/.{4}/g).join(' ')
}

export function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newCertificateId() {
  const pick = () => ID_ALPHABET[crypto.randomInt(ID_ALPHABET.length)]
  const group = () => Array.from({ length: 4 }, pick).join('')
  return `BG-${group()}-${group()}`
}
