import type { Mapping, BooleanString, InputPosition } from '@giscus/react'
import * as types from './types'

export interface SiteConfig {
  rootNotionPageId: string
  rootNotionSpaceId?: string

  name: string
  domain: string
  author: string
  description?: string
  language?: string

  twitter?: string
  github?: string
  linkedin?: string
  newsletter?: string
  youtube?: string
  zhihu?: string
  mastodon?: string;

  defaultPageIcon?: string | null
  defaultPageCover?: string | null
  defaultPageCoverPosition?: number | null

  isPreviewImageSupportEnabled?: boolean
  isTweetEmbedSupportEnabled?: boolean
  isRedisEnabled?: boolean
  isSearchEnabled?: boolean

  includeNotionIdInUrls?: boolean
  pageUrlOverrides?: types.PageUrlOverridesMap
  pageUrlAdditions?: types.PageUrlOverridesMap

  navigationStyle?: types.NavigationStyle
  navigationLinks?: Array<NavigationLink>

  postsPerPage?: number
  isGiscusEnabled?: boolean
  giscus?: GiscusConf
}

export interface NavigationLink {
  title: string
  pageId?: string
  url?: string
}

export interface GiscusConf {
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping: Mapping
  reactionsEnabled: BooleanString 
  emitMetadata: BooleanString 
  inputPosition: InputPosition
}

export const siteConfig = (config: SiteConfig): SiteConfig => {
  return config
}
