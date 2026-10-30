import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import MatchesPage from './pages/MatchesPage'
import MessagesPage from './pages/MessagesPage'
import AboutPage from './pages/AboutPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AuthModal from './components/auth/AuthModal'

const pages = {
  home: HomePage,
  discover: DiscoverPage,
  matches: MatchesPage,
  messages: MessagesPage,
  about: AboutPage,
  profile: ProfilePage,
  admin: AdminPage,
  'admin-login': AdminPage,
}

const ADMIN_URL_PATTERNS = [
  'admin-login',
  'adminlogin',
  'admin/login',
  'admin_login',
  'admin login',
  'admin',
]

const currentPage = () => {
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
    .trim()
    .toLowerCase()
  const rawPath = decodeURIComponent(window.location.pathname.replace(/^\/+|\/+$/g, ''))
    .trim()
    .toLowerCase()

  if (ADMIN_URL_PATTERNS.includes(rawHash)) {
    return rawHash === 'admin' ? 'admin' : 'admin-login'
  }
  if (ADMIN_URL_PATTERNS.includes(rawPath)) {
    return rawPath === 'admin' ? 'admin' : 'admin-login'
  }
  return rawHash || 'home'
}

export default function App() {
  const [page, setPage] = useState(currentPage)

  useEffect(() => {
    const change = () => {
      setPage(currentPage())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', change)
    window.addEventListener('popstate', change)
    return () => {
      window.removeEventListener('hashchange', change)
      window.removeEventListener('popstate', change)
    }
  }, [])

  const Page = pages[page] || HomePage

  return (
    <AuthProvider>
      <SocketProvider>
        <Page isLoginUrl={page === 'admin-login'} />
        <AuthModal />
      </SocketProvider>
    </AuthProvider>
  )
}
