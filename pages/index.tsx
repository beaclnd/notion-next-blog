import * as React from 'react'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, postsPerPage } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

function getCollectionId(recordMap: ExtendedRecordMap): string | undefined {
  // Get the collection ID from the entry key, not from the value's id property
  const collectionEntry = Object.entries(recordMap.collection)[0]
  return collectionEntry?.[0]
}

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
    const collectionId = getCollectionId(recordMap)
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    console.log('Index getStaticProps: collection found:', !!collection)
    console.log('Index getStaticProps: collectionId:', collectionId)
    console.log('Index getStaticProps: collection_query keys:', JSON.stringify(Object.keys(recordMap.collection_query || {})))

    if (collectionId && collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        console.log('Index getStaticProps: galleryViewId:', galleryViewId)

        if (galleryViewId) {
          const collectionQueries = recordMap.collection_query[collectionId]
          console.log('Index getStaticProps: collectionQueries found:', !!collectionQueries)

          const query = collectionQueries?.[galleryViewId]
          console.log('Index getStaticProps: query found:', !!query)

          const queryResults = query?.collection_group_results ?? query

          if (queryResults?.blockIds) {
            curPage = 1
            const originalLength = queryResults.blockIds.length
            totalPosts = originalLength
            console.log('Index getStaticProps: totalPosts:', totalPosts)

            // Create a new array instead of mutating in place
            const slicedBlockIds = queryResults.blockIds.slice(0, postsPerPage)
            queryResults.blockIds = slicedBlockIds
            console.log('Index getStaticProps: sliced from', originalLength, 'to', slicedBlockIds.length, 'posts')
          } else {
            console.log('Index getStaticProps: no blockIds found in queryResults')
          }
        } else {
          console.log('Index getStaticProps: no galleryViewId found')
        }
    } else {
        console.log('Index getStaticProps: no collectionId or collection found')
    }

    console.log('Index getStaticProps: FINAL curPage:', curPage, 'totalPosts:', totalPosts)
    return { props: {...props, curPage, totalPosts} }
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
