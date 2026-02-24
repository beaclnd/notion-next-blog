import React from 'react'
import omit from 'lodash.omit'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'
import { normalizeTitle } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, rootNotionPageId } from 'lib/config'
import { resolveNotionPage } from 'lib/resolve-notion-page'

const tagsPropertyNameLowerCase = 'tags'

export const getStaticProps = async (context) => {
  const rawTagName = (context?.params?.tagName as string) || ''

  try {
    const props = await resolveNotionPage(domain, rootNotionPageId)
    let propertyToFilterName: string = null

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

      if (collection) {
        const galleryView = (Object.values(recordMap.collection_view).find(
          (view) => (view?.value as CollectionView | undefined)?.type === 'gallery'
        )?.value as CollectionView | undefined)

        if (galleryView) {
          const galleryBlock = Object.values(recordMap.block).find(
            (block) =>
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.type === 'collection_view' &&
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.view_ids?.includes(galleryView.id)
          )

          const galleryBlockValue = galleryBlock?.value as { id?: string } | undefined
          if (galleryBlockValue?.id && collection.schema) {
            recordMap.block = {
              [galleryBlockValue.id]: galleryBlock,
              ...omit(recordMap.block, [galleryBlockValue.id])
            }

            const propertyToFilter = Object.entries(collection.schema).find(
              (property) =>
                (property[1] as { name?: string } | undefined)?.name?.toLowerCase() === tagsPropertyNameLowerCase
            )
            const propertyToFilterId = propertyToFilter?.[0]
            const filteredValue = normalizeTitle(rawTagName)
            const propertyToFilterSchemaEntry = propertyToFilter?.[1] as { options?: { value: string }[] } | undefined
            propertyToFilterName = propertyToFilterSchemaEntry?.options?.find(
              (option) => normalizeTitle(option.value) === filteredValue
            )?.value

            if (propertyToFilterId && filteredValue) {
              const query =
                recordMap.collection_query[collection.id]?.[galleryView.id]
              const queryResults = query?.collection_group_results ?? query

              if (queryResults) {
                queryResults.blockIds = queryResults.blockIds.filter((id) => {
                  const block = recordMap.block[id]?.value as { properties?: any } | undefined
                  if (!block || !block.properties) {
                    return false
                  }

                  const value = block.properties[propertyToFilterId]?.[0]?.[0]
                  if (!value) {
                    return false
                  }

                  const values = value.split(',')
                  if (
                    !values.find(
                      (value: string) => normalizeTitle(value) === filteredValue
                    )
                  ) {
                    return false
                  }

                  return true
                })
              }
            }
          }
        }
      }
    }

    return {
      props: {
        ...props,
        tagsPage: true,
        propertyToFilterName
      },
      revalidate: 10
    }
  } catch (err) {
    console.error('page error', domain, rawTagName, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collection = Object.values(recordMap.collection)[0]?.value as Collection | undefined

      if (collection && collection.schema) {
        const propertyToFilterSchema = Object.entries(collection.schema).find(
          (property) =>
            (property[1] as { name?: string } | undefined)?.name?.toLowerCase() === tagsPropertyNameLowerCase
        )?.[1] as { options?: { value: string }[] } | undefined

        const paths = (propertyToFilterSchema?.options ?? [])
          .map((option) => normalizeTitle(option.value))
          .filter(Boolean)
          .map((tag) => ({params: {tagName: tag}}))

        return {
          paths,
          fallback: true
        }
      }
    }
  }

  return {
    paths: [],
    fallback: true
  }
}

export default function NotionTagsPage(props) {
  return <NotionPage {...props} />
}