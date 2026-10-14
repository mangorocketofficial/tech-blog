import { createClient } from 'npm:@supabase/supabase-js@2.90.1'

const encoder = new TextEncoder()
const SESSION_SECONDS = 60 * 60 * 24
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const SITE_PROFILES = {
  tech: {
    name: '테크매니아',
    slugPrefix: '테크',
    category: '테니스 원리',
    description: (topic: string) => `${topic}에 대해 물리원리와 인체구조로 설명합니다.`,
    userPrompt: (topic: string) =>
      `다음 주제에 대한 테니스 정보 블로그 포스트를 물리원리와 인체구조 관점에서 작성해주세요: ${topic}`,
    systemPrompt: `당신은 테니스 전문가이자 물리학/운동역학 전문 블로거입니다.
테니스의 기술과 원리를 물리학과 인체구조의 관점에서 과학적으로 설명합니다.
초보자도 이해하기 쉽게 작성하되, 과학적 근거를 바탕으로 설명합니다.
제품 홍보가 아닌 순수 정보 공유 목적으로 작성합니다.

응답은 반드시 아래 JSON 형식으로 작성해주세요:
{
  "title": "SEO 최적화된 제목 (50자 이내)",
  "description": "150-160자 내외의 메타 설명",
  "content": "HTML 형식의 본문 (1500-2500자)",
  "tags": ["태그1", "태그2", "태그3"],
  "seo_keywords": ["키워드1", "키워드2", "키워드3"],
  "faq": [
    {"question": "질문1", "answer": "답변1"},
    {"question": "질문2", "answer": "답변2"},
    {"question": "질문3", "answer": "답변3"}
  ]
}

본문은 h2, h3, p, ul, li 태그로 구조화하고 쿠팡 링크나 제품 홍보 문구를 포함하지 마세요.`,
  },
  pet: {
    name: '펫부산',
    slugPrefix: '펫',
    category: '배변·위생',
    description: (topic: string) => `${topic}에 대한 반려동물 용품 리뷰와 비용 분석`,
    userPrompt: (topic: string) =>
      `다음 주제에 대한 반려동물 용품 정보 블로그 포스트를 TCO(총소유비용)와 소모품 비용 관점에서 작성해주세요: ${topic}`,
    systemPrompt: `당신은 반려동물 용품 전문 블로거입니다.
반려동물 용품의 성능, TCO(총소유비용), 소모품 비용을 분석하여 소비자에게 유용한 정보를 제공합니다.
초보 반려인도 이해하기 쉽게 작성하되, 실제 사용 경험과 비용 데이터를 바탕으로 설명합니다.
제품 홍보가 아닌 순수 정보 공유 목적으로 작성합니다.

응답은 title, description, content, tags, seo_keywords, faq 필드를 포함하는 JSON 객체로 작성하세요.
본문은 1500-2500자의 HTML이며 h2, h3, p, ul, li 태그로 구조화하고 쿠팡 링크를 포함하지 마세요.`,
  },
  golf: {
    name: '육아&생활 아이템 리뷰',
    slugPrefix: 'baby',
    category: '육아용품 가이드',
    description: (topic: string) => `${topic}에 대해 TCO 관점에서 분석합니다.`,
    userPrompt: (topic: string) =>
      `다음 주제에 대한 육아용품·생활용품 정보 블로그 포스트를 TCO(총비용) 관점에서 작성해주세요: ${topic}`,
    systemPrompt: `당신은 육아용품·생활용품 전문 리뷰어이자 TCO(총비용) 분석 블로거입니다.
육아용품과 생활 아이템의 실제 사용 비용, 소모품 비용, 유지비를 포함한 TCO 관점에서 분석합니다.
초보 부모도 이해하기 쉽게 작성하되, 실사용 데이터를 바탕으로 설명합니다.
제품 홍보가 아닌 순수 정보 공유 목적으로 작성합니다.

응답은 title, description, content, tags, seo_keywords, faq 필드를 포함하는 JSON 객체로 작성하세요.
본문은 1500-2500자의 HTML이며 h2, h3, p, ul, li 태그로 구조화하고 쿠팡 링크를 포함하지 마세요.`,
  },
} as const

