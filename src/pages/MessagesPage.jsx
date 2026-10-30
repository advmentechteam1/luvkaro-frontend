import { useMemo, useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userApi } from '../services/api';
import { getDefaultPhotoForGender, isRealRegisteredUser } from '../data/profiles';
import PaymentModal from '../components/PaymentModal';
import { detectRestrictedContactInfo } from '../utils/contactFilter';
import './ProfilePage.css';

const MAX_FREE_PROMPTS = 5;

const PAYMENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Chat & Profile Pass',
    price: 199,
    duration: '7 Days Access',
    badge: 'Quick Unlock',
    features: [
      'Unlimited Chat Messages (No 5-Prompt Limit)',
      'Unlock Full Partner Bio-Data & Profile Check',
      'Share Contact & Social Handles Freely',
    ],
  },
  {
    id: 'gold',
    name: 'Gold Unlimited Chat & Profile VIP',
    price: 499,
    duration: '30 Days Access',
    badge: '⭐ Most Popular',
    features: [
      'Unlimited Chat with All Matches',
      '100% Full Profile & Contact Details Check',
      'Share Phone Number & Instagram ID in Chat',
      'Verified VIP Gold Badge on Your Profile',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond Matrimony & Dating Pass',
    price: 999,
    duration: '90 Days VIP Access',
    badge: '👑 Best Value',
    features: [
      'Everything in Gold VIP + Priority Profile Boost',
      'Direct Phone & WhatsApp Connect with Matches',
      'Dedicated Relationship Compatibility Insights',
    ],
  },
];

function hasRealPhoto(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('images.unsplash.com')) return false;
  return true;
}

function getInitials(name = 'User') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function detectRestrictedLocal(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase();
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length >= 6) return 'Phone Number / Digits Sharing Restricted';
  if (
    /@[a-z0-9._]{2,}/i.test(rawText) ||
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(rawText)
  ) {
    return 'Instagram / Social Handle (@id) or Email Restricted';
  }
  const banned = [
    /\binsta\b/i,
    /\binstagram\b/i,
    /\big\s*[:-]?\s*[a-z0-9._]+/i,
    /\bsnap\b/i,
    /\bsnapchat\b/i,
    /\btelegram\b/i,
    /\bwhatsapp\b/i,
    /\bfb\s*id\b/i,
    /\bmy\s*id\b/i,
    /\binsta\s*id\b/i,
    /\bcall\s*me\b/i,
  ];
  for (const p of banned) {
    if (p.test(text)) return 'Instagram ID / Social Handle Sharing Restricted';
  }
  return null;
}

function Avatar({ person, large = false }) {
  return (
    <div className={large ? 'photo-avatar large-photo-avatar' : 'photo-avatar'}>
      {hasRealPhoto(person?.image) ? (
        <img src={person.image} alt={person?.name || 'User'} />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff2e63 0%, #ff6b8b 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: large ? '1.6rem' : '0.95rem',
          }}
        >
          {getInitials(person?.name)}
        </div>
      )}
      {person?.online && <i />}
    </div>
  );
}

