import { useEffect, useState } from 'react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { userApi } from '../services/api'

function hasRealPhoto(url) {
  if (!url || typeof url !== 'string') return false
  if (url.includes('images.unsplash.com')) return false
  return true
}

function getInitials(name = 'User') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Header({ activePage = 'home' }) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { isAuthenticated, user, openLogin, openSignup, logout } = useAuth()
  const {
    connected,
    notifications,
    unreadCount,
    livePopup,
    setLivePopup,
    markAllRead,
  } = useSocket()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setNotifOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const [actionMessage, setActionMessage] = useState('')

  const handleSocialAction = async (requesterId, action, notifId, e) => {
    e.stopPropagation()
    try {
      await userApi.respondSocialAccess(requesterId, action)
      setActionMessage(
        action === 'allow'
          ? '✅ Social Media Access Granted!'
          : '❌ Social Request Declined'
      )
      setTimeout(() => setActionMessage(''), 3000)
      markAllRead()
    } catch (err) {
      alert(err.message || 'Action failed')
    }
  }

  useEffect(() => {
    if (livePopup) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        }
      } catch {
        // audio play prevented or unsupported
      }
    }
  }, [livePopup])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="site-header">
      {/* Instagram-Style Live Notification Dropdown Banner */}
      {livePopup && (
        <div
          className="ig-like-toast"
          onClick={() => {
            setLivePopup(null)
            window.location.hash = 'profile'
          }}
          role="alert"
        >
          <div className="ig-toast-avatar-ring">
            {livePopup.senderAvatar &&
            !livePopup.senderAvatar.includes('images.unsplash.com') ? (
              <img
                src={livePopup.senderAvatar}
                alt={livePopup.senderName || 'User'}
                className="ig-toast-avatar-img"
              />
            ) : (
              <div className="ig-toast-avatar-fallback">
                {(livePopup.senderName || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="ig-toast-mini-heart" title="Notification">
              {livePopup.type === 'social_request' ? '🔑' : livePopup.type === 'social_granted' ? '🎉' : '❤️'}
            </span>
          </div>

          <div className="ig-toast-details">
            <p className="ig-toast-title">
              <strong>{livePopup.senderName || 'Someone'}</strong>{' '}
              {livePopup.type === 'match'
                ? 'matched with you! 🎉'
                : livePopup.type === 'like'
                ? 'liked your profile ❤️'
                : livePopup.type === 'social_request'
                ? 'requested your Social Media links 🔑'
                : livePopup.type === 'social_granted'
                ? 'granted you Social Media access! 🎉'
                : livePopup.message || 'sent an update'}
            </p>
            <span className="ig-toast-sub">
              {livePopup.type === 'social_request'
                ? 'Tap Allow to share your Instagram/Social links'
                : livePopup.type === 'match'
                ? 'Tap to start chatting'
                : 'Tap to view profile'}{' '}
              • Just now
            </span>
          </div>

          {livePopup.type === 'social_request' ? (
            <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ig-toast-view-btn"
                style={{ background: '#22c55e', color: '#fff', border: 'none' }}
                onClick={(e) => {
                  handleSocialAction(livePopup.senderId || livePopup.requesterId, 'allow', livePopup._id, e)
                  setLivePopup(null)
                }}
              >
                ✓ Allow
              </button>
              <button
                type="button"
                className="ig-toast-view-btn"
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none' }}
                onClick={(e) => {
                  handleSocialAction(livePopup.senderId || livePopup.requesterId, 'decline', livePopup._id, e)
                  setLivePopup(null)
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ig-toast-view-btn"
              onClick={(e) => {
                e.stopPropagation()
                setLivePopup(null)
                window.location.hash = 'profile'
              }}
            >
              {livePopup.type === 'match' ? 'Chat' : 'View'}
            </button>
          )}

          <button
            type="button"
            className="ig-toast-close-x"
            onClick={(e) => {
              e.stopPropagation()
              setLivePopup(null)
            }}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {open && (
        <div
          className="nav-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav className="nav wrap">
        <a
          className="brand-link"
          href="#home"
          onClick={() => setOpen(false)}
          aria-label="Luvkaro Home"
        >
          <Logo />
        </a>
        <button
          className={`menu-button ${open ? 'is-active' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          <div className="mobile-nav-top">
            <Logo />
            <button
              className="mobile-nav-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>
          <div className="nav-items-group">
            {['Home', 'Discover', 'Matches', 'Messages', 'About'].map((item) => {
              const page = item.toLowerCase()
              return (
                <a
                  className={activePage === page ? 'active' : ''}
                  key={item}
                  href={`#${page}`}
                  onClick={() => setOpen(false)}
                >
                  {item}
                </a>
              )
            })}
          </div>
          <div className="mobile-nav-footer">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="login"
                  onClick={() => {
                    setOpen(false)
                    openLogin()
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="signup"
                  onClick={() => {
                    setOpen(false)
                    openSignup()
                  }}
                >
                  Sign Up Free
                </button>
              </>
            ) : (
              <div className="mobile-user-profile">
                <a
                  href="#profile"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  {hasRealPhoto(user?.avatar) ? (
                    <img
                      src={user.avatar}
                      alt={user?.name}
                      className="header-avatar"
                    />
                  ) : (
                    <span
                      className="header-avatar"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #ff2e63, #ff6b8b)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                      }}
                    >
                      {getInitials(user?.name)}
                    </span>
                  )}
                  <span className="header-username">{user?.name}</span>
                </a>
                <button
                  type="button"
                  className="login logout-btn"
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {/* Real-Time Notification Bell */}
          {isAuthenticated && (
            <div className="header-notif-wrap">
              <button
                type="button"
                className="header-notif-btn"
                onClick={() => {
                  setNotifOpen((prev) => !prev)
                  if (!notifOpen && unreadCount > 0) {
                    markAllRead()
                  }
                }}
                title="Real-Time Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="header-notif-badge">{unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="header-notif-dropdown">
                  <div className="notif-drop-head">
                    <div>
                      <strong>Notifications</strong>
                      <small className={connected ? 'sock-on' : 'sock-off'}>
                        {connected ? '● Live Socket Connected' : '○ Reconnecting...'}
                      </small>
                    </div>
                    <button type="button" onClick={markAllRead}>
                      Mark all read
                    </button>
                  </div>
                  <div className="notif-drop-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 16).map((n, i) => (
                        <div
                          key={n._id || i}
                          className={`ig-notif-item ${n.read ? '' : 'unread'}`}
                          onClick={() => {
                            setNotifOpen(false)
                            window.location.hash = 'profile'
                          }}
                        >
                          <div className="ig-notif-avatar-ring">
                            {n.senderAvatar &&
                            !n.senderAvatar.includes('images.unsplash.com') ? (
                              <img
                                src={n.senderAvatar}
                                alt={n.senderName}
                                className="ig-notif-avatar-img"
                              />
                            ) : (
                              <div className="ig-notif-avatar-fallback">
                                {(n.senderName || 'U').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="ig-notif-mini-heart">
                              {n.type === 'social_request' ? '🔑' : n.type === 'social_granted' ? '🎉' : '❤️'}
                            </span>
                          </div>

                          <div className="ig-notif-text-wrap">
                            <p>
                              <strong>{n.senderName || 'Someone'}</strong>{' '}
                              {n.type === 'match'
                                ? 'matched with you!'
                                : n.type === 'like'
                                ? 'liked your profile.'
                                : n.type === 'social_request'
                                ? 'requested access to your Social Media links.'
                                : n.type === 'social_granted'
                                ? 'granted you access to their social links!'
                                : n.message}
                            </p>
                            <small className="ig-notif-time">
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </small>
                          </div>

                          {n.type === 'social_request' ? (
                            <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="ig-notif-action-btn"
                                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '4px 10px' }}
                                onClick={(e) => handleSocialAction(n.senderId || n.requesterId, 'allow', n._id, e)}
                              >
                                Allow
                              </button>
                              <button
                                type="button"
                                className="ig-notif-action-btn"
                                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '4px 8px' }}
                                onClick={(e) => handleSocialAction(n.senderId || n.requesterId, 'decline', n._id, e)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="ig-notif-action-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setNotifOpen(false)
                                window.location.hash = 'profile'
                              }}
                            >
                              {n.type === 'match' ? 'Chat' : 'View'}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAuthenticated ? (
            <>
              <button type="button" className="login" onClick={openLogin}>
                Log In
              </button>
              <button type="button" className="signup" onClick={openSignup}>
                Sign Up
              </button>
            </>
          ) : (
            <div className="header-logged-in-user">
              <a
                href="#profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
                title="View My Profile Dashboard"
              >
                {hasRealPhoto(user?.avatar) ? (
                  <img
                    src={user.avatar}
                    alt={user?.name}
                    className="header-avatar"
                  />
                ) : (
                  <span
                    className="header-avatar"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #ff2e63, #ff6b8b)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                    }}
                  >
                    {getInitials(user?.name)}
                  </span>
                )}
                <span className="header-user-firstname">
                  {user?.name?.split(' ')[0]}
                </span>
              </a>
              <button
                type="button"
                className="login header-logout-btn"
                onClick={logout}
                title="Log out"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
