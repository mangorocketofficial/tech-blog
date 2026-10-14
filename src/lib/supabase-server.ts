import 'server-only'

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Post } from '@/types/database'

type PostListItem = Pick<
  Post,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'featured_image'
  | 'category'
  | 'tags'
  | 'published_at'
  | 'product_price'
>

type RelatedPostItem = Pick<Post, 'id' | 'slug' | 'title' | 'featured_image' | 'category'>

interface ContentSnapshot {
  generatedAt: string
  posts: Post[]
}

let snapshot: ContentSnapshot | null = null
let postsBySlug: Map<string, Post> | null = null

function getSnapshot(): ContentSnapshot {
  if (snapshot) return snapshot

  const snapshotPath = path.join(process.cwd(), '.content-cache', 'content.json')
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as ContentSnapshot
  } catch (error) {
    throw new Error(
      `Content snapshot is unavailable. Run "npm run content:sync" first. ${
        error instanceof Error ? error.message : ''
      }`,
    )
  }

  return snapshot
}

function getPosts(): Post[] {
  return getSnapshot().posts
}

function toListItem(post: Post): PostListItem {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    featured_image: post.featured_image,
    category: post.category,
    tags: post.tags,
    published_at: post.published_at,
    product_price: post.product_price,
  }
}

export async function getPublishedPosts(limit?: number): Promise<PostListItem[]> {
  const posts = getPosts()
  return (limit ? posts.slice(0, limit) : posts).map(toListItem)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!postsBySlug) {
    postsBySlug = new Map(getPosts().map((post) => [post.slug, post]))
  }
  return postsBySlug.get(slug) ?? null
}

export async function getPostsByCategory(
  category: string,
  limit?: number,
): Promise<PostListItem[]> {
  const posts = getPosts().filter((post) => post.category === category)
  return (limit ? posts.slice(0, limit) : posts).map(toListItem)
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>()
  for (const post of getPosts()) {
    const category = post.category || '기타'
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return Array.from(counts, ([name, count]) => ({ name, count }))
}

export async function getAllPostSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  return getPosts().map((post) => ({ slug: post.slug, updated_at: post.updated_at }))
}

export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit = 3,
): Promise<RelatedPostItem[]> {
  return getPosts()
    .filter((post) => post.slug !== currentSlug && post.category === category)
    .slice(0, limit)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      featured_image: post.featured_image,
      category: post.category,
    }))
}

export async function getPaginatedPosts(
  page = 1,
  pageSize = 9,
): Promise<{ posts: PostListItem[]; totalCount: number; totalPages: number }> {
  const posts = getPosts()
  const totalCount = posts.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const offset = (page - 1) * pageSize

  return {
    posts: posts.slice(offset, offset + pageSize).map(toListItem),
    totalCount,
    totalPages,
  }
}

export async function getPopularPosts(limit = 5): Promise<PostListItem[]> {
  return [...getPosts()]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, limit)
    .map(toListItem)
}

export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>()
  for (const post of getPosts()) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count,
  )
}