type SiteProfile = (typeof SITE_PROFILES)[keyof typeof SITE_PROFILES]

function env(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function getSiteProfile(): SiteProfile {
  const key = (Deno.env.get('SITE_PROFILE') || 'tech') as keyof typeof SITE_PROFILES
  return SITE_PROFILES[key] || SITE_PROFILES.tech
}

function getAllowedOrigins(): Set<string> {
  return new Set(
    (Deno.env.get('ALLOWED_ORIGINS') || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || ''
  const allowed = getAllowedOrigins()
  const allowOrigin = allowed.has(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env('ADMIN_SESSION_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function createSession(email: string): Promise<string> {
  const payload = base64Url(
    encoder.encode(
      JSON.stringify({
        email,
        exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
        nonce: crypto.randomUUID(),
      }),
    ),
  )
  return `${payload}.${await sign(payload)}`
}

async function verifySession(token: string | null): Promise<boolean> {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  try {
    const expected = decodeBase64Url(await sign(payload))
    const actual = decodeBase64Url(signature)
    if (!timingSafeEqual(expected, actual)) return false

    const data = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)))
    return (
      data.email === env('ADMIN_EMAIL') &&
      typeof data.exp === 'number' &&
      data.exp > Math.floor(Date.now() / 1000)
    )
  } catch {
    return false
  }
}

async function isAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get('authorization') || ''
  return verifySession(authorization.startsWith('Bearer ') ? authorization.slice(7) : null)
}

function createAdminClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function countWords(content: string): number {
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

function normalizePostInput(body: Record<string, unknown>, creating: boolean) {
  const data: Record<string, unknown> = {}
  const fields = [
    'title',
    'slug',
    'description',
    'content',
    'featured_image',
    'coupang_url',
    'coupang_product_id',
    'product_name',
    'category',
    'tags',
    'seo_keywords',
    'faq',
  ]

  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field] || null
  }
  if (body.product_price !== undefined) {
    data.product_price = body.product_price ? Number(body.product_price) : null
  }
  if (body.content !== undefined) data.word_count = countWords(String(body.content || ''))
  if (body.is_published !== undefined) data.is_published = Boolean(body.is_published)
  if (creating && body.is_published) data.published_at = new Date().toISOString()
  return data
}

async function handleLogin(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}))
  if (body.email !== env('ADMIN_EMAIL') || body.password !== env('ADMIN_PASSWORD')) {
    return json(request, { error: 'Invalid credentials' }, 401)
  }
  return json(request, { authenticated: true, token: await createSession(body.email) })
}

async function handlePosts(request: Request, route: string, url: URL): Promise<Response> {
  const supabase = createAdminClient()
  const detailMatch = route.match(/^\/posts\/([0-9a-f-]+)$/i)

  if (request.method === 'GET' && detailMatch) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', detailMatch[1]).single()
    if (error) return json(request, { error: error.message }, error.code === 'PGRST116' ? 404 : 500)
    return json(request, { post: data })
  }

  if (request.method === 'GET') {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 50))
    const from = (page - 1) * pageSize
    const { data, error, count } = await supabase
      .from('posts')
      .select('id, slug, title, category, is_published, published_at, created_at, updated_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) return json(request, { error: error.message }, 500)
    const totalCount = count || 0
    return json(request, {
      posts: data || [],
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    })
  }

  if (request.method === 'POST') {
    const body = await request.json()
    if (!body.title || !body.slug || !body.content || !body.category) {
      return json(request, { error: 'Missing required fields: title, slug, content, category' }, 400)
    }
    const { data, error } = await supabase
      .from('posts')
      .insert(normalizePostInput(body, true))
      .select()
      .single()
    if (error) return json(request, { error: error.message }, error.code === '23505' ? 409 : 500)
    return json(request, { post: data, deploymentPending: true }, 201)
  }

  if (request.method === 'PUT') {
    const body = await request.json()
    if (!body.id) return json(request, { error: 'Post ID is required' }, 400)

    const updateData = normalizePostInput(body, false)
    updateData.updated_at = new Date().toISOString()
    if (body.is_published) {
      const { data: existing } = await supabase
        .from('posts')
        .select('published_at')
        .eq('id', body.id)
        .single()
      if (!existing?.published_at) updateData.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()
    if (error) return json(request, { error: error.message }, 500)
    return json(request, { post: data, deploymentPending: true })
  }

  if (request.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) return json(request, { error: 'Post ID is required' }, 400)
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return json(request, { error: error.message }, 500)
    return json(request, { success: true, deploymentPending: true })
  }

  return json(request, { error: 'Method not allowed' }, 405)
}

