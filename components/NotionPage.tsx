import * as React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import cs from 'classnames'
import { Block, PageBlock } from 'notion-types'
// import { formatDate } from 'notion-utils'
import { getBlockTitle, getPageProperty, normalizeTitle} from 'notion-utils'
import BodyClassName from 'react-body-classname'
import { NotionRenderer } from 'react-notion-x'
import TweetEmbed from 'react-tweet-embed'
import { useSearchParam } from 'react-use'

import * as config from '@/lib/config'
import * as types from '@/lib/types'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

import { Footer } from './Footer'
// import { GitHubShareButton } from './GitHubShareButton'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import { Pagination } from './Pagination'
import styles from './styles.module.css'
import MoveToTopButton from './MoveToTopButton'
import { GiscusComment } from './Comment'
import { ErrorBoundary } from './ErrorBoundary'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    // add / remove any prism syntaxes here
    await Promise.allSettled([
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-markup-templating.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-markup.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-bash.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-c.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-cpp.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-csharp.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-docker.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-java.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-js-templates.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-coffeescript.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-diff.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-git.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-go.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-graphql.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-handlebars.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-less.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-makefile.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-markdown.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-objectivec.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-ocaml.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-python.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-reason.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-rust.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-sass.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-scss.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-solidity.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-sql.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-stylus.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-swift.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-wasm.js'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prismjs components don't have type declarations
      import('prismjs/components/prism-yaml.js')
    ])
    return m.Code
  })
)

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  )
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
  {
    ssr: false
  }
)
const Modal = dynamic(
  () =>
    import('react-notion-x/build/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  {
    ssr: false
  }
)

const Tweet = ({ id }: { id: string }) => {
  return <TweetEmbed tweetId={id} />
}

const propertyLastEditedTimeValue = (
  { block, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && block?.last_edited_time) {
    // return `Last updated ${formatDate(block?.last_edited_time, {
    //   month: 'long'
    // })}`
    const lastEditedTime = new Date(block?.last_edited_time);
    return `修改：${lastEditedTime.getFullYear()}-${String(lastEditedTime.getMonth() + 1).padStart(2, '0')}-${String(lastEditedTime.getDate()).padStart(2, '0')}`
  }

  return defaultFn()
}

const propertyDateValue = (
  { data, schema, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date

    if (publishDate) {
      // return `${formatDate(publishDate, {
      //   month: 'long'
      // })}`

      return `发布：${publishDate}`
    }
  }

  return defaultFn()
}

const propertyTextValue = (
  { schema, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }

  return defaultFn()
}

const propertySelectValue = (
  { schema, value, key, pageHeader }, 
  defaultFn: () => React.ReactNode
) => {
  const normalizedValue = normalizeTitle(value)
  if (pageHeader && schema?.type === 'multi_select' && normalizedValue) {
    return (
      <Link href={`/tags/${normalizedValue}`} key={key}>
        {defaultFn()}
      </Link>
    )
  }

  return defaultFn()
}

