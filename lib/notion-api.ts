import { NotionAPI } from 'notion-client-main'

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})
