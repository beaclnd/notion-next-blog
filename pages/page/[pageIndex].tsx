import * as React from 'react'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, postsPerPage, rootNotionPageId } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

function getCollectionId(recordMap: ExtendedRecordMap): string | undefined {
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

  if (views.length > 0) {
    const firstView = (views[0] as any)?.value as CollectionView | undefined
    return firstView?.id
  }

  return undefined
}

export const getStaticProps = async (context) => {
  try {
    const curPage = parseInt(context?.params?.pageIndex)
    const props = await resolveNotionPage(domain, rootNotionPageId)

    let totalPosts = 0
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collectionId = getCollectionId(recordMap)
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    if (collectionId && collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        if (galleryViewId) {
          const query = recordMap.collection_query[collectionId]?.[galleryViewId]
          const queryResults = query?.collection_group_results ?? query
          if (queryResults) {
            totalPosts = queryResults.blockIds.length
            queryResults.blockIds = queryResults.blockIds.slice(
              (curPage - 1) * postsPerPage,
              curPage * postsPerPage
            )
          }
        }
    }

    return { props: {...props, curPage, totalPosts } }
  } catch (err) {
    console.error('page error', domain, err)
    throw err
  }
}

export async function getStaticPaths() {
  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    let totalPosts = 0
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collectionId = getCollectionId(recordMap)
    const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

    if (collectionId && collection) {
        const galleryViewId = getGalleryViewId(recordMap)
        if (galleryViewId) {
          const query = recordMap.collection_query[collectionId]?.[galleryViewId]
          const queryResults = query?.collection_group_results ?? query
          if (queryResults) {
            totalPosts = queryResults.blockIds.length
          }
        }
    }

    if (totalPosts > 0) {
        const totalPages = Math.ceil(totalPosts / postsPerPage)
        const paths = Array.from(
            { length: totalPages - 1 },
            (_, i) => ({ params: { pageIndex: i + 2 + '' } })
        )
        return {
            paths,
            fallback: true
        }
    }
  }

  return {
    paths: [],
    fallback: true
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
