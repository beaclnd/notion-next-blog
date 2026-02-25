import type { GetStaticProps } from 'next'

import { host } from '@/lib/config'

export const getStaticProps: GetStaticProps = async () => {
  // Generate robots.txt content at build time
  const isProduction = process.env.VERCEL_ENV === 'production'

  const content = isProduction
    ? `User-agent: *
Allow: /
Disallow: /api/*

Sitemap: ${host}/sitemap.xml
`
    : `User-agent: *
Disallow: /

Sitemap: ${host}/sitemap.xml
`

  return {
    props: {
      content
    }
  }
}

export default function RobotsTxt({ content }: { content: string }) {
  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '20px' }}>
      {content}
    </pre>
  )
}
