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
        console.log('Index getStaticProps: collection_query:', JSON.stringify(Object.keys(recordMap.collection_query || {})))

        if (galleryViewId) {
          const collectionQueries = recordMap.collection_query[collection.id]
          console.log('Index getStaticProps: collectionQueries for', collection.id, ':', !!collectionQueries)
          console.log('Index getStaticProps: collectionQueries keys:', collectionQueries ? Object.keys(collectionQueries) : 'none')

          const query = collectionQueries?.[galleryViewId]
          console.log('Index getStaticProps: query for galleryView:', !!query)

          const queryResults = query?.collection_group_results ?? query
          console.log('Index getStaticProps: queryResults type:', typeof queryResults)
          console.log('Index getStaticProps: queryResults keys:', queryResults ? Object.keys(queryResults) : 'none')

          if (queryResults?.blockIds) {
            curPage = 1
            const originalLength = queryResults.blockIds.length
            totalPosts = originalLength
            console.log('Index getStaticProps: totalPosts:', totalPosts)
            console.log('Index getStaticProps: original blockIds:', queryResults.blockIds.slice(0, 5), '...')

            // Create a new array instead of mutating in place
            const slicedBlockIds = queryResults.blockIds.slice(0, postsPerPage)
            queryResults.blockIds = slicedBlockIds
            console.log('Index getStaticProps: sliced blockIds:', slicedBlockIds)
            console.log('Index getStaticProps: sliced from', originalLength, 'to', slicedBlockIds.length, 'posts')

            // Also log the collection view block to see if it has child blocks
            const collectionViewBlocks = Object.entries(recordMap.block).filter(([_, b]) => {
              const blockValue = (b as any)?.value
              return blockValue?.type === 'collection_view'
            })
            console.log('Index getStaticProps: collection_view blocks count:', collectionViewBlocks.length)
            collectionViewBlocks.forEach(([id, b]) => {
              const blockValue = (b as any)?.value
              console.log('Index getStaticProps: collection_view block', id, 'content:', blockValue?.content?.length)
            })
          } else {
            console.log('Index getStaticProps: no blockIds found in queryResults')
          }
        } else {
          console.log('Index getStaticProps: no galleryViewId found')
        }
    } else {
        console.log('Index getStaticProps: no collection found')
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