async function handleSettings(request: Request): Promise<Response> {
  const supabase = createAdminClient()
  if (request.method === 'GET') {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (error) return json(request, { error: error.message }, 500)
    return json(request, { settings: data })
  }

  if (request.method === 'PUT') {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.categories !== undefined) {
      if (!Array.isArray(body.categories)) return json(request, { error: 'categories must be an array' }, 400)
      updateData.categories = body.categories
    }
    if (body.site_name !== undefined) updateData.site_name = body.site_name
    if (body.site_description !== undefined) updateData.site_description = body.site_description
    if (Object.keys(updateData).length === 0) return json(request, { error: 'No fields to update' }, 400)

    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...updateData })
      .select()
      .single()
    if (error) return json(request, { error: error.message }, 500)
    return json(request, { settings: data, deploymentPending: true })
  }

  return json(request, { error: 'Method not allowed' }, 405)
}

async function handleUpload(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return json(request, { error: 'No file provided' }, 400)
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return json(request, { error: 'Invalid file type' }, 400)
  if (file.size > MAX_IMAGE_BYTES) return json(request, { error: 'File too large' }, 400)

  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg'
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`
  const filePath = `blog-images/${filename}`
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from('images').upload(filePath, await file.arrayBuffer(), {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) return json(request, { error: `Upload failed: ${error.message}` }, 500)
  const { data } = supabase.storage.from('images').getPublicUrl(filePath)
  return json(request, { success: true, url: data.publicUrl, filename })
}

async function handleGenerateInfoPost(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)
  const body = await request.json()
  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  if (!topic) return json(request, { error: 'Topic is required' }, 400)

  const profile = getSiteProfile()
  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o',
      messages: [
        { role: 'system', content: profile.systemPrompt },
        { role: 'user', content: profile.userPrompt(topic) },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!openAiResponse.ok) {
    return json(request, { error: `OpenAI Error: ${await openAiResponse.text()}` }, 502)
  }

  const completion = await openAiResponse.json()
  const content = completion.choices?.[0]?.message?.content
  if (!content) return json(request, { error: 'Failed to generate content' }, 502)

  let generated
  try {
    generated = JSON.parse(content)
  } catch {
    return json(request, { error: 'Failed to parse generated content' }, 502)
  }

  const supabase = createAdminClient()
  const { data: nextNumber, error: counterError } = await supabase.rpc('reserve_content_number', {
    counter_key: 'generated-info',
  })
  if (counterError) return json(request, { error: counterError.message }, 500)

  const generatedContent = String(generated.content || '')
  const postData = {
    title: generated.title || `${topic} - ${profile.name}`,
    slug: `${profile.slugPrefix}-${nextNumber}`,
    description: generated.description || profile.description(topic),
    content: generatedContent,
    featured_image: null,
    coupang_url: null,
    coupang_product_id: null,
    product_name: null,
    product_price: null,
    category: profile.category,
    tags: Array.isArray(generated.tags) ? generated.tags : [],
    seo_keywords: Array.isArray(generated.seo_keywords) ? generated.seo_keywords : [],
    faq: Array.isArray(generated.faq) ? generated.faq : [],
    word_count: countWords(generatedContent),
    is_published: true,
    published_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('posts').insert(postData).select().single()
  if (error) return json(request, { error: error.message }, 500)
  return json(request, { post: data, message: '정보 포스트가 생성되었습니다.', deploymentPending: true }, 201)
}

function classifySearchIntent(keyword: string): string {
  if (/(추천|비교|순위|베스트|고르는)/.test(keyword)) return 'purchase_compare'
  if (/(비용|가격|얼마|가성비)/.test(keyword)) return 'cost_decision'
  if (/(방법|하는법|관리|예방|어떻게)/.test(keyword)) return 'how_to'
  if (/(증상|이상|울어요|발진|열|병원|걱정)/.test(keyword)) return 'symptom_worry'
  return 'understanding'
}

async function handleGenerateRagPost(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)
  if ((Deno.env.get('SITE_PROFILE') || '') !== 'golf') {
    return json(request, { error: 'RAG generation is only enabled for the golf profile' }, 404)
  }

  const body = await request.json()
  const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  if (!keyword || !category) return json(request, { error: 'keyword and category are required' }, 400)

  const supabase = createAdminClient()
  const { data: existingKeyword } = await supabase
    .from('generation_keywords')
    .select('status, post_slug')
    .eq('keyword', keyword)
    .maybeSingle()

  if (existingKeyword?.status === 'completed' || existingKeyword?.status === 'processing') {
    return json(
      request,
      {
        error: existingKeyword.post_slug
          ? `이미 발행된 키워드입니다: /posts/${existingKeyword.post_slug}`
          : '이미 생성 중인 키워드입니다.',
        existingSlug: existingKeyword.post_slug,
      },
      409,
    )
  }

  await supabase.from('generation_keywords').upsert({
    keyword,
    status: 'processing',
    post_slug: null,
    error_message: null,
    updated_at: new Date().toISOString(),
  })

  try {
    const normalizedCategory = category.replace(/[·\u00B7\u2022\u2027\u30FB/]/g, '').trim()
    const categoryMap: Record<string, string> = {
      기저귀위생: 'baby_hygiene',
      수유이유식: 'baby_feeding',
      유아건강안전: 'baby_health',
      유아교육놀이: 'baby_education',
      출산임신준비: 'pregnancy',
      유모차카시트: 'baby_mobility',
      아기스킨케어: 'baby_skincare',
      침구수면: 'baby_sleep',
      육아용품가이드: 'general',
      리빙생활: 'general',
    }

    let chunks: Array<Record<string, unknown>> = []
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: keyword }),
    })
    if (embeddingResponse.ok) {
      const embeddingPayload = await embeddingResponse.json()
      const embedding = embeddingPayload.data?.[0]?.embedding
      if (embedding) {
        const { data } = await supabase.rpc('match_chunks', {
          query_embedding: embedding,
          match_count: 10,
          filter_category: categoryMap[normalizedCategory] || null,
        })
        chunks = data || []
      }
    }

    const productCategoryMap: Record<string, string> = {
      기저귀위생: 'diaper',
      수유이유식: 'feeding',
      유아건강안전: 'health',
      유아교육놀이: 'education',
      출산임신준비: 'pregnancy',
      유모차카시트: 'mobility',
      아기스킨케어: 'skincare',
      침구수면: 'sleep',
      육아용품가이드: 'general',
      리빙생활: 'general',
    }
    const productCategory = body.productCategory || productCategoryMap[normalizedCategory]
    let products: Array<Record<string, unknown>> = []
    if (productCategory) {
      const { data } = await supabase
        .from('rag_products')
        .select('*')
        .eq('category', productCategory)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5)
      products = data || []
    }

    const { data: recentPosts } = await supabase
      .from('posts')
      .select('slug, title')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20)

    const searchTerms = [keyword, `${category} 추천`, `${keyword} 제품`]
    const coupangLinks = searchTerms.map((term) => ({
      label: `${term} 보러가기`,
      url: `https://www.coupang.com/np/search?q=${encodeURIComponent(term)}`,
    }))
    const intent = typeof body.searchIntent === 'string' ? body.searchIntent : classifySearchIntent(keyword)
    const ragContext = chunks.map((chunk) => chunk.chunk_text).filter(Boolean).join('\n\n---\n\n')
    const productContext = products
      .map((product) =>
        [product.name, product.brand, product.price_range, product.rating, product.affiliate_url]
          .filter(Boolean)
          .join(' | '),
      )
      .join('\n')
    const internalLinks = (recentPosts || [])
      .map((post) => `- ${post.title}: /posts/${post.slug}/`)
      .join('\n')
    const shoppingLinks = coupangLinks.map((link) => `- ${link.label}: ${link.url}`).join('\n')

    const contentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('RAG_OPENAI_MODEL') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 육아·생활 전문 에디터입니다. 검색 의도는 ${intent}입니다.
