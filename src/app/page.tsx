import BlogHomePage from '@/components/BlogHomePage'

export const revalidate = 21600

export default function HomePage() {
  return <BlogHomePage currentPage={1} />
}
