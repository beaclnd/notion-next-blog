import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '479140cbc8b44b2fb00776aec4b39e16',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: 'beaclnd\'s Blogs',
  // use www. prefix in domain to generate valid sitemap
  domain: 'www.beaclnd.tech',
  author: 'beaclnd',

  // open graph metadata (optional)
  description: 'Something sharing on beaclnd\'s Blogs',

  // social usernames (optional)
  // twitter: 'transitive_bs',
  github: 'beaclnd',
  // linkedin: '',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  // whether to use the default notion navigation style or a custom one with links to
  // important pages
  // navigationStyle: 'default'
  navigationStyle: 'custom',
  // navigationLinks: [
  //   {
  //     title: 'About',
  //     pageId: 'f1199d37579b41cbabfc0b5174f4256a'
  //   },
  //   {
  //     title: 'Contact',
  //     pageId: '6a29ebcb935a4f0689fe661ab5f3b8d1'
  //   }
  // ]

  // The max post count for each page
  postsPerPage: 5,

  // For the giscus
  isGiscusEnabled: true,
  giscus: {
    repo: 'beaclnd/blog-giscus', 
    repoId: 'R_kgDOK5xqJQ',
    category: 'Announcements',
    categoryId: 'DIC_kwDOK5xqJc4CbvMp',
    mapping: 'pathname',
    reactionsEnabled: '0',
    emitMetadata: '0',
    inputPosition: 'bottom'
  },

  isGoogleAnalyticsEnabled: true
})