검증되지 않은 의료 진단이나 수치를 만들지 말고, 제공된 참조 자료만 근거로 활용하세요.
순수 HTML로 6,000자 이상 작성하며 h2, h3, p, table, ul 태그를 사용하세요.
부모의 상황에 공감하는 도입, 정확한 이해, 관리 방법, 체크리스트, 마무리를 포함하세요.
추천 링크를 넣을 때 쿠팡 파트너스 고지 문구를 반드시 포함하세요.

[참조 자료]
${ragContext.slice(0, 12000)}

[제품 자료]
${productContext}

[쇼핑 링크]
${shoppingLinks}

[내부 링크]
${internalLinks}`,
          },
          { role: 'user', content: `"${keyword}" 주제로 ${category} 카테고리의 전문 글을 작성하세요.` },
        ],
        temperature: 0.7,
        max_tokens: 12000,
      }),
    })
    if (!contentResponse.ok) throw new Error(`OpenAI content error: ${await contentResponse.text()}`)
    const contentPayload = await contentResponse.json()
    let cleanContent = String(contentPayload.choices?.[0]?.message?.content || '').trim()
    cleanContent = cleanContent.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '')
    if (cleanContent.length < 1000 || !cleanContent.includes('<h2')) {
      throw new Error(`생성된 콘텐츠 품질 기준을 충족하지 못했습니다 (${cleanContent.length}자)`)
    }

    const metadataResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'SEO 메타데이터를 JSON으로 생성하세요. slug는 영문 소문자, 숫자, 하이픈만 사용하세요.',
          },
          {
            role: 'user',
            content: `키워드: ${keyword}\n본문: ${cleanContent.slice(0, 2500)}\n\n필드: title, description, slug, tags(5개), seo_keywords(5개), faq(질문/답변 5개)`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })
    if (!metadataResponse.ok) throw new Error(`OpenAI metadata error: ${await metadataResponse.text()}`)
    const metadataPayload = await metadataResponse.json()
    const metadata = JSON.parse(metadataPayload.choices?.[0]?.message?.content || '{}')
    const baseSlug = String(metadata.slug || `baby-guide-${crypto.randomUUID().slice(0, 8)}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70)
    const { data: slugExists } = await supabase.from('posts').select('id').eq('slug', baseSlug).maybeSingle()
    const slug = slugExists ? `${baseSlug}-${crypto.randomUUID().slice(0, 6)}` : baseSlug
    const primaryProduct = products[0]
    const affiliateUrl =
      (typeof primaryProduct?.affiliate_url === 'string' && primaryProduct.affiliate_url) || coupangLinks[0].url

    const postData = {
      title: metadata.title || `${keyword} - 카놈소프트`,
      slug,
      description: metadata.description || `${keyword}에 대한 전문 가이드`,
      content: cleanContent,
      featured_image: null,
      coupang_url: affiliateUrl,
      coupang_product_id: null,
      product_name: (typeof primaryProduct?.name === 'string' && primaryProduct.name) || coupangLinks[0].label,
      product_price: null,
      category,
      tags: [...(Array.isArray(metadata.tags) ? metadata.tags : []), 'rag-generated'],
      seo_keywords: Array.isArray(metadata.seo_keywords) ? metadata.seo_keywords : [keyword],
      faq: Array.isArray(metadata.faq) ? metadata.faq : [],
      word_count: countWords(cleanContent),
      is_published: true,
      published_at: new Date().toISOString(),
    }
    const { data: post, error } = await supabase.from('posts').insert(postData).select().single()
    if (error) throw new Error(error.message)

    await supabase
      .from('generation_keywords')
      .update({ status: 'completed', post_slug: slug, updated_at: new Date().toISOString() })
      .eq('keyword', keyword)

    return json(
      request,
      {
        post,
        ragInfo: {
          intent,
          chunksUsed: chunks.length,
          productsIncluded: products.length,
          coupangLinksIncluded: coupangLinks.length,
        },
        message: 'RAG 기반 포스트가 생성되었습니다.',
        deploymentPending: true,
      },
      201,
    )
  } catch (error) {
    await supabase
      .from('generation_keywords')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Generation failed',
        updated_at: new Date().toISOString(),
      })
      .eq('keyword', keyword)
    return json(request, { error: error instanceof Error ? error.message : 'Generation failed' }, 500)
  }
}

