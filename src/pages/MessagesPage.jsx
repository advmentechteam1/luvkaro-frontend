import { useMemo, useState } from 'react'
import Header from '../components/Header'

const conversations = [
  {
    id: 'priya', name: 'Priya Sharma', age: 24, city: 'New Delhi, India', image: '/images%20(11).jpg',
    preview: 'Hey! I saw you love trying new cafés too...', time: '1m', online: true, score: '98%',
    tags: ['Travel', 'Music', 'Food', 'Movies'], prompts: ['A quiet mountain café', 'Street food trail', 'Sunset walks'],
    messages: [
      { text: 'Hi! Your travel interests caught my eye. What’s your favourite weekend escape?', type: 'received', time: '10:12 AM' },
      { text: 'I’m always looking for a quiet mountain café. You?', type: 'sent', time: '10:14 AM' },
      { text: 'That sounds perfect. I’d pick a beach town with great local food!', type: 'received', time: '10:15 AM' }
    ]
  },
  {
    id: 'rohit', name: 'Rohit Verma', age: 27, city: 'Delhi, India', image: '/images%20(14).jpg',
    preview: 'That movie recommendation was perfect!', time: '12m', online: true, score: '94%',
    tags: ['Fitness', 'Movies', 'Photography'], prompts: ['Weekend movie plan', 'Photography walk'],
    messages: [
      { text: 'That movie recommendation was perfect! Have you watched anything good lately?', type: 'received', time: 'Yesterday' },
      { text: 'I’m building a watchlist for the weekend. Send yours?', type: 'sent', time: 'Yesterday' }
    ]
  },
  {
    id: 'sneha', name: 'Sneha Patel', age: 25, city: 'Gurgaon, India', image: '/images%20(10).jpg',
    preview: 'Your book list is seriously impressive.', time: '35m', online: false, score: '91%',
    tags: ['Books', 'Art', 'Cooking'], prompts: ['Favourite bookstore', 'Coffee & books'],
    messages: [{ text: 'Your book list is seriously impressive. What are you reading now?', type: 'received', time: 'Monday' }]
  },
  {
    id: 'aman', name: 'Aman Singh', age: 28, city: 'Noida, India', image: '/images%20(13).jpg',
    preview: 'A Sunday cycling plan sounds great.', time: '1h', online: false, score: '89%',
    tags: ['Sports', 'Gaming', 'Travel'], prompts: ['Cycling route', 'Game night'],
    messages: [{ text: 'A Sunday cycling plan sounds great. Know any scenic routes?', type: 'received', time: 'Sunday' }]
  }
]

