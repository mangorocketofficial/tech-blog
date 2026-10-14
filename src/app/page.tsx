import BlogHomePage from '@/components/BlogHomePage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <BlogHomePage currentPage={1} />
}