export default function MessagesPage() {
  const { user, isAuthenticated, updateUser, openLogin } = useAuth();
  const { lastIncomingMessage, onlineUsers, sendChatMessage } = useSocket();
  const [dbUsers, setDbUsers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState('chat');
  const [messages, setMessages] = useState({});
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [warningBanner, setWarningBanner] = useState('');

  // Payment & Profile Check Modals
  const [paymentModal, setPaymentModal] = useState({ open: false, reason: '', partner: null });
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [inspectedPartner, setInspectedPartner] = useState(null);

  const isPremiumUser = Boolean(user?.isPremium);
  const promptsRemaining = isPremiumUser ? 9999 : Math.max(0, MAX_FREE_PROMPTS - promptsUsed);

  // Load real users and chat messages from MongoDB backend
  useEffect(() => {
    const loadRealData = async () => {
      try {
        if (isAuthenticated) {
          const res = await userApi.getDashboard();
          if (res.data) {
            setDbUsers(res.data.profiles || []);
            if (res.data.stats?.freePromptsUsed !== undefined) {
              setPromptsUsed(res.data.stats.freePromptsUsed);
            }
            if (Array.isArray(res.data.messages)) {
              const grouped = {};
              res.data.messages.forEach((m) => {
                if (!grouped[m.partnerId]) grouped[m.partnerId] = [];
                grouped[m.partnerId].push({
                  text: m.text,
                  type: m.type,
                  time: m.time || 'Recently',
                });
              });
              setMessages(grouped);
            }
          }
        } else {
          const pub = await userApi.getPublicProfiles({
            gender: 'all',
            viewerGender: user?.gender || '',
          });
          if (pub.data) {
            setDbUsers(pub.data);
          }
        }
      } catch (err) {
        console.warn('Could not load messages data:', err.message);
      }
    };
    loadRealData();
  }, [isAuthenticated]);

  const conversations = useMemo(() => {
    const pref = String(user?.interestedIn || '').toLowerCase();
    const targetG =
      pref === 'male' || pref === 'female'
        ? pref
        : pref === 'everyone' || pref === 'all'
        ? 'all'
        : String(user?.gender || '').toLowerCase() === 'male'
        ? 'female'
        : String(user?.gender || '').toLowerCase() === 'female'
        ? 'male'
        : 'all';

    const filteredDb = dbUsers.filter((u) => {
      if (!isRealRegisteredUser(u)) return false;
      if (targetG === 'all') return true;
      return String(u.gender || '').toLowerCase() === targetG;
    });

    return filteredDb.map((u, idx) => {
      const uid = (u._id || u.id || `conv-${idx}`).toString();
      const thread = messages[uid] || [];
      const last = thread[thread.length - 1];
      const uGender = String(u.gender || (targetG !== 'all' ? targetG : 'female')).toLowerCase();
      const fallbackImg = getDefaultPhotoForGender(uGender, idx);
      const imgUrl = hasRealPhoto(u.avatar || u.image) ? u.avatar || u.image : fallbackImg;

      return {
        id: uid,
        name: u.name || 'Member',
        age: u.age || 24,
        gender: uGender,
        city: u.location?.city ? `${u.location.city}, India` : u.city || 'Delhi, India',
        email: u.email || '',
        phone: u.phone || '',
        religion: u.religion || 'Hindu',
        motherTongue: u.motherTongue || 'Hindi',
        maritalStatus: u.maritalStatus || 'Never Married',
        occupation: u.occupation || 'Professional',
        education: u.education || "Bachelor's Degree",
        image: imgUrl,
        preview: last ? last.text : 'Tap to start a real-time conversation 👋',
        time: last ? last.time : 'Live',
        online: onlineUsers.includes(uid),
        score: `${96 - (idx % 10)}%`,
        tags: u.interests?.length
          ? u.interests
          : ['Traveling', 'Music', 'Coffee'],
      };
    });
  }, [dbUsers, messages, onlineUsers, user?.gender]);

  const selected =
    conversations.find((person) => person.id === selectedId) || conversations[0] || null;

  const visible = useMemo(
    () =>
      conversations.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase())
      ),
    [conversations, query]
  );

  useEffect(() => {
    if (user?.freePromptsUsed !== undefined) {
      setPromptsUsed(user.freePromptsUsed);
    }
  }, [user]);

  // Listen to real-time Socket incoming messages
  useEffect(() => {
    if (!lastIncomingMessage) return;
    const pid = (lastIncomingMessage.partnerId || lastIncomingMessage.senderId || '').toString();
    if (!pid) return;
    const incomingText = lastIncomingMessage.text || lastIncomingMessage.message?.text;
    if (!incomingText) return;
    const incomingType = lastIncomingMessage.type || lastIncomingMessage.message?.type || 'received';
    const incomingTime = lastIncomingMessage.time || lastIncomingMessage.message?.time || 'Now';

    setMessages((current) => {
      const existing = current[pid] || [];
      const alreadyExists = existing.some(
        (m) =>
          m.text === incomingText &&
          m.type === incomingType
      );
      if (alreadyExists) return current;
      return {
        ...current,
        [pid]: [
          ...existing,
          {
            text: incomingText,
            type: incomingType,
            time: incomingTime,
          },
        ],
      };
    });
  }, [lastIncomingMessage]);

  // Real-Time Background Message Sync: Polls /api/users/messages every 2.5s
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let timerId = null;

    const syncLiveMessages = async () => {
      let nextDelay = 3000;
      try {
        const res = await userApi.getMessages();
        if (res?.offline) {
          nextDelay = 8000;
        } else if (isMounted && Array.isArray(res?.data) && res.data.length > 0) {
          setMessages((current) => {
            let changed = false;
            const updated = { ...current };
            res.data.forEach((m) => {
              const pid = m.partnerId.toString();
              if (!updated[pid]) updated[pid] = [];
              const exists = updated[pid].some(
                (existing) => existing.text === m.text && existing.type === m.type
              );
              if (!exists) {
                updated[pid] = [
                  ...updated[pid],
                  { text: m.text, type: m.type, time: m.time || 'Recently' },
                ];
                changed = true;
              }
            });
            return changed ? updated : current;
          });
        }
      } catch {
        nextDelay = 8000;
      }
      if (isMounted) {
        timerId = setTimeout(syncLiveMessages, nextDelay);
      }
    };

    timerId = setTimeout(syncLiveMessages, 2000);
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isAuthenticated]);

  const handleCheckProfile = (person) => {
    if (!person) return;
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    if (!isPremiumUser) {
      setPaymentModal({
        open: true,
        reason: `🔒 ${person.name} ki Full Profile & Contact Details dekhne ke liye Payment unlock karein!`,
        partner: person,
      });
      return;
    }
    setInspectedPartner(person);
  };

  const send = async (event) => {
    event.preventDefault();
    setWarningBanner('');
    const text = draft.trim();
    if (!text || !selected) return;

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    // Check 5 free prompts limit
    if (!isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS) {
      setPaymentModal({
        open: true,
        reason:
          '🔒 Aapke 5 Free Chat Prompts poore ho chuke hain! Aage baat karne aur full profile dekhne ke liye Payment complete karein.',
        partner: selected,
      });
      return;
    }

    // Check client-side contact sharing filter and 5-prompt limit
    if (!isPremiumUser) {
      if (promptsUsed >= MAX_FREE_PROMPTS) {
        setPaymentModal({
          open: true,
          reason: '🔒 Aapke 5 Free Chat Prompts poore ho chuke hain! Aage unlimited chat karne ke liye abhi Recharge karein.',
          partner: selected,
        });
        return;
      }

      const violation = detectRestrictedContactInfo(text);
      if (violation) {
        const msg = `🚫 ${violation}. Free chat me Phone Number ya Social ID send karna strictly band hai. Unlimited chat aur contact number share karne ke liye abhi VIP Plan Recharge karein!`;
        setWarningBanner(msg);
        setPaymentModal({
          open: true,
          reason: msg,
          partner: selected,
        });
        return;
      }
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => ({
      ...current,
      [selected.id]: [
        ...(current[selected.id] || []),
        { text, type: 'sent', time: nowTime },
      ],
    }));
    setDraft('');

    if (sendChatMessage) {
      sendChatMessage({
        recipientId: selected.id,
        text,
        time: nowTime,
        senderName: user?.name,
        senderAvatar: user?.avatar,
      });
    }

    try {
      const res = await userApi.sendMessage({
        partnerId: selected.id,
        partnerName: selected.name,
        text,
      });

      const nextCount = res.data?.freePromptsUsed ?? promptsUsed + 1;
      setPromptsUsed(nextCount);

      if (!isPremiumUser && nextCount >= MAX_FREE_PROMPTS) {
        setTimeout(() => {
          setPaymentModal({
            open: true,
            reason:
              '🎉 Aapke 5 Free Prompts poore ho gaye! Unlimited Chat jaari rakhne aur ek dusre ki Full Profile check karne ke liye abhi Payment unlock karein.',
            partner: selected,
          });
        }, 800);
      }
    } catch (err) {
      setWarningBanner(err.message);
      if (err.requiresPayment) {
        setPaymentModal({
          open: true,
          reason: err.message,
          partner: selected,
        });
      }
    }
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    const chosenPlan = PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || PAYMENT_PLANS[1];
    setProcessingPayment(true);
    try {
      const res = await userApi.createPayment({
        planId: chosenPlan.id,
        planName: chosenPlan.name,
        amount: chosenPlan.price,
        paymentMethod,
        paymentReference: paymentRef || `${user?.phone || 'user'}@ybl`,
        unlockedPartnerId: selected?.id || '',
        unlockedPartnerName: selected?.name || '',
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setWarningBanner('');
      const partnerToView = paymentModal.partner;
      setPaymentModal({ open: false, reason: '', partner: null });
      if (partnerToView) {
        setInspectedPartner(partnerToView);
      }
    } catch (err) {
      setWarningBanner(err.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSelectPerson = (id) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  return (
    <>
      <div className="page-nav">
        <Header activePage="messages" />
      </div>
      <main className="messages-page">
        <section className="messages-heading">
          <p className="kicker">YOUR CONVERSATIONS</p>
          <h1>
            Every good story starts
            <br />
            with a hello.
          </h1>
          <p>
            {isPremiumUser
              ? '💎 VIP Premium Unlocked — Unlimited Chat & Full Profile Access Active!'
              : `🎁 Free Chat Quota: ${promptsRemaining} / ${MAX_FREE_PROMPTS} Prompts Left (Phone numbers & Instagram IDs blocked in Free mode)`}
          </p>
        </section>

        {warningBanner && (
          <div className="wrap" style={{ marginBottom: '1rem' }}>
            <div className="chat-violation-alert">
              <span>{warningBanner}</span>
              <button
                type="button"
                onClick={() =>
                  setPaymentModal({ open: true, reason: warningBanner, partner: selected })
                }
              >
                Unlock Unlimited Now 💳
              </button>
            </div>
          </div>
        )}

        {conversations.length === 0 ? (
          <section className="wrap" style={{ padding: '2rem 0 4rem', textAlign: 'center' }}>
            <div
              style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '3rem 2rem',
                border: '1px solid #f3dce2',
                maxWidth: '640px',
                margin: '0 auto',
              }}
            >
              <h3>💬 Real-Time Database Conversations</h3>
              <p style={{ color: '#64748b', margin: '0.75rem 0 1.5rem' }}>
                {isAuthenticated
                  ? 'Abhi database me koi dusra user register nahi hua hai. Jaise hi naya user register karega, aap unke sath real-time chat kar sakenge!'
                  : 'Sign in with your account to view real database profiles and start real-time chatting.'}
              </p>
              {!isAuthenticated && (
                <button type="button" className="coral-button" onClick={openLogin}>
                  Log In to Start Chatting →
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="mobile-chat-nav-tabs">
              <button
                className={mobileView === 'list' ? 'active' : ''}
                onClick={() => setMobileView('list')}
              >
                💬 Inbox ({conversations.length})
              </button>
              {selected && (
                <button
                  className={mobileView === 'chat' ? 'active' : ''}
                  onClick={() => setMobileView('chat')}
                >
                  💬 Chat: {selected.name.split(' ')[0]}
                </button>
              )}
              {selected && (
                <button
                  className={mobileView === 'profile' ? 'active' : ''}
                  onClick={() => {
                    setMobileView('profile');
                    if (!isPremiumUser) {
                      setPaymentModal({
                        open: true,
                        reason: `🔒 ${selected.name} ki Full Profile dekhne ke liye VIP Unlock karein!`,
                        partner: selected,
                      });
                    }
                  }}
                >
                  {isPremiumUser ? '👁️ Bio' : '🔒 Bio'}
                </button>
              )}
            </div>

            <section className={`love-inbox wrap mobile-view-${mobileView}`} aria-label="Messages">
              <aside className="inbox-panel">
                <div className="inbox-title">
                  <div>
                    <p>MESSAGES</p>
                    <h2>
                      Inbox <span>{conversations.length}</span>
                    </h2>
                  </div>
                </div>
                <label className="chat-search">
                  <span>⌕</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search real users..."
                    aria-label="Search messages"
                  />
                </label>
                <div className="chat-preview-list">
                  {visible.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleSelectPerson(person.id)}
                      className={`chat-preview ${person.id === selected?.id ? 'chosen' : ''}`}
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
              </aside>

              {selected && (
                <>
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
                        <small>{selected.online ? '● Active now' : 'Registered Member'}</small>
                      </div>
                      <div className="conversation-actions">
                        <button
                          type="button"
                          className="check-profile-head-btn"
                          onClick={() => handleCheckProfile(selected)}
                        >
                          {isPremiumUser ? '👁️ Full Profile' : '🔒 Check Profile'}
                        </button>
                      </div>
                    </header>

                    <div className="conversation-info">
                      <span>
                        {isPremiumUser ? (
                          <b>💎 VIP Unlimited Chat Active</b>
                        ) : (
                          <>
                            🎁 Free Prompts: <b>{promptsRemaining} / 5 Left</b> (No Phone / No Insta
                            ID)
                          </>
                        )}
                      </span>
                      <button onClick={() => handleCheckProfile(selected)}>
                        {isPremiumUser ? 'Check Full Profile →' : '🔒 Unlock Full Profile →'}
                      </button>
                    </div>

                    <div className="chat-scroll">
                      <div className="chat-day-divider">
                        <span>💬 Real-Time Live Chat</span>
                      </div>
                      {(messages[selected.id] || []).length === 0 ? (
                        <div className="chat-empty-state">
                          <span className="empty-chat-icon">💌</span>
                          <h4>Say hello to {selected.name}!</h4>
                          <p>Neeche message likhein ya quick starters se live conversation start karein.</p>
                        </div>
                      ) : (
                        (messages[selected.id] || []).map((message, index) => {
                          const isSent = message.type === 'sent';
                          return (
                            <div
                              key={`${message.text}-${index}`}
                              className={`dash-msg-row ${isSent ? 'dash-sent-row' : 'dash-received-row'}`}
                            >
                              <div className={`modern-chat-bubble ${isSent ? 'bubble-sent' : 'bubble-received'}`}>
                                {!isSent && (
                                  <div className="bubble-sender-name">
                                    {selected.name}
                                  </div>
                                )}
                                <div className="bubble-text">{message.text}</div>
                                <div className="bubble-meta">
                                  <span className="bubble-time">{message.time}</span>
                                  {isSent && <span className="bubble-ticks">✓✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form className="composer" onSubmit={send}>
                      <button type="button" aria-label="Add emoji">
                        ☺
                      </button>
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={
                          !isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS
                            ? '🔒 5 Prompts Used — Tap to Recharge VIP'
                            : `Message ${selected.name.split(' ')[0]}...`
                        }
                        aria-label="Type a message"
                      />
                      <button className="send" aria-label="Send message">
                        ↑
                      </button>
                    </form>
                  </section>

                  <aside className="match-panel">
                    <div className="match-panel-mobile-header">
                      <button
                        type="button"
                        className="mobile-back-to-chat-btn"
                        onClick={() => setMobileView('chat')}
                      >
                        ← Back to Chat with {selected.name.split(' ')[0]}
                      </button>
                    </div>
                    <div className="match-person">
                      <Avatar person={selected} large />
                      <h3>
                        {selected.name}, {selected.age}
                      </h3>
                      <p>⌖ {selected.city}</p>
                      <span className="online-status">
                        ● {selected.online ? 'Online now' : 'Verified Member'}
                      </span>
                    </div>
                    <div className="match-score">
                      <span>✦</span>
                      <div>
                        <b>{selected.score} match</b>
                        <small>Real database profile</small>
                      </div>
                    </div>
                    <div className="shared-section">
                      <p>SHARED INTERESTS</p>
                      <div>
                        {selected.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shared-section">
                      <p>FULL PROFILE ACCESS</p>
                      <button
                        type="button"
                        onClick={() => handleCheckProfile(selected)}
                        style={{
                          background: isPremiumUser ? '#047857' : '#e85d75',
                          color: '#fff',
                          fontWeight: 700,
                          textAlign: 'center',
                        }}
                      >
                        {isPremiumUser
                          ? `👁️ Check ${selected.name.split(' ')[0]}'s Full Profile`
                          : `🔒 Unlock ${selected.name.split(' ')[0]}'s Full Profile`}
                      </button>
                    </div>
                  </aside>
                </>
              )}
            </section>
          </>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, reason: '', partner: null })}
          reason={paymentModal.reason}
          partner={paymentModal.partner}
          onSuccess={() => {
            setPromptsUsed(0);
          }}
        />

        {/* Partner Full Profile Modal */}
        {inspectedPartner && (
          <div className="pay-modal-backdrop" onClick={() => setInspectedPartner(null)}>
            <div className="pay-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="pay-modal-header">
                <div>
                  <span className="pay-pill-tag">✅ VIP UNLOCKED FULL PROFILE</span>
                  <h2>
                    {inspectedPartner.name}, {inspectedPartner.age} yrs
                  </h2>
                  <p>📍 {inspectedPartner.city}</p>
                </div>
                <button
                  type="button"
                  className="pay-close-btn"
                  onClick={() => setInspectedPartner(null)}
                >
                  ✕
                </button>
              </div>
              <div className="pay-modal-body">
                <div className="info-details-grid">
                  <div className="info-item">
                    <span>Verified Mobile (Privacy Protected)</span>
                    <strong style={{ color: '#e11d48' }}>
                      📱 {inspectedPartner.phone ? (inspectedPartner.phone.startsWith('+91') ? inspectedPartner.phone : `+91 ${inspectedPartner.phone}`) : '+91 98XXXXXX44'} 🔒
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Residential Address (Privacy Protected)</span>
                    <strong>
                      🏠 XXXXXXXXXXXXXX (Delhi NCR • Address protected for safety) 🔒
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Email Address</span>
                    <strong>✉️ {inspectedPartner.email || 's*****@lovekaro.com'} 🔒</strong>
                  </div>
                  <div className="info-item">
                    <span>City &amp; Location</span>
                    <strong>📍 {inspectedPartner.city || 'Delhi NCR'}</strong>
                  </div>
                  <div className="info-item">
                    <span>Marital Status</span>
                    <strong>💍 {inspectedPartner.maritalStatus || 'Never Married'}</strong>
                  </div>
                  <div className="info-item">
                    <span>Religion &amp; Language</span>
                    <strong>
                      🕉️ {inspectedPartner.religion} • 🗣️ {inspectedPartner.motherTongue}
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Profession</span>
                    <strong>💼 {inspectedPartner.occupation}</strong>
                  </div>
                  <div className="info-item">
                    <span>Education</span>
                    <strong>🎓 {inspectedPartner.education}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
