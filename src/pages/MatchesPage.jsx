import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';
import useReveal from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import { getDefaultPhotoForGender, isRealRegisteredUser } from '../data/profiles';

export default function MatchesPage() {
  useReveal();
  const { user, isAuthenticated, openSignup } = useAuth();
  const [dbProfiles, setDbProfiles] = useState([]);
  const [likedNames, setLikedNames] = useState([]);
  const [genderTab, setGenderTab] = useState('auto'); // 'auto' | 'female' | 'male' | 'all'
  const [deckOffset, setDeckOffset] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const [savingSwipe, setSavingSwipe] = useState(false);
  const dragStart = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchProfiles = async () => {
      try {
        if (isAuthenticated) {
          const dash = await userApi.getDashboard();
          if (mounted && Array.isArray(dash?.data?.profiles)) {
            setDbProfiles(dash.data.profiles);
            return;
          }
        }
        const pub = await userApi.getPublicProfiles({
          gender: 'all',
          viewerGender: user?.gender || '',
        });
        if (mounted && Array.isArray(pub?.data)) {
          setDbProfiles(pub.data);
        }
      } catch (err) {
        console.warn('Matches fetch fallback:', err.message);
      }
    };
    fetchProfiles();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.gender]);

  const effectiveTargetGender = useMemo(() => {
    if (genderTab === 'female') return 'female';
    if (genderTab === 'male') return 'male';
    if (genderTab === 'all') return 'all';
    const ug = String(user?.gender || '').toLowerCase();
    if (ug === 'male') return 'female';
    if (ug === 'female') return 'male';
    return 'all';
  }, [genderTab, user?.gender]);

  const displayedProfiles = useMemo(() => {
    return dbProfiles
      .filter((p) => {
        if (!isRealRegisteredUser(p)) return false;
        if (effectiveTargetGender === 'all') return true;
        return String(p.gender || '').toLowerCase() === effectiveTargetGender;
      })
      .map((p, idx) => {
        const g = String(p.gender || 'female').toLowerCase();
        const fallbackImg = getDefaultPhotoForGender(g, idx);
        const imgUrl =
          p.avatar && !p.avatar.includes('images.unsplash.com') ? p.avatar : fallbackImg;
        return {
          id: p._id || `db-${idx}`,
          name: p.name,
          age: p.age || 24,
          gender: g,
          city: p.location?.city ? `${p.location.city}, India` : p.city || 'New Delhi, India',
          occupation: p.occupation || 'Verified Member',
          religion: p.religion || 'Hindu',
          motherTongue: p.motherTongue || 'Hindi',
          tags:
            Array.isArray(p.interests) && p.interests.length > 0
              ? p.interests.slice(0, 3)
              : ['Verified Profile', p.religion || 'Hindu', p.occupation || 'Professional'],
          image: imgUrl,
        };
      });
  }, [dbProfiles, effectiveTargetGender]);

  useEffect(() => {
    setDeckOffset(0);
    setLeaving(null);
    setDragX(0);
  }, [effectiveTargetGender, dbProfiles]);

  const activeProfile = displayedProfiles[deckOffset];
  const remainingProfiles = Math.max(displayedProfiles.length - deckOffset, 0);

  const finishSwipe = async (action) => {
    if (!activeProfile || savingSwipe || leaving) return;
    const pid = String(activeProfile.id || '');
    setLeaving(action);
    setSavingSwipe(true);
    if (action === 'like') setLikedNames((prev) => [...prev, activeProfile.name]);
    try {
      if (isAuthenticated && /^[0-9a-fA-F]{24}$/.test(pid)) await userApi.swipeProfile(pid, action);
      window.setTimeout(() => {
        setDeckOffset((value) => value + 1);
        setLeaving(null); setDragX(0); setSavingSwipe(false);
      }, 260);
    } catch (err) {
      console.warn('Swipe could not be saved:', err.message);
      if (action === 'like') setLikedNames((prev) => prev.filter((name) => name !== activeProfile.name));
      setLeaving(null); setDragX(0); setSavingSwipe(false);
    }
  };

  const onPointerDown = (event) => { if (!savingSwipe) { dragStart.current = event.clientX; event.currentTarget.setPointerCapture?.(event.pointerId); } };
  const onPointerMove = (event) => { if (dragStart.current !== null && !savingSwipe) setDragX(event.clientX - dragStart.current); };
  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    const offset = dragX; dragStart.current = null;
    if (Math.abs(offset) >= 100) finishSwipe(offset > 0 ? 'like' : 'pass'); else setDragX(0);
  };

  return (
    <>
      <Header activePage="matches" />
      <PageHero
        eyebrow="INDIAN COMPATIBILITY MATCHES"
        title={
          <>
            Matches shaped by
            <br />
            <em>values, vibe and vision.</em>
          </>
        }
        text="Every suggestion is shaped by the things that matter most in India — emotional maturity, city rhythm, chai & food affinities, and shared family values."
        image="/kariheslinofficial_ssspin.io_1793082068.jpg"
        imagePosition="center 8%"
        imageAlt="Indian couple walking happily together on the beach"
      >
        <a className="coral-button" href="#match-list">
          View today’s matches →
        </a>
      </PageHero>

      <main>
        <section className="wrap match-summary reveal from-top">
          <div>
            <span>✦</span>
            <b>{remainingProfiles} Profiles left to discover</b>
            <p>
              {user?.gender === 'male'
                ? 'Verified Women profiles matched for you'
                : user?.gender === 'female'
                ? 'Verified Men profiles matched for you'
                : 'Fresh profiles curated for you today'}
            </p>
          </div>
          <div>
            <span>♡</span>
            <b>95% average fit</b>
            <p>High lifestyle and emotional resonance</p>
          </div>
          <div>
            <span>✓</span>
            <b>100% Photo Verified</b>
            <p>Real photos &amp; phone verified for safe dating</p>
          </div>
        </section>

        <section className="wrap match-list" id="match-list">
          <div
            className="section-intro reveal from-left"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <p className="kicker">
                {user?.gender === 'male'
                  ? '💖 VERIFIED WOMEN PROFILES FOR YOU'
                  : user?.gender === 'female'
                  ? '💖 VERIFIED MEN PROFILES FOR YOU'
                  : 'CURATED FOR YOU'}
              </p>
              <h2>
                {effectiveTargetGender === 'female'
                  ? 'Today’s Top Women Matches'
                  : effectiveTargetGender === 'male'
                  ? 'Today’s Top Men Matches'
                  : 'Today’s Top Matches'}
              </h2>
              <p>
                {user?.gender === 'male'
                  ? 'Since you registered as a Man, we are showing you verified Women profiles with real photos.'
                  : user?.gender === 'female'
                  ? 'Since you registered as a Woman, we are showing you verified Men profiles with real photos.'
                  : 'Genuine singles nearby who share your humor, favorite cafes, and perspective on life.'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                background: '#fff0f4',
                padding: '6px',
                borderRadius: '999px',
                border: '1px solid #f7cddb',
              }}
            >
              {[
                {
                  id: 'auto',
                  label:
                    user?.gender === 'male'
                      ? '💖 For You (Women)'
                      : user?.gender === 'female'
                      ? '💖 For You (Men)'
                      : '✨ Recommended',
                },
                { id: 'female', label: '👩 Women Profiles' },
                { id: 'male', label: '👨 Men Profiles' },
                { id: 'all', label: '🌟 All Singles' },
              ].map((tab) => {
                const active = genderTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGenderTab(tab.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      background: active
                        ? 'linear-gradient(135deg, #f23878, #ff6498)'
                        : 'transparent',
                      color: active ? '#ffffff' : '#881337',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!activeProfile ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '3rem 2rem',
                textAlign: 'center',
                border: '1px dashed #f3c6d5',
                marginTop: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 8px', color: '#1e1620' }}>
                💖 Only Real Registered Database Users Are Shown Here
              </h3>
              <p style={{ color: '#64748b', maxWidth: '540px', margin: '0 auto 1.25rem' }}>
                Abhi is filter me koi real user signup nahi hua hai. Jaise hi naya user signup
                karega, unki real profile with photo yahan database se live show hogi!
              </p>
              {!isAuthenticated && (
                <button type="button" className="coral-button" onClick={openSignup}>
                  Sign Up Free →
                </button>
              )}
            </div>
          ) : (
            <div className="match-grid swipe-deck-wrap">
              <p className="swipe-progress">{remainingProfiles} profile{remainingProfiles === 1 ? '' : 's'} remaining. Choose Like or Pass to see the next profile.</p>
              {displayedProfiles.slice(deckOffset, deckOffset + 1).map((profile, index) => (
                <div
                  className={`reveal ${index % 2 ? 'from-right' : 'from-left'}`}
                  key={profile.id || profile.name}
                >
                  <ProfileCard
                    profile={profile}
                    isLiked={likedNames.includes(profile.name)}
                    onLike={() => finishSwipe('like')}
                    onPass={() => finishSwipe('pass')}
                    isSaving={savingSwipe}
                    onSwipe={finishSwipe}
                  />
                  <div className="fit-label">
                    ✦ {97 - (index % 6) * 2}% compatibility fit •{' '}
                    <a
                      href="#messages"
                      style={{ color: '#f23878', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Chat Now →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="match-tip">
          <div className="wrap reveal from-bottom">
            <span>♡</span>
            <div>
              <h2>Show your real desi charm &amp; story.</h2>
              <p>
                Profiles that share authentic prompts — favorite street food trails, indie
                playlists, or how you spend Sunday mornings with chai — get 3x more meaningful
                connections.
              </p>
            </div>
            <a className="coral-button" href="#profile">
              Update profile →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