function Avatar({ person, large = false }) {
  return <div className={large ? 'photo-avatar large-photo-avatar' : 'photo-avatar'}><img src={person.image} alt={person.name} />{person.online && <i />}</div>
}

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState('priya')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [mobileView, setMobileView] = useState('chat') // 'list' | 'chat' | 'profile'
  const [messages, setMessages] = useState(() => Object.fromEntries(conversations.map(item => [item.id, item.messages])))
  const selected = conversations.find(person => person.id === selectedId) || conversations[0]
  const visible = useMemo(() => conversations.filter(person => person.name.toLowerCase().includes(query.toLowerCase())), [query])
  
  const send = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages(current => ({ ...current, [selectedId]: [...(current[selectedId] || []), { text, type: 'sent', time: 'Now' }] }))
    setDraft('')
  }

  const handleSelectPerson = (id) => {
    setSelectedId(id)
    setMobileView('chat')
  }

  return <>
    <div className="page-nav"><Header activePage="messages" /></div>
    <main className="messages-page">
      <section className="messages-heading">
        <p className="kicker">YOUR CONVERSATIONS</p>
        <h1>Every good story starts<br />with a hello.</h1>
        <p>Take your time. The best connections are never rushed.</p>
      </section>

      {/* Mobile view switch tabs for quick switching when screen is small */}
      <div className="mobile-chat-nav-tabs">
        <button 
          className={mobileView === 'list' ? 'active' : ''} 
          onClick={() => setMobileView('list')}
        >
          Conversations ({conversations.length})
        </button>
        <button 
          className={mobileView === 'chat' ? 'active' : ''} 
          onClick={() => setMobileView('chat')}
        >
          Chat with {selected.name.split(' ')[0]}
        </button>
        <button 
          className={mobileView === 'profile' ? 'active' : ''} 
          onClick={() => setMobileView('profile')}
        >
          Profile
        </button>
      </div>

      <section className={`love-inbox wrap mobile-view-${mobileView}`} aria-label="Messages">
        <aside className="inbox-panel">
          <div className="inbox-title">
            <div><p>MESSAGES</p><h2>Inbox <span>{conversations.length}</span></h2></div>
            <button aria-label="New conversation">+</button>
          </div>
          <label className="chat-search">
            <span>⌕</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search messages" aria-label="Search messages" />
          </label>
          <div className="filter-tabs">
            <button className="selected">All</button>
            <button>Unread</button>
            <button>Favourites</button>
          </div>
          <div className="chat-preview-list">
            {visible.map(person => (
              <button
                key={person.id}
                onClick={() => handleSelectPerson(person.id)}
                className={`chat-preview ${person.id === selectedId ? 'chosen' : ''}`}
              >
                <Avatar person={person} />
                <span className="chat-preview-text">
                  <b>{person.name}</b>
                  <small>{person.preview}</small>
                </span>
                <i className="chat-time">{person.time}</i>
              </button>
            ))}
          </div>
          <p className="inbox-foot">You have {conversations.length} meaningful conversations waiting.</p>
        </aside>

        <section className="conversation-panel">
          <header className="conversation-head">
            <button 
              className="mobile-back-btn" 
              onClick={() => setMobileView('list')} 
              aria-label="Back to chat list"
            >
              ←
            </button>
            <Avatar person={selected} />
            <div className="head-info">
              <b>{selected.name}</b>
              <small>{selected.online ? '● Active now' : 'Last seen recently'}</small>
            </div>
            <div className="conversation-actions">
              <button aria-label="Search conversation">⌕</button>
              <button aria-label="Start call">⌁</button>
              <button 
                className="mobile-profile-toggle" 
                onClick={() => setMobileView('profile')} 
                aria-label="View profile"
                title="View match profile"
              >
                ℹ
              </button>
            </div>
          </header>

          <div className="conversation-info">
            <span>It’s a match! <b>{selected.score} compatible</b></span>
            <button onClick={() => setMobileView('profile')}>View profile →</button>
          </div>

          <div className="chat-scroll">
            <p className="day-label">TODAY</p>
            {(messages[selectedId] || []).map((message, index) => (
              <div key={`${message.text}-${index}`} className={`message-row ${message.type === 'sent' ? 'sent-row' : ''}`}>
                <p className={`bubble ${message.type}`}>{message.text}</p>
                <small>{message.time}{message.type === 'sent' && '  ✓✓'}</small>
              </div>
            ))}
            {selected.online && <div className="typing"><span /><span /><span /> {selected.name.split(' ')[0]} is typing</div>}
          </div>

          <form className="composer" onSubmit={send}>
            <button type="button" aria-label="Add emoji">☺</button>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Message ${selected.name.split(' ')[0]}...`}
              aria-label="Type a message"
            />
            <button type="button" aria-label="Attach image">⌑</button>
            <button className="send" aria-label="Send message">↑</button>
          </form>
        </section>

        <aside className="match-panel">
          <div className="match-panel-mobile-header">
            <button className="mobile-back-to-chat-btn" onClick={() => setMobileView('chat')}>
              ← Back to Chat
            </button>
          </div>
          <div className="match-person">
            <Avatar person={selected} large />
            <h3>{selected.name}, {selected.age}</h3>
            <p>⌖ {selected.city}</p>
            <span className="online-status">● {selected.online ? 'Online now' : 'Recently active'}</span>
          </div>
          <div className="match-score">
            <span>✦</span>
            <div><b>{selected.score} match</b><small>You both share great energy</small></div>
          </div>
          <div className="shared-section">
            <p>SHARED INTERESTS</p>
            <div>{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          </div>
          <div className="shared-section">
            <p>START A CONVERSATION</p>
            {selected.prompts.map(prompt => (
              <button 
                key={prompt} 
                onClick={() => {
                  setDraft(prompt)
                  setMobileView('chat')
                }}
              >
                “{prompt}”
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="conversation-tips wrap">
        <p className="kicker">KEEP IT NATURAL</p>
        <h2>A little inspiration goes a long way.</h2>
        <div>
          <button onClick={() => { setDraft("What's your favourite weekend escape?"); setMobileView('chat'); }}>
            Ask about a shared interest <span>→</span>
          </button>
          <button onClick={() => { setDraft("I just had the best coffee today!"); setMobileView('chat'); }}>
            Share a small story from your day <span>→</span>
          </button>
          <button onClick={() => { setDraft("Would you like to grab coffee sometime?"); setMobileView('chat'); }}>
            Suggest a low-pressure plan <span>→</span>
          </button>
        </div>
      </section>
    </main>
  </>
}
