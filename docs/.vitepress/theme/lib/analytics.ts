const measurementId = 'G-52VRCFXTN8'
const pageViewRetryDelays = [0, 250, 1000, 2500]
const sentPageViews = new Set<string>()

type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function canTrack() {
  return (
    typeof window !== 'undefined' && Boolean(measurementId) && typeof window.gtag === 'function'
  )
}

export function trackPageView(path: string) {
  for (const delay of pageViewRetryDelays) {
    window.setTimeout(() => {
      if (sentPageViews.has(path) || !canTrack()) {
        return
      }

      sentPageViews.add(path)
      window.gtag?.('event', 'page_view', {
        send_to: measurementId,
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      })
    }, delay)
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!canTrack()) {
    return
  }

  window.gtag?.('event', eventName, params)
}
