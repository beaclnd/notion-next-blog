import React from 'react'
import omit from 'lodash.omit'
import { Collection, CollectionView, ExtendedRecordMap } from 'notion-types'
import { normalizeTitle } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, rootNotionPageId } from 'lib/config'
import { resolveNotionPage } from 'lib/resolve-notion-page'

const tagsPropertyNameLowerCase = 'tags'

function getCollectionId(recordMap: ExtendedRecordMap): string | undefined {
  // Get the collection ID from the entry key, not from the value's id property
  const collectionEntry = Object.entries(recordMap.collection)[0]
  return collectionEntry?.[0]
}

function getGalleryView(recordMap: ExtendedRecordMap): CollectionView | undefined {
  const views = Object.values(recordMap.collection_view)
  console.log('Tags: Found', views.length, 'collection views')

  for (const view of views) {
    const viewValue = (view as any)?.value as CollectionView | undefined
    console.log('Tags: Checking view type:', viewValue?.type, 'id:', viewValue?.id)
    if (viewValue?.type === 'gallery') {
      console.log('Tags: Found gallery view with id:', viewValue.id)
      return viewValue
    }
  }

  // Fallback to first view if no gallery found
  if (views.length > 0) {
    const firstView = (views[0] as any)?.value as CollectionView | undefined
    console.log('Tags: No gallery view found, using first view:', firstView?.id)
    return firstView
  }

  console.log('Tags: No views found')
  return undefined
}

