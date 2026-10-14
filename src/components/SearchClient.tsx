'use client'

import Image from 'next/image'
import Link from '@/components/StaticLink'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchPost {
  id: string
  slug: string
  title: string
  description: string | null
  featured_image: string | null
  category: string
  tags: string[] | null
  product_name: string | null
}

export default function SearchClient() {
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const [input, setInput] = useState(query)
  const [index, setIndex] = useState<SearchPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) throw new Error('검색 인덱스를 불러오지 못했습니다.')
        return response.json()
      })
      .then((data: SearchPost[]) => setIndex(data))
      .finally(() => setLoading(false))
  }, [])

  const posts = useMemo(() => {
    if (!query) return []
    const normalized = query.toLocaleLowerCase('ko-KR')
    return index
      .filter((post) => {
        const searchable = [
          post.title,
          post.description,
          post.product_name,
          post.category,
          ...(post.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('ko-KR')
        return searchable.includes(normalized)
      })
      .slice(0, 50)
  }, [index, query])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = input.trim()
    window.location.assign(value ? `/search/?q=${encodeURIComponent(value)}` : '/search/')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-green-600 hover:text-green-700 text-sm">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">검색 결과</h1>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="검색어를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center py-12 text-gray-500">검색 데이터를 불러오는 중입니다.</p>
        ) : !query ? (
          <p className="text-center py-12 text-gray-500">검색어를 입력해주세요.</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">&quot;{query}&quot;에 대한 검색 결과가 없습니다.</p>
            <Link href="/" className="text-green-600 hover:text-green-700 mt-4 inline-block">
              모든 글 보기
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              &quot;{query}&quot; 검색 결과: {posts.length}개
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/posts/${post.slug}/`} prefetch={false}>
                    <div className="relative h-48 bg-gray-200">
                      {post.featured_image ? (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          이미지 없음
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h2 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">
                        {post.title}
                      </h2>
                      {post.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
