import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/SearchClient'

export const metadata: Metadata = {
  title: '검색 결과',
  description: '테크매니아 검색 - 다양한 테크 콘텐츠를 검색하세요.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <SearchClient />
    </Suspense>
  )
}
