// Minimal GitHub client for committing content files from the builder.
// Env: GITHUB_TOKEN (fine-grained, Contents read/write on this repo only),
// GITHUB_REPO ("owner/name"), GITHUB_BRANCH (default "master").
// Server only.

const API = 'https://api.github.com'
const TIMEOUT_MS = 10000

export function githubConfigured() {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO)
}

async function gh(path, init = {}) {
  const res = await fetch(`${API}/repos/${process.env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}: ${data.message || 'request failed'}`)
  return data
}

const branch = () => process.env.GITHUB_BRANCH || 'master'

export async function readFile(path) {
  const data = await gh(`/contents/${path}?ref=${branch()}`)
  return Buffer.from(data.content, 'base64').toString('utf8')
}

// One commit with every file, so a topic and its registration land together
export async function commitFiles(files, message) {
  const ref = await gh(`/git/ref/heads/${branch()}`)
  const parent = await gh(`/git/commits/${ref.object.sha}`)
  const tree = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
    }),
  })
  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [parent.sha] }),
  })
  await gh(`/git/refs/heads/${branch()}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) })
  return commit.html_url
}
