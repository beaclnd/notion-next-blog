import * as React from 'react'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, postsPerPage } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

function getGalleryViewId(recordMap: ExtendedRecordMap): string | undefined {
  const views = Object.values(recordMap.collection_view)

  for (const view of views) {
    const viewValue = (view as any)?.value as CollectionView | undefined
    if (viewValue?.type === 'gallery') {
      return viewValue.id
    }
  }

  // Fallback to first view if no gallery found
  if (views.length > 0) {
    const firstView = (views[0] as any)?.value as CollectionView | undefined
    return firstView?.id
  }

  return undefined
}

export const getStaticProps = async () => {
  try {
    console.log('Index getStaticProps: starting')
    const props = await resolveNotionPage(domain)

    // For pagination
    let curPage = 1;
    let totalPosts = 0;
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    console.log('Index getStaticProps: collection found:', !!collection)

    if (collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        console.log('Index getStaticProps: galleryViewId:', galleryViewId)

        if (galleryViewId) {
          const query = recordMap.collection_query[collection.id]?.[galleryViewId]
          const queryResults = query?.collection_group_results ?? query

          if (queryResults) {
            curPage = 1
            totalPosts = queryResults.blockIds.length
            console.log('Index getStaticProps: totalPosts:', totalPosts)
            queryResults.blockIds = queryResults.blockIds.slice(0, postsPerPage)
            console.log('Index getStaticProps: sliced to', queryResults.blockIds.length, 'posts for page 1')
          }
        }
    }

    return { props: {...props, curPage, totalPosts } }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
