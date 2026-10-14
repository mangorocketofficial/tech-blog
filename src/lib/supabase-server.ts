import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type { Database, Post } from '@/types/database'

// Post list type for listing pages
type PostListItem = Pick<Post, 'id' | 'slug' | 'title' | 'description' | 'featured_image' | 'category' | 'tags' | 'published_at' | 'product_price'>

// Server-side Supabase client (for use in Server Components)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Fetch published posts
async function fetchPublishedPosts(limit?: number): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

// Fetch single post by slug
async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return data
}

// Fetch posts by category
async function fetchPostsByCategory(category: string, limit?: number): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts by category:', error)
    return []
  }

  return data || []
}

// Get all categories with post count
async function fetchCategories(): Promise<{ name: string; count: number }[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('category')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Count posts per category
  const categoryCounts: Record<string, number> = {}
  const posts = (data || []) as { category: string }[]
  posts.forEach((post) => {
    const cat = post.category || 'golf'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  return Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }))
}

// Get all post slugs (for sitemap)
async function fetchAllPostSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching slugs:', error)
    return []
  }

  return data || []
}

// Related post type (minimal fields for performance)
type RelatedPostItem = Pick<Post, 'id' | 'slug' | 'title' | 'featured_image' | 'category'>

// Get related posts (same category, excluding current post)
async function fetchRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3
): Promise<RelatedPostItem[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, featured_image, category')
    .eq('is_published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related posts:', error)
    return []
  }

  return (data || []) as RelatedPostItem[]
}

// Search posts by keyword
async function fetchSearchPosts(query: string, limit: number = 20): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  // Search in title, description, and content using ilike
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,product_name.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching posts:', error)
    return []
  }

  return (data || []) as PostListItem[]
}

// Get paginated posts
async function fetchPaginatedPosts(
  page: number = 1,
  pageSize: number = 9
): Promise<{ posts: PostListItem[]; totalCount: number; totalPages: number }> {
  const supabase = createServerSupabaseClient()

  // Get total count
  const { count, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  if (countError) {
    console.error('Error counting posts:', countError)
    return { posts: [], totalCount: 0, totalPages: 0 }
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)
  const offset = (page - 1) * pageSize

  // Get posts for current page
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching paginated posts:', error)
    return { posts: [], totalCount: 0, totalPages: 0 }
  }

  return {
    posts: (data || []) as PostListItem[],
    totalCount,
    totalPages,
  }
}

// Get popular posts (by view count)
async function fetchPopularPosts(limit: number = 5): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching popular posts:', error)
    return []
  }

  return (data || []) as PostListItem[]
}

// Get all unique tags with count
async function fetchAllTags(): Promise<{ name: string; count: number }[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('tags')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  // Count tag occurrences
  const tagCounts: Record<string, number> = {}
  const posts = (data || []) as { tags: string[] | null }[]
  posts.forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })

  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const POSTS_CACHE_TAG = 'posts'
const CONTENT_CACHE_SECONDS = 21600

export const getPublishedPosts = unstable_cache(fetchPublishedPosts, ['published-posts'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

const getPostBySlugFromCache = unstable_cache(fetchPostBySlug, ['post-by-slug'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})
export const getPostBySlug = cache(getPostBySlugFromCache)

export const getPostsByCategory = unstable_cache(fetchPostsByCategory, ['posts-by-category'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const getCategories = unstable_cache(fetchCategories, ['post-categories'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const getAllPostSlugs = unstable_cache(fetchAllPostSlugs, ['post-slugs'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const getRelatedPosts = unstable_cache(fetchRelatedPosts, ['related-posts'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const searchPosts = unstable_cache(fetchSearchPosts, ['search-posts'], {
  revalidate: 300,
  tags: [POSTS_CACHE_TAG],
})

export const getPaginatedPosts = unstable_cache(fetchPaginatedPosts, ['paginated-posts'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const getPopularPosts = unstable_cache(fetchPopularPosts, ['popular-posts'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

export const getAllTags = unstable_cache(fetchAllTags, ['post-tags'], {
  revalidate: CONTENT_CACHE_SECONDS,
  tags: [POSTS_CACHE_TAG],
})

// Increment view count (optional - requires RPC function in Supabase)
// export async function incrementViewCount(postId: string) {
//   const supabase = createServerSupabaseClient()
//   await supabase.rpc('increment_view_count', { post_id: postId })
// }
