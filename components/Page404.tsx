import * as React from 'react'

import * as types from '@/lib/types'

import { PageHead } from './PageHead'
import styles from './styles.module.css'

export const Page404: React.FC<types.PageProps> = ({ site, pageId, error }) => {
  const title = site?.name || 'Notion Page Not Found'

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('Page404 rendered:', { pageId, error, site })
  }

  return (
    <>
      <PageHead site={site} title={title} />

      <div className={styles.container} style={{ minHeight: '100vh', padding: '40px 20px' }}>
        <main className={styles.main} style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '20px' }}>Notion Page Not Found</h1>

          {error ? (
            <p style={{ color: 'red', marginBottom: '20px' }}>Error: {error.message}</p>
          ) : (
            <p style={{ marginBottom: '20px' }}>
              Make sure that Notion page &quot;{pageId}&quot; is publicly
              accessible.
            </p>
          )}

          <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            textAlign: 'left',
            maxWidth: '600px',
            margin: '0 auto',
            wordBreak: 'break-all'
          }}>
            <strong>Debug info:</strong><br/>
            pageId: {pageId || 'undefined'}<br/>
            site: {site ? site.name : 'undefined'}<br/>
            error: {error ? JSON.stringify(error) : 'none'}
          </div>

          <img
            src='/404.png'
            alt='404 Not Found'
            className={styles.errorImage}
            style={{ maxWidth: '100%', marginTop: '40px' }}
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </main>
      </div>
    </>
  )
}
