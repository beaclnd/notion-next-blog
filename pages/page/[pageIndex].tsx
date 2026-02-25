import * as React from 'react'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, postsPerPage, rootNotionPageId } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

function getGalleryViewId(recordMap: ExtendedRecordMap): string | undefined {
  const views = Object.values(recordMap.collection_view)
  console.log('Pagination: Found', views.length, 'collection views')

  for (const view of views) {
    const viewValue = (view as any)?.value as CollectionView | undefined
    console.log('Pagination: Checking view type:', viewValue?.type, 'id:', viewValue?.id)
    if (viewValue?.type === 'gallery') {
      console.log('Pagination: Found gallery view with id:', viewValue.id)
      return viewValue.id
    }
  }

  // Fallback to first view if no gallery found
  if (views.length > 0) {
    const firstView = (views[0] as any)?.value as CollectionView | undefined
    console.log('Pagination: No gallery view found, using first view:', firstView?.id)
    return firstView?.id
  }

  console.log('Pagination: No views found')
  return undefined
}

export const getStaticProps = async (context) => {
  try {
    const curPage = parseInt(context?.params?.pageIndex)
    console.log('Pagination getStaticProps: page', curPage)

    const props = await resolveNotionPage(domain, rootNotionPageId)

    // For pagination
    let totalPosts = 0
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    console.log('Pagination getStaticProps: collection found:', !!collection)
    console.log('Pagination getStaticProps: collection id:', collection?.id)
    console.log('Pagination getStaticProps: collection_query keys:', Object.keys(recordMap.collection_query || {}))

    if (collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        console.log('Pagination getStaticProps: galleryViewId:', galleryViewId)

        if (galleryViewId) {
          const query = recordMap.collection_query[collection.id]?.[galleryViewId]
          console.log('Pagination getStaticProps: query found:', !!query)
          console.log('Pagination getStaticProps: query keys:', query ? Object.keys(query) : 'none')

          const queryResults = query?.collection_group_results ?? query
          if (queryResults) {
            totalPosts = queryResults.blockIds.length
            console.log('Pagination getStaticProps: totalPosts:', totalPosts)
            queryResults.blockIds = queryResults.blockIds.slice(
              (curPage - 1) * postsPerPage,
              curPage * postsPerPage
            )
            console.log('Pagination getStaticProps: sliced blockIds for page', curPage, ':', queryResults.blockIds.length)
          } else {
            console.log('Pagination getStaticProps: no queryResults')
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

export async function getStaticPaths() {
  console.log('Pagination getStaticPaths: starting')
  console.log('Pagination getStaticPaths: isDev:', isDev)
  console.log('Pagination getStaticPaths: NODE_ENV:', process.env.NODE_ENV)

  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    let totalPosts = 0
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    console.log('Pagination getStaticPaths: collection found:', !!collection)

    if (collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        console.log('Pagination getStaticPaths: galleryViewId:', galleryViewId)

        if (galleryViewId) {
          const query = recordMap.collection_query[collection.id]?.[galleryViewId]
          const queryResults = query?.collection_group_results ?? query
          if (queryResults) {
            totalPosts = queryResults.blockIds.length
            console.log('Pagination getStaticPaths: totalPosts:', totalPosts)
          }
        }
    }

    if (totalPosts > 0) {
        const totalPages = Math.ceil(totalPosts / postsPerPage)
        console.log('Pagination getStaticPaths: totalPages:', totalPages)

        // The index page is the page 1, so starting with index 2
        const paths = Array.from(
            { length: totalPages - 1 },
            (_, i) => ({ params: { pageIndex: i + 2 + '' } })
        )
        console.log('Pagination getStaticPaths: generated paths:', paths)
        return {
            paths,
            fallback: true
        }
    }

    console.log('Pagination getStaticPaths: no totalPosts, returning empty paths')
  }

  return {
    paths: [],
    fallback: true
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
