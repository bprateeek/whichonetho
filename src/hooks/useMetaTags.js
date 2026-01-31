import { useEffect } from 'react'

/**
 * Hook to dynamically update meta tags for sharing
 * Note: This updates client-side meta tags which works for some platforms
 * but not all crawlers. For full SSR support, consider server-side rendering.
 */
export function useMetaTags({ title, description, image, url }) {
  useEffect(() => {
    // Store original values
    const originalTitle = document.title
    const metaTags = {}

    const updateMeta = (property, content) => {
      if (!content) return

      // Try both property and name attributes
      let meta = document.querySelector(`meta[property="${property}"]`) ||
                 document.querySelector(`meta[name="${property}"]`)

      if (meta) {
        metaTags[property] = meta.getAttribute('content')
        meta.setAttribute('content', content)
      }
    }

    // Update document title
    if (title) {
      document.title = title
    }

    // Update Open Graph tags
    updateMeta('og:title', title)
    updateMeta('og:description', description)
    updateMeta('og:image', image)
    updateMeta('og:url', url)

    // Update Twitter Card tags
    updateMeta('twitter:title', title)
    updateMeta('twitter:description', description)
    updateMeta('twitter:image', image)

    // Update standard description
    updateMeta('description', description)

    // Cleanup - restore original values
    return () => {
      document.title = originalTitle

      Object.entries(metaTags).forEach(([property, content]) => {
        const meta = document.querySelector(`meta[property="${property}"]`) ||
                     document.querySelector(`meta[name="${property}"]`)
        if (meta && content) {
          meta.setAttribute('content', content)
        }
      })
    }
  }, [title, description, image, url])
}
