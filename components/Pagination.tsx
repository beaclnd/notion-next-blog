import * as React from 'react'
import Link from 'next/link'
import { postsPerPage } from '@/lib/config'
import styles from './styles.module.css'

export const Pagination: React.FC<{curPage: number, totalPosts: number}> = ({ curPage, totalPosts }) => {
  const hide = postsPerPage >= totalPosts 
  if (hide) return null
  const showPrev = curPage > 1
  const showNext = postsPerPage * curPage < totalPosts
  return (
    <div className={styles.pagination}>
      {showPrev &&
        <Link href={curPage === 2 ? `/` : `/page/${curPage - 1}`}>
          <a className={styles.a}>{'< 上一页'}</a>
        </Link>
      }
      <div className={styles.spacer}></div>
      {showNext &&
        <Link href={`/page/${curPage + 1}`}>
          <a className={styles.a}>{'下一页 >'}</a>
        </Link>
      }
    </div>
  )
}