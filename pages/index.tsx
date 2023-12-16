import * as React from 'react'
import { ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain, postsPerPage } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    // For pagination
    let curPage: number, totalPosts: number;
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
          curPage = 1
          totalPosts = queryResults.blockIds.length
          queryResults.blockIds = queryResults.blockIds.slice(0, postsPerPage)
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

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
