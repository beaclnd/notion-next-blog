import * as React from 'react'
import { ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, postsPerPage, rootNotionPageId } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async (context) => {
  try {
    const curPage = parseInt(context?.params?.pageIndex)
    const props = await resolveNotionPage(domain, rootNotionPageId)

    // For pagination
    let totalPosts: number;
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collection = Object.values(recordMap.collection)[0]?.value
    if (collection) {
        const galleryViewId = Object.values(recordMap.collection_view).find(
          (view) => view.value?.type === 'gallery'
        )?.value?.id
        const query =
          recordMap.collection_query[collection.id]?.[galleryViewId]
        const queryResults = query?.collection_group_results ?? query
        if (queryResults) {
          totalPosts = queryResults.blockIds.length
          queryResults.blockIds = queryResults.blockIds.slice(
            (curPage - 1) * postsPerPage, 
            curPage * postsPerPage
          )
        }
    }

    return { props: {...props, curPage, totalPosts }, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    let totalPosts: number;
    const recordMap = (props as any).recordMap as ExtendedRecordMap
    const collection = Object.values(recordMap.collection)[0]?.value
    if (collection) {
        const galleryViewId = Object.values(recordMap.collection_view).find(
          (view) => view.value?.type === 'gallery'
        )?.value?.id
        const query =
          recordMap.collection_query[collection.id]?.[galleryViewId]
        const queryResults = query?.collection_group_results ?? query
        if (queryResults) {
          totalPosts = queryResults.blockIds.length
        }
    }
    if (totalPosts) {
        const totalPages = Math.ceil(totalPosts / postsPerPage)
        // The index page is the page 1, so starting with index 2
        const paths = Array.from(
            { length: totalPages - 1 }, 
            (_, i) => ({ params: { pageIndex: i + 2 } })
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
