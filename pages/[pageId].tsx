import * as React from 'react'
import { GetStaticProps } from 'next'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'
import { getCanonicalPageId } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, includeNotionIdInUrls } from '@/lib/config'
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

  try {
    const siteMap = await getSiteMap()

    let pageIds = Object.keys(siteMap.canonicalPageMap)

    // If siteMap only returns root page, manually extract from collection
    if (pageIds.length <= 1) {
      const props = await resolveNotionPage(domain)
      const recordMap = (props as any).recordMap as ExtendedRecordMap

      if (recordMap) {
        const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

        if (collection) {
          const views = Object.values(recordMap.collection_view)
          let viewId: string | undefined

          for (const view of views) {
            const viewValue = (view as any)?.value as CollectionView | undefined
            if (viewValue?.type === 'gallery') {
              viewId = viewValue.id
              break
            }
          }

          if (!viewId && views.length > 0) {
            viewId = (views[0] as any)?.value?.id
          }

          const query = viewId ? recordMap.collection_query[collection.id]?.[viewId] : null
          const queryResults = query?.collection_group_results ?? query

          if (queryResults?.blockIds) {
            const allBlockIds = queryResults.blockIds

            pageIds = allBlockIds.map((blockId: string) => {
              const canonicalId = getCanonicalPageId(blockId, recordMap, {
                uuid: !!includeNotionIdInUrls
              })
              return canonicalId || blockId
            }).filter(Boolean)
          }
        }
      }
    }

    return {
      paths: pageIds.map((pageId) => ({
        params: {
          pageId
        }
      })),
      fallback: true
    }
  } catch (err) {
    console.error('getStaticPaths error:', err)
    return {
      paths: [],
      fallback: true
    }
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
