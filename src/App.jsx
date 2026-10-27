import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import MatchesPage from './pages/MatchesPage'
import MessagesPage from './pages/MessagesPage'
import AboutPage from './pages/AboutPage'

const pages = { home: HomePage, discover: DiscoverPage, matches: MatchesPage, messages: MessagesPage, about: AboutPage }
const currentPage = () => window.location.hash.replace('#', '') || 'home'

export default function App() {
  const [page, setPage] = useState(currentPage)
  useEffect(() => { const change = () => { setPage(currentPage()); window.scrollTo(0, 0) }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change) }, [])
  const Page = pages[page] || HomePage
  return <Page/>
}