export const getStaticProps = async (context) => {
  const rawTagName = (context?.params?.tagName as string) || ''
  console.log('Tags getStaticProps: tagName:', rawTagName)

  try {
    const props = await resolveNotionPage(domain, rootNotionPageId)
    let propertyToFilterName: string = null

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      const collectionId = getCollectionId(recordMap)
      // Get collection data - structure is { spaceId, value: { value: collection, role } }
      const collectionData = Object.values(recordMap.collection)[0] as any
      // Access schema at collectionData.value.value.schema
      const schema = collectionData?.value?.value?.schema

      console.log('Tags getStaticProps: collectionId:', collectionId)
      console.log('Tags getStaticProps: schema found:', !!schema)

      if (collectionId && schema) {
        const galleryView = getGalleryView(recordMap)

        if (galleryView) {
          const galleryBlock = Object.values(recordMap.block).find(
            (block) =>
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.type === 'collection_view' &&
              (block?.value as { type?: string; view_ids?: string[] } | undefined)?.view_ids?.includes(galleryView.id)
          )

          const galleryBlockValue = galleryBlock?.value as { id?: string } | undefined
          console.log('Tags getStaticProps: galleryBlock found:', !!galleryBlockValue?.id)

          if (galleryBlockValue?.id) {
            recordMap.block = {
              [galleryBlockValue.id]: galleryBlock,
              ...omit(recordMap.block, [galleryBlockValue.id])
            }

            console.log('Tags getStaticProps: Full schema keys:', Object.keys(schema))

            const propertyToFilter = schema ? Object.entries(schema).find(
              (property) => {
                const propName = (property[1] as { name?: string } | undefined)?.name?.toLowerCase()
                console.log('Tags getStaticProps: Checking property:', property[0], 'name:', propName)
                return propName === tagsPropertyNameLowerCase
              }
            ) : null
            const propertyToFilterId = propertyToFilter?.[0]
            const filteredValue = normalizeTitle(rawTagName)
            const propertyToFilterSchemaEntry = propertyToFilter?.[1] as { options?: { value: string }[] } | undefined

            console.log('Tags getStaticProps: propertyToFilter found:', !!propertyToFilter)
            console.log('Tags getStaticProps: propertyToFilterId:', propertyToFilterId)
            console.log('Tags getStaticProps: propertyToFilterSchemaEntry:', JSON.stringify(propertyToFilterSchemaEntry, null, 2).slice(0, 500))
            console.log('Tags getStaticProps: filteredValue:', filteredValue)
            console.log('Tags getStaticProps: options:', propertyToFilterSchemaEntry?.options?.map(o => ({ value: o.value, normalized: normalizeTitle(o.value) })))

            propertyToFilterName = propertyToFilterSchemaEntry?.options?.find(
              (option) => normalizeTitle(option.value) === filteredValue
            )?.value

            console.log('Tags getStaticProps: propertyToFilterName:', propertyToFilterName)

            if (propertyToFilterId && filteredValue) {
              const query =
                recordMap.collection_query[collectionId]?.[galleryView.id]
              const queryResults = query?.collection_group_results ?? query

              console.log('Tags getStaticProps: query found:', !!query)
              console.log('Tags getStaticProps: queryResults blockIds count before filter:', queryResults?.blockIds?.length)

              if (queryResults) {
                const beforeFilterCount = queryResults.blockIds.length
                console.log('Tags getStaticProps: Starting filter, checking', beforeFilterCount, 'blocks')
                console.log('Tags getStaticProps: Looking for propertyId:', propertyToFilterId, 'with value:', filteredValue)

                // Debug first few blocks to see their structure
                const sampleBlocks = queryResults.blockIds.slice(0, 3).map(id => {
                  const block = recordMap.block[id]?.value as { properties?: any } | undefined
                  return {
                    id,
                    hasProperties: !!block?.properties,
                    tagValue: block?.properties?.[propertyToFilterId]
                  }
                })
                console.log('Tags getStaticProps: Sample blocks:', sampleBlocks)

                const filteredBlockIds = queryResults.blockIds.filter((id) => {
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

                // Update the query results
                queryResults.blockIds = filteredBlockIds
                console.log('Tags getStaticProps: blockIds after filter:', filteredBlockIds.length, '(was:', beforeFilterCount, ')')

                // Also need to update the collection view block's content to match
                // because react-notion-x renders based on block content, not queryResults
                if (galleryBlockValue?.id && recordMap.block[galleryBlockValue.id]?.value) {
                  const galleryBlock = recordMap.block[galleryBlockValue.id].value as any
                  console.log('Tags getStaticProps: galleryBlock content before:', galleryBlock.content?.length)
                  galleryBlock.content = filteredBlockIds
                  console.log('Tags getStaticProps: galleryBlock content after:', galleryBlock.content?.length)
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

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  console.log('Tags getStaticPaths: starting')
  console.log('Tags getStaticPaths: isDev:', isDev)
  console.log('Tags getStaticPaths: NODE_ENV:', process.env.NODE_ENV)

  if (!isDev) {
    const props = await resolveNotionPage(domain, rootNotionPageId)

    if ((props as any).recordMap) {
      const recordMap = (props as any).recordMap as ExtendedRecordMap
      // Get collection data - structure is { spaceId, value: { value: collection, role } }
      const collectionData = Object.values(recordMap.collection)[0] as any
      // Access schema at collectionData.value.value.schema
      const schema = collectionData?.value?.value?.schema

      console.log('Tags getStaticPaths: schema found:', !!schema)

      if (schema) {
        const propertyToFilter = Object.entries(schema).find(
          (property) =>
            (property[1] as { name?: string } | undefined)?.name?.toLowerCase() === tagsPropertyNameLowerCase
        )
        const propertyToFilterSchema = propertyToFilter?.[1] as { options?: { value: string }[] } | undefined

        console.log('Tags getStaticPaths: tags property found:', !!propertyToFilter)
        console.log('Tags getStaticPaths: tags options count:', propertyToFilterSchema?.options?.length || 0)

        if (propertyToFilterSchema?.options) {
          const paths = (propertyToFilterSchema.options)
            .map((option) => normalizeTitle(option.value))
            .filter(Boolean)
            .map((tag) => ({params: {tagName: tag}}))

          console.log('Tags getStaticPaths: generated paths:', paths)
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
  if (typeof window !== 'undefined' && props.recordMap && props.tagsPage) {
    const recordMap = props.recordMap as ExtendedRecordMap
    const tagName = (props as any).propertyToFilterName || window.location.pathname.split('/').pop()

    console.log('NotionTagsPage: tagName from props or URL:', tagName)

    if (tagName) {
      const normalizedTag = normalizeTitle(tagName)

      // Find the Tags property ID from schema
      const collectionData = Object.values(recordMap.collection)[0] as any
      const schema = collectionData?.value?.value?.schema

      console.log('NotionTagsPage: schema found:', !!schema)

      if (schema) {
        const tagsProperty = Object.entries(schema).find(([_, prop]: [string, any]) =>
          prop?.name?.toLowerCase() === 'tags'
        )
        const propertyToFilterId = tagsProperty?.[0]

        console.log('NotionTagsPage: tagsProperty found:', !!tagsProperty, 'propertyId:', propertyToFilterId)

        if (propertyToFilterId) {
          console.log('Client-side filtering: tag:', normalizedTag, 'propertyId:', propertyToFilterId)

          // Find all collection_view blocks
          const collectionViewBlocks = Object.entries(recordMap.block).filter(([_, block]: [string, any]) =>
            block?.value?.type === 'collection_view'
          )
          console.log('NotionTagsPage: collection_view blocks found:', collectionViewBlocks.length)

          if (collectionViewBlocks.length > 0) {
            collectionViewBlocks.forEach(([blockId, blockData]: [string, any]) => {
              console.log('NotionTagsPage: Processing block', blockId)
              console.log('NotionTagsPage: block view_ids:', blockData?.value?.view_ids)
              console.log('NotionTagsPage: block content before:', blockData?.value?.content?.length)

              const originalContent = blockData?.value?.content || []
              const filteredContent = originalContent.filter((id: string) => {
                const block = recordMap.block[id]?.value as { properties?: any } | undefined
                const value = block?.properties?.[propertyToFilterId]?.[0]?.[0]
                console.log('NotionTagsPage: Checking post', id, 'tag value:', value)
                if (!value) return false
                const values = value.split(',')
                const hasTag = values.find((v: string) => normalizeTitle(v) === normalizedTag)
                console.log('NotionTagsPage: Post', id, 'has tag', normalizedTag, ':', !!hasTag)
                return hasTag
              })

              console.log('Client-side filtering: original posts:', originalContent.length, 'filtered:', filteredContent.length)

              // Update the block content
              if (blockData?.value) {
                blockData.value.content = filteredContent
                console.log('NotionTagsPage: block content after:', blockData.value.content.length)
              }
            })
          }
        }
      }
    }
  }

  return <NotionPage {...props} />
}