async function handleDeploy(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)

  const deployHook = Deno.env.get('DEPLOY_HOOK_URL')
  if (deployHook) {
    const response = await fetch(deployHook, { method: 'POST' })
    if (!response.ok) return json(request, { error: `Deploy hook failed: ${await response.text()}` }, 502)
    return json(request, { accepted: true, provider: 'cloudflare-deploy-hook' }, 202)
  }

  const repository = Deno.env.get('GITHUB_REPOSITORY')
  const token = Deno.env.get('GITHUB_DEPLOY_TOKEN')
  if (!repository || !token) return json(request, { error: 'Deployment trigger is not configured' }, 503)
  const workflow = Deno.env.get('GITHUB_WORKFLOW') || 'deploy-cloudflare.yml'
  const ref = Deno.env.get('DEPLOY_BRANCH') || 'main'
  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref }),
    },
  )
  if (!response.ok) return json(request, { error: `GitHub dispatch failed: ${await response.text()}` }, 502)
  return json(request, { accepted: true, provider: 'github-actions' }, 202)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })

  const origin = request.headers.get('origin')
  if (origin && !getAllowedOrigins().has(origin)) return json(request, { error: 'Origin not allowed' }, 403)

  const url = new URL(request.url)
  const route = url.pathname.replace(/^.*\/admin-api/, '') || '/'

  try {
    if (route === '/health' && request.method === 'GET') return json(request, { ok: true })
    if (route === '/auth/login' && request.method === 'POST') return handleLogin(request)
    if (!(await isAuthorized(request))) return json(request, { error: 'Unauthorized' }, 401)
    if (route === '/auth/check' && request.method === 'GET') return json(request, { authenticated: true })
    if (route === '/auth/logout' && request.method === 'POST') return json(request, { success: true })
    if (route === '/posts' || route.startsWith('/posts/')) return handlePosts(request, route, url)
    if (route === '/settings') return handleSettings(request)
    if (route === '/upload') return handleUpload(request)
    if (route === '/generate-info-post') return handleGenerateInfoPost(request)
    if (route === '/generate-rag-post') return handleGenerateRagPost(request)
    if (route === '/deploy') return handleDeploy(request)
    return json(request, { error: 'Not found' }, 404)
  } catch (error) {
    console.error(error)
    return json(request, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})
