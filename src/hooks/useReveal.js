import { useEffect } from 'react'

export default function useReveal() {
  useEffect(() => {
    const selectors = '.reveal, .soul-benefits article, .step-cards article, .soul-profile, .soul-testimonials article, .flow-list article, .moment-grid article, .soul-safety > div, .soul-app > div, .soul-app ul, .dating-guide-intro, .dating-guide-grid article, .dating-note'
    const elements = document.querySelectorAll(selectors)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

    elements.forEach((element, index) => {
      if (isMobile) {
        // On mobile, keep elements cleanly in their natural layout without displacement
        element.classList.add('reveal', 'is-visible')
      } else {
        if (!element.classList.contains('reveal')) {
          element.classList.add('reveal', 'from-bottom')
        }
        element.style.setProperty('--reveal-delay', `${Math.min((index % 5) * 60, 240)}ms`)
      }
    })

    if (isMobile) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -20px' })

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}
