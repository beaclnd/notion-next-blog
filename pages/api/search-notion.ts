import { NextApiRequest, NextApiResponse } from 'next'

import * as types from '../../lib/types'
import { search } from '../../lib/notion'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const searchParams: types.SearchParams = req.body

  console.log('<<< lambda search-notion', searchParams)
  const results = await search(searchParams)
  console.log('>>> lambda search-notion', results)

  // To remove the post which is not Public from the results
  const collectionKey = Object.keys(results.recordMap.collection)[0]
  const schema = results.recordMap.collection[collectionKey].value.schema
  const keyOfPublicProperty = Object.keys(schema)
    .find((key) => schema[key].name === 'Public')
  const idsNotPublic = results.results.filter((item) => {
    const properties = results.recordMap.block[(item as any).id]?.value?.properties
    const isNotPublic = properties?.[keyOfPublicProperty]?.[0]?.[0] !== 'Yes'
    return isNotPublic
  }).map((item) => item.id)
  results.results = results.results?.filter((item) => !idsNotPublic.includes(item.id))
  results.recordMap.block = Object.keys(results.recordMap.block)
    .filter((id) => !idsNotPublic.includes(id))
    .reduce((block, id) => ({ ...block, [id]: results.recordMap.block[id] }), {})
  results.total = results?.results?.length || 0

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
  )
  res.status(200).json(results)
}
