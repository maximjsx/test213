export async function GET() {
  const key = process.env.SPEECHMATICS_API_KEY
  if (!key) return Response.json({ error: 'SPEECHMATICS_API_KEY not set' }, { status: 500 })

  const res = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ ttl: 60 }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return Response.json({ error: 'token_failed', detail: body }, { status: 502 })
  }

  const data = await res.json()
  return Response.json({ key: data.key_value })
}
