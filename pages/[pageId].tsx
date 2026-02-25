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

  try {
    // First, try to get all pages from site map
    const siteMap = await getSiteMap()

    let pageIds = Object.keys(siteMap.canonicalPageMap)
    console.log('getStaticPaths: siteMap returned', pageIds.length, 'pages')
    console.log('getStaticPaths: siteMap pageIds:', pageIds)

    // If siteMap only returns root page, manually extract from collection
    if (pageIds.length <= 1) {
      console.log('getStaticPaths: Falling back to collection extraction')

      const props = await resolveNotionPage(domain)
      const recordMap = (props as any).recordMap as ExtendedRecordMap

      if (recordMap) {
        const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

        if (collection) {
          // Try to find a gallery view first, then any view
          const views = Object.values(recordMap.collection_view)
          let viewId: string | undefined

          for (const view of views) {
            const viewValue = (view as any)?.value as CollectionView | undefined
            if (viewValue?.type === 'gallery') {
              viewId = viewValue.id
              break
            }
          }

          // If no gallery view, use the first available view
          if (!viewId && views.length > 0) {
            viewId = (views[0] as any)?.value?.id
          }

          const query = viewId ? recordMap.collection_query[collection.id]?.[viewId] : null
          const queryResults = query?.collection_group_results ?? query

          if (queryResults?.blockIds) {
            // Get all block IDs from the collection (not just first page)
            const allBlockIds = queryResults.blockIds
            console.log('getStaticPaths: Found', allBlockIds.length, 'blocks in collection')

            // Convert block IDs to canonical page IDs (slugs)
            pageIds = allBlockIds.map((blockId: string) => {
              const canonicalId = getCanonicalPageId(blockId, recordMap, {
                uuid: !!includeNotionIdInUrls
              })
              return canonicalId || blockId
            }).filter(Boolean)

            console.log('getStaticPaths: Extracted', pageIds.length, 'page IDs from collection')
          } else {
            console.log('getStaticPaths: No query results found in collection')
          }
        } else {
          console.log('getStaticPaths: No collection found in recordMap')
        }
      } else {
        console.log('getStaticPaths: No recordMap available')
      }
    }

    const staticPaths = {
      paths: pageIds.map((pageId) => ({
        params: {
          pageId
        }
      })),
      fallback: true
    }

    console.log('getStaticPaths: Final paths count:', staticPaths.paths.length)
    console.log('getStaticPaths: Final paths:', staticPaths.paths.slice(0, 5), '...')
    return staticPaths
  } catch (err) {
    console.error('getStaticPaths error:', err)
    // Return empty paths on error to avoid build failure
    return {
      paths: [],
      fallback: true
    }
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
