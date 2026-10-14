import { notFound, permanentRedirect } from 'next/navigation'
import BlogHomePage from '@/components/BlogHomePage'
import { getPaginatedPosts } from '@/lib/supabase-server'
import type { Metadata } from 'next'

export const revalidate = 21600

interface PaginatedHomePageProps {
  params: Promise<{ page: string }>
}

export async function generateStaticParams() {
  const { totalPages } = await getPaginatedPosts(1, 9)

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }))
}

export async function generateMetadata({ params }: PaginatedHomePageProps): Promise<Metadata> {
  const { page } = await params
  return {
    alternates: { canonical: `/page/${page}` },
  }
}

export default async function PaginatedHomePage({ params }: PaginatedHomePageProps) {
  const { page } = await params
  const currentPage = Number(page)

  if (!Number.isInteger(currentPage) || currentPage < 1) {
    notFound()
  }

  if (currentPage === 1) {
    permanentRedirect('/')
  }

  const { totalPages } = await getPaginatedPosts(currentPage, 9)
  if (totalPages > 0 && currentPage > totalPages) {
    notFound()
  }

  return <BlogHomePage currentPage={currentPage} />
}
