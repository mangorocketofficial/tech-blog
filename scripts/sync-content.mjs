import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return Promise.resolve()

  return readFile(envPath, 'utf8').then((contents) => {
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator < 1) continue

      const key = line.slice(0, separator).trim()
      let value = line.slice(separator + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  })
}

await loadLocalEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
}

const pageSize = 1000
const posts = []

for (let from = 0; ; from += pageSize) {
  const url = new URL('/rest/v1/posts', supabaseUrl)
  url.searchParams.set('select', '*')
  url.searchParams.set('is_published', 'eq.true')
  url.searchParams.set('order', 'published_at.desc.nullslast,created_at.desc')

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Range: `${from}-${from + pageSize - 1}`,
      'Range-Unit': 'items',
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase content sync failed (${response.status}): ${await response.text()}`)
  }

  const batch = await response.json()
  posts.push(...batch)
  if (batch.length < pageSize) break
}

const cacheDir = path.join(process.cwd(), '.content-cache')
const publicDir = path.join(process.cwd(), 'public')
await mkdir(cacheDir, { recursive: true })
await mkdir(publicDir, { recursive: true })

await writeFile(
  path.join(cacheDir, 'content.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), posts }),
)

const searchIndex = posts.map((post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  description: post.description,
  featured_image: post.featured_image,
  category: post.category,
  tags: post.tags,
  product_name: post.product_name,
  published_at: post.published_at,
  product_price: post.product_price,
}))

await writeFile(path.join(publicDir, 'search-index.json'), JSON.stringify(searchIndex))
console.log(`Content snapshot ready: ${posts.length} published posts`)
