import { useEffect } from 'react'

export default function useReveal() {
  useEffect(() => {
    const selectors = '.reveal, .soul-benefits article, .step-cards article, .soul-profile, .soul-testimonials article, .flow-list article, .moment-grid article, .soul-safety > div, .soul-app > div, .soul-app ul, .dating-guide-intro, .dating-guide-grid article, .dating-note'
    const elements = document.querySelectorAll(selectors)
    const directions = ['from-bottom', 'from-left', 'from-right', 'from-top']
    elements.forEach((element, index) => {
      if (!element.classList.contains('reveal')) {
        element.classList.add('reveal', directions[index % directions.length])
      }
      element.style.setProperty('--reveal-delay', `${Math.min((index % 5) * 80, 320)}ms`)
    })
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.12, rootMargin: '0px 0px -45px' })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}