export const NotionPage: React.FC<types.PageProps> = ({
  site,
  recordMap,
  error,
  pageId,
  tagsPage,
  propertyToFilterName,
  curPage,
  totalPosts
}) => {
  const router = useRouter()
  const lite = useSearchParam('lite')

  const components = React.useMemo(
    () => ({
      nextImage: Image,
      nextLink: Link,
      Code,
      Collection,
      Equation,
      Pdf,
      Modal,
      Tweet,
      Header: NotionPageHeader,
      propertyLastEditedTimeValue,
      propertyTextValue,
      propertyDateValue,
      propertySelectValue
    }),
    []
  )

  // lite mode is for oembed
  const isLiteMode = lite === 'true'

  const { isDarkMode } = useDarkMode()

  // Filter out blocks without valid IDs to prevent uuidToId errors
  const cleanRecordMap = React.useMemo(() => {
    if (!recordMap?.block) return recordMap
    
    const cleanBlocks: typeof recordMap.block = {}
    for (const [key, blockData] of Object.entries(recordMap.block)) {
      // Skip blocks without any data
      if (!blockData) continue
      
      // The Notion API now returns blocks with id at the top level, not in value
      // Structure: { id: "...", role: "...", value: { ... } }
      const blockWrapper = blockData as any
      const blockValue = blockWrapper.value
      
      // Ensure the value has an id - copy from wrapper if needed
      if (blockValue && !blockValue.id && blockWrapper.id) {
        blockValue.id = blockWrapper.id
      }
      
      cleanBlocks[key] = blockData
    }
    
    return {
      ...recordMap,
      block: cleanBlocks
    }
  }, [recordMap])

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return mapPageUrl(site, cleanRecordMap, searchParams)
  }, [site, cleanRecordMap, lite])

  // Find the root block for this page - it should match the pageId
  const keys = Object.keys(cleanRecordMap?.block || {})
  const targetId = pageId || site?.rootNotionPageId
  
  // Try to find the block that matches the pageId
  // The id might be at the wrapper level (new API) or in value (old API)
  let blockWrapper = cleanRecordMap?.block?.[targetId] as any
  let block = blockWrapper?.value as Block | undefined
  
  // If not found directly, try with and without dashes
  if (!block && targetId) {
    const normalizedId = targetId.replace(/-/g, '')
    for (const key of keys) {
      const keyNormalized = key.replace(/-/g, '')
      if (keyNormalized === normalizedId) {
        blockWrapper = cleanRecordMap?.block?.[key] as any
        block = blockWrapper?.value as Block | undefined
        break
      }
    }
  }
  
  // Fallback to first block if still not found (shouldn't happen in normal cases)
  if (!block && keys.length > 0) {
    blockWrapper = cleanRecordMap?.block?.[keys[0]] as any
    block = blockWrapper?.value as Block | undefined
  }
  
  // Ensure block has id - copy from wrapper if needed (new API format)
  if (block && !block.id && blockWrapper?.id) {
    block = { ...block, id: blockWrapper.id }
  }

  // Debug logging - enabled in both dev and production for troubleshooting
  if (typeof window !== 'undefined') {
    console.log('NotionPage render debug:', {
      pageId,
      targetId,
      blockKeysCount: keys.length,
      firstBlockKey: keys[0],
      targetIdNormalized: targetId?.replace(/-/g, ''),
      firstBlockKeyNormalized: keys[0]?.replace(/-/g, ''),
      blockFound: !!block,
      directLookup: !!cleanRecordMap?.block?.[targetId],
      normalizedLookup: keys.some(k => k.replace(/-/g, '') === targetId?.replace(/-/g, '')),
      blockId: block?.id,
      blockType: block?.type,
      error: error
    })
  }

  // const isRootPage =
  //   parsePageId(block?.id) === parsePageId(site?.rootNotionPageId)
  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'
  
  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const pageAside = React.useMemo(
    () => (
      <PageAside block={block} recordMap={cleanRecordMap} isBlogPost={isBlogPost} />
    ),
    [block, cleanRecordMap, isBlogPost]
  )

  const pageFooter = React.useMemo(
    () => (
      <>
        { !isBlogPost && <Pagination curPage={curPage} totalPosts={totalPosts} />}
        { config.isGiscusEnabled && isBlogPost && <GiscusComment pageId={pageId} isDarkMode={isDarkMode} />}
      </>
    ), 
    [curPage, totalPosts, isBlogPost, isDarkMode]
  )

  const footer = React.useMemo(() => <Footer />, [])

  // To modify the default table of contents header of the page aside to meet my need
  React.useEffect(() => {
    const TableOfContentsHeader = document.querySelector(".notion-aside-table-of-contents-header");
    if (TableOfContentsHeader) {
      TableOfContentsHeader.innerHTML = '目录';
    }
  }, [isBlogPost]);

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block) {
    console.log('Rendering 404 - error or missing data:', { error, siteExists: !!site, blockExists: !!block, pageId })
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const name = getBlockTitle(block, cleanRecordMap) || site.name
  const title = tagsPage && propertyToFilterName ? `标签：${propertyToFilterName}` : name

  if (config.isDev) {
    console.log('notion page', {
      isDev: config.isDev,
      title,
      pageId,
      rootNotionPageId: site.rootNotionPageId,
      recordMap: cleanRecordMap
    })
  }

  if (!config.isServer) {
    // add important objects to the window global for easy debugging
    const g = window as any
    g.pageId = pageId
    g.recordMap = cleanRecordMap
    g.block = block
  }

  const canonicalPageUrl =
    !config.isDev && getCanonicalPageUrl(site, cleanRecordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, cleanRecordMap) ||
      (block as PageBlock).format?.page_cover ||
      config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, cleanRecordMap) ||
    config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {isDarkMode && <BodyClassName className='dark-mode' />}

      <ErrorBoundary
        fallback={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Error rendering Notion content</h2>
            <p>There was an error displaying this page. Please try refreshing.</p>
          </div>
        }
      >
        <NotionRenderer
          bodyClassName={cs(
            styles.notion,
            pageId === site.rootNotionPageId && 'index-page',
            tagsPage && 'tags-page'
          )}
          darkMode={isDarkMode}
          components={components}
          recordMap={cleanRecordMap}
          rootPageId={site.rootNotionPageId}
          rootDomain={site.domain}
          fullPage={!isLiteMode}
          previewImages={!!cleanRecordMap.preview_images}
          showCollectionViewDropdown={false}
          showTableOfContents={showTableOfContents}
          minTableOfContentsItems={minTableOfContentsItems}
          defaultPageIcon={config.defaultPageIcon}
          defaultPageCover={config.defaultPageCover}
          defaultPageCoverPosition={config.defaultPageCoverPosition}
          mapPageUrl={siteMapPageUrl}
          mapImageUrl={mapImageUrl}
          searchNotion={config.isSearchEnabled ? searchNotion : null}
          pageAside={pageAside}
          pageTitle={tagsPage && propertyToFilterName ? title : undefined}
          pageFooter={pageFooter}
          footer={footer}
        />
      </ErrorBoundary>

      <MoveToTopButton />

      {/* <GitHubShareButton /> */}
    </>
  )
}
