import type { AnchorHTMLAttributes, ReactNode } from 'react'

type StaticLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  prefetch?: boolean
  children: ReactNode
}

export default function StaticLink({ href, prefetch: _prefetch, children, ...props }: StaticLinkProps) {
  void _prefetch
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
