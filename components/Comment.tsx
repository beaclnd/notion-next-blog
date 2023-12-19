import React from "react"
import styles from "./styles.module.css"
import Giscus from '@giscus/react'
import type { Repo } from '@giscus/react'
import { giscus } from "@/lib/config"
import { GiscusConf } from "@/lib/site-config"

const { 
    repo, 
    repoId, 
    category, 
    categoryId, 
    mapping = 'pathname',
    reactionsEnabled = '0',
    emitMetadata = '0',
    inputPosition = 'bottom',
} = giscus as GiscusConf

export const GiscusComment = ({ pageId, isDarkMode }: { pageId: string, isDarkMode: boolean }) => (
    <div className={styles.comment}>
        <Giscus
            id={pageId}
            repo={repo as Repo}
            repoId={repoId}
            category={category}
            categoryId={categoryId}
            mapping={mapping}
            strict='0'
            reactionsEnabled={reactionsEnabled}
            emitMetadata={emitMetadata}
            inputPosition={inputPosition}
            theme={isDarkMode ? 'dark_dimmed' : 'light'}
            lang='zh-CN'
            loading='eager'
        />
    </div>
)