import React from 'react'
import omit from 'lodash.omit'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'
import { normalizeTitle } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, rootNotionPageId } from 'lib/config'
import { resolveNotionPage } from 'lib/resolve-notion-page'

const tagsPropertyNameLowerCase = 'tags'

function getCollectionId(recordMap: ExtendedRecordMap): string | undefined {
  const collectionEntry = Object.entries(recordMap.collection)[0]
  return collectionEntry?.[0]
}

function getGalleryView(recordMap: ExtendedRecordMap): CollectionView | undefined {
  const views = Object.values(recordMap.collection_view)

  for (const view of views) {
    const viewValue = (view as any)?.value as CollectionView | undefined
    if (viewValue?.type === 'gallery') {
      return viewValue
    }
  }

  if (views.length > 0) {
    const firstView = (views[0] as any)?.value as CollectionView | undefined
    return firstView
  }

  return undefined
}

export const getStaticProps = async (context) => {
  const rawTagName = (context?.params?.tagName as string) || ''

  try {
    const props = await resolveNotionPage(domain, rootNotionPageId)
    let propertyToFilterName: string = null

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collectionId = getCollectionId(recordMap)
      const collectionData = Object.values(recordMap.collection)[0] as any
      const schema = collectionData?.value?.value?.schema

      if (collectionId && schema) {
        const galleryView = getGalleryView(recordMap)

        if (galleryView) {
          const galleryBlock = Object.values(recordMap.block).find(
            (block) =>
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.type === 'collection_view' &&
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.view_ids?.includes(galleryView.id)
          )

          const galleryBlockValue = galleryBlock?.value as { id?: string } | undefined

          if (galleryBlockValue?.id) {
            recordMap.block = {
              [galleryBlockValue.id]: galleryBlock,
              ...omit(recordMap.block, [galleryBlockValue.id])
            }

            const propertyToFilter = schema ? Object.entries(schema).find(
              (property) => {
                const propName = (property[1] as { name?: string } | undefined)?.name?.toLowerCase()
                return propName === tagsPropertyNameLowerCase
              }
            ) : null
            const propertyToFilterId = propertyToFilter?.[0]
            const filteredValue = normalizeTitle(rawTagName)
            const propertyToFilterSchemaEntry = propertyToFilter?.[1] as { options?: { value: string }[] } | undefined

            propertyToFilterName = propertyToFilterSchemaEntry?.options?.find(
              (option) => normalizeTitle(option.value) === filteredValue
            )?.value

            if (propertyToFilterId && filteredValue) {
              const query =
                recordMap.collection_query[collectionId]?.[galleryView.id]
              const queryResults = query?.collection_group_results ?? query

              if (queryResults) {
                // Helper to get block properties (handles nested structure: block.value.value.properties)
                const getBlockProperties = (id: string): any => {
                  const blockData = recordMap.block[id] as any
                  return blockData?.value?.value?.properties
                }

                const filteredBlockIds = queryResults.blockIds.filter((id) => {
                  const properties = getBlockProperties(id)
                  if (!properties) {
                    return false
                  }

                  const value = properties[propertyToFilterId]?.[0]?.[0]
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

                queryResults.blockIds = filteredBlockIds

                // Also need to update the collection view block's content to match
                // because react-notion-x renders based on block content, not queryResults
                if (galleryBlockValue?.id && recordMap.block[galleryBlockValue.id]?.value) {
                  const galleryBlock = recordMap.block[galleryBlockValue.id].value as any
                  galleryBlock.content = filteredBlockIds
                }
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
      }
    }
  } catch (err) {
    console.error('page error', domain, rawTagName, err)
    throw err
  }
}

export async function getStaticPaths() {
  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collectionData = Object.values(recordMap.collection)[0] as any
      const schema = collectionData?.value?.value?.schema

      if (schema) {
        const propertyToFilter = Object.entries(schema).find(
          (property) =>
            (property[1] as { name?: string } | undefined)?.name?.toLowerCase() === tagsPropertyNameLowerCase
        )
        const propertyToFilterSchema = propertyToFilter?.[1] as { options?: { value: string }[] } | undefined

        if (propertyToFilterSchema?.options) {
          const paths = (propertyToFilterSchema.options)
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
  }

  return {
    paths: [],
    fallback: true
  }
}

export default function NotionTagsPage(props) {
  // Client-side filtering fallback for dev mode
  const [filteredProps, setFilteredProps] = React.useState(props)
  const hasFiltered = React.useRef(false)

  React.useEffect(() => {
    if (hasFiltered.current) return

    if (props.recordMap && props.tagsPage) {
      hasFiltered.current = true
      const recordMap = props.recordMap as ExtendedRecordMap
      let tagName = (props as any).propertyToFilterName
      if (!tagName && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/')
        const lastPart = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]
        tagName = decodeURIComponent(lastPart || '')
      }

      if (tagName) {
        const normalizedTag = normalizeTitle(tagName)
        const collectionData = Object.values(recordMap.collection)[0] as any
        const schema = collectionData?.value?.value?.schema

        if (schema) {
          const tagsProperty = Object.entries(schema).find(([_, prop]: [string, any]) =>
            prop?.name?.toLowerCase() === 'tags'
          )
          const propertyToFilterId = tagsProperty?.[0]

          if (propertyToFilterId) {
            const collectionId = Object.keys(recordMap.collection)[0]
            const collectionViewId = Object.keys(recordMap.collection_view)[0]

            const query = recordMap.collection_query?.[collectionId]?.[collectionViewId]
            const queryResults = query?.collection_group_results ?? query

            if (queryResults?.blockIds) {
              const originalBlockIds = [...queryResults.blockIds]

              const getBlockProperties = (id: string): any => {
                const blockData = recordMap.block[id] as any
                return blockData?.value?.value?.properties
              }

              const filteredBlockIds = originalBlockIds.filter((id: string) => {
                const properties = getBlockProperties(id)
                const value = properties?.[propertyToFilterId]?.[0]?.[0]
                if (!value) return false
                const values = value.split(',')
                return values.find((v: string) => normalizeTitle(v) === normalizedTag)
              })

              if (filteredBlockIds.length !== originalBlockIds.length || filteredBlockIds.length === 0) {
                const newRecordMap = {
                  ...recordMap,
                  collection_query: {
                    ...recordMap.collection_query,
                    [collectionId]: {
                      ...recordMap.collection_query?.[collectionId],
                      [collectionViewId]: {
                        ...query,
                        ...(query?.collection_group_results
                          ? {
                              collection_group_results: {
                                ...query.collection_group_results,
                                blockIds: filteredBlockIds
                              }
                            }
                          : { blockIds: filteredBlockIds })
                      }
                    }
                  }
                }

                setFilteredProps({
                  ...props,
                  recordMap: newRecordMap
                })
              }
            }
          }
        }
      }
    }
  }, [props])

  return <NotionPage {...filteredProps} />
}
