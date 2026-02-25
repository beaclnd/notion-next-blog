import * as React from 'react'
import { GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { PageProps, Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)

    return { props }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    // Return 404 for pages that can't be fetched instead of failing the build
    return {
      props: {
        site: {
          domain,
          name: 'Not Found',
          rootNotionPageId: '',
          rootNotionSpaceId: null,
          description: ''
        },
        recordMap: null as any,
        pageId: rawPageId,
        error: {
          statusCode: 404,
          message: `Unable to load page "${rawPageId}"`
        }
      }
    }
  }
}

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true
    }
  }

  const siteMap = await getSiteMap()

  const staticPaths = {
    paths: Object.keys(siteMap.canonicalPageMap).map((pageId) => ({
      params: {
        pageId
      }
    })),
    // paths: [],
    fallback: true
  }

  console.log(staticPaths.paths)
  return staticPaths
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
