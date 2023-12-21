import { gaMeasuringId } from "./config"

declare global {
    interface Window {
        gtag: any
    }
}

export const pageview = (url: string, title: string) => {
    window.gtag('config', gaMeasuringId, {
        page_location: url,
        page_title: title,
    })
}