import { getAllPagesInSpace, uuidToId } from 'notion-utils'

import * as config from './config'
import * as types from './types'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { notion } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  console.log('getSiteMap: Starting with rootPageId:', config.rootNotionPageId)

  const partialSiteMap = await getAllPagesImpl(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

  console.log('getSiteMap: Returning', Object.keys(partialSiteMap.canonicalPageMap || {}).length, 'pages')

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const getPage = async (pageId: string, ...args) => {
    console.log('notion getPage', uuidToId(pageId))
    return notion.getPage(pageId, ...args)
  }

  console.log('getAllPagesImpl: Starting getAllPagesInSpace for root:', rootNotionPageId)

  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage
  )

  console.log('getAllPagesImpl: getAllPagesInSpace returned', Object.keys(pageMap).length, 'pages')
  console.log('getAllPagesImpl: pageMap keys:', Object.keys(pageMap))

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        console.error(`Error loading page "${pageId}" - no recordMap`)
        return map
      }

      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })

      if (!canonicalPageId) {
        console.warn('Could not get canonical page id for:', pageId)
        return map
      }

      if (map[canonicalPageId]) {
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })
        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  console.log('getAllPagesImpl: canonicalPageMap has', Object.keys(canonicalPageMap).length, 'entries')

  return {
    pageMap,
    canonicalPageMap
  }
}
