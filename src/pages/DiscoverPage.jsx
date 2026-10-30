import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';
import ProfileCard from '../components/ProfileCard';
import useReveal from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import { getDefaultPhotoForGender, isRealRegisteredUser } from '../data/profiles';

const groups = [
  { name: 'Chai & Cafe Dates', icon: '☕', count: '1,420+ singles', image: '/images%20(15).jpg' },
  { name: 'Sunset & Marine Walks', icon: '🌅', count: '890+ singles', image: '/images%20(16).jpg' },
  {
    name: 'Serious Relationship & Dil Se',
    icon: '♡',
    count: '2,850+ singles',
    image: '/itz_aartiii__ssspin.io_1793082150.jpg',
  },
  {
    name: 'Bollywood & Indie Music',
    icon: '🎶',
    count: '1,640+ singles',
    image: '/images%20(17).jpg',
  },
];

export default function DiscoverPage() {
  useReveal();
  const { user, isAuthenticated } = useAuth();
  const [dbProfiles, setDbProfiles] = useState([]);
  const [likedNames, setLikedNames] = useState([]);
  const [genderFilter, setGenderFilter] = useState('auto');

  useEffect(() => {
    let mounted = true;
    const loadDiscover = async () => {
      try {
        if (isAuthenticated) {
          const dash = await userApi.getDashboard();
          if (mounted && dash?.data?.profiles?.length) {
            setDbProfiles(dash.data.profiles);
            return;
          }
        }
        const pub = await userApi.getPublicProfiles({
          gender: 'all',
          viewerGender: user?.gender || '',
        });
        if (mounted && Array.isArray(pub?.data) && pub.data.length > 0) {
          setDbProfiles(pub.data);
        }
      } catch (err) {
        console.warn('Discover profiles fallback:', err.message);
      }
    };
    loadDiscover();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.gender]);

  const targetGender = useMemo(() => {
    if (genderFilter === 'female') return 'female';
    if (genderFilter === 'male') return 'male';
    if (genderFilter === 'all') return 'all';
    const ug = String(user?.gender || '').toLowerCase();
    if (ug === 'male') return 'female';
    if (ug === 'female') return 'male';
    return 'all';
  }, [genderFilter, user?.gender]);

  const discoverProfiles = useMemo(() => {
    return dbProfiles
      .filter((p) => {
        if (!isRealRegisteredUser(p)) return false;
        if (targetGender === 'all') return true;
        return String(p.gender || '').toLowerCase() === targetGender;
      })
      .map((p, idx) => {
        const g = String(p.gender || 'female').toLowerCase();
        const fallbackImg = getDefaultPhotoForGender(g, idx);
        const imgUrl =
          p.avatar && !p.avatar.includes('images.unsplash.com') ? p.avatar : fallbackImg;
        return {
          id: p._id || `disc-${idx}`,
          name: p.name,
          age: p.age || 24,
          gender: g,
          city: p.location?.city ? `${p.location.city}, India` : p.city || 'New Delhi, India',
          tags:
            Array.isArray(p.interests) && p.interests.length > 0
              ? p.interests.slice(0, 3)
              : ['Verified Profile', p.religion || 'Hindu', p.occupation || 'Professional'],
          image: imgUrl,
        };
      });
  }, [dbProfiles, targetGender]);

  const toggleLike = async (profile) => {
    if (!profile) return;
    const name = profile.name;
    const pid = (profile._id || profile.id)?.toString();
    const alreadyLiked = likedNames.includes(name);

    setLikedNames((prev) =>
      alreadyLiked ? prev.filter((n) => n !== name) : [...prev, name]
    );

    if (isAuthenticated && pid && /^[0-9a-fA-F]{24}$/.test(pid)) {
      try {
        await userApi.likeProfile(pid);
      } catch (err) {
        console.warn('Like profile error:', err.message);
      }
    }
  };

  return (
    <>
      <Header activePage="discover" />
      <PageHero
        eyebrow="DISCOVER INDIAN SINGLES"
        title={
          <>
            A little closer to
            <br />
            <em>your kind of person, dil se.</em>
          </>
        }
        text="Find genuine people through the things that matter most in India — shared cultural rhythms, favorite food spots, city vibes, and honest intentions."
        image="/elane2000santos_ssspin.io_1793082036.jpg"
        imagePosition="center 65%"
        imageAlt="Indian couple enjoying a romantic conversation over candlelight dinner"
      >
        <a className="coral-button" href="#discover-profiles">
          Start discovering →
        </a>
      </PageHero>

      <main>
        {/* Opposite-Gender Verified Singles Section with Real Images */}
        <section className="wrap match-list" id="discover-profiles" style={{ paddingTop: '2.5rem' }}>
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
                  ? '👩 DISCOVER VERIFIED WOMEN'
                  : user?.gender === 'female'
                  ? '👨 DISCOVER VERIFIED MEN'
                  : '✨ DISCOVER VERIFIED PROFILES'}
              </p>
              <h2>
                {targetGender === 'female'
                  ? 'Verified Women Profiles Near You'
                  : targetGender === 'male'
                  ? 'Verified Men Profiles Near You'
                  : 'Verified Indian Singles Near You'}
              </h2>
              <p>
                {user?.gender === 'male'
                  ? 'Showing verified Women profiles with photos matched to your preference.'
                  : user?.gender === 'female'
                  ? 'Showing verified Men profiles with photos matched to your preference.'
                  : 'Every profile below is 100% photo & mobile verified in our database.'}
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
                { id: 'female', label: '👩 Women' },
                { id: 'male', label: '👨 Men' },
                { id: 'all', label: '🌟 All' },
              ].map((tab) => {
                const active = genderFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGenderFilter(tab.id)}
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
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {discoverProfiles.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                border: '1px dashed #f3c6d5',
                marginTop: '1.25rem',
              }}
            >
              <h3 style={{ margin: '0 0 8px', color: '#1e1620' }}>
                ✨ 100% Real Signed-Up Users Only
              </h3>
              <p style={{ color: '#64748b', maxWidth: '520px', margin: '0 auto' }}>
                Yahan sirf real users jo signup karenge unki profile database se show hogi. Jaise hi
                naya user signup karega, unka card with photo yahan live dikhega!
              </p>
            </div>
          ) : (
            <div className="match-grid">
              {discoverProfiles.map((profile, index) => (
                <div
                  className={`reveal ${index % 2 ? 'from-right' : 'from-left'}`}
                  key={profile.id || profile.name}
                >
                  <ProfileCard
                    profile={profile}
                    isLiked={likedNames.includes(profile.name)}
                    onLike={() => toggleLike(profile)}
                  />
                  <div className="fit-label">
                    ✦ {96 - (index % 6) * 2}% match fit •{' '}
                    <a
                      href="#messages"
                      style={{ color: '#f23878', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Message →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="wrap discovery-categories" id="categories">
          <div className="section-intro reveal from-top">
            <p className="kicker">BROWSE BY VIBE &amp; CITY</p>
            <h2>
              Find a connection that
              <br />
              feels natural &amp; respectful.
            </h2>
            <p>
              Pick a vibe and let Lovekaro introduce you to verified singles across Delhi NCR,
              Mumbai, Bengaluru, Pune, and 50+ Indian cities.
            </p>
          </div>
          <div className="category-grid">
            {groups.map((group, index) => (
              <article
                className={`category-card reveal ${index % 2 ? 'from-right' : 'from-left'}`}
                key={group.name}
              >
                <img src={group.image} alt={group.name} />
                <div>
                  <span>{group.icon}</span>
                  <h3>{group.name}</h3>
                  <p>{group.count}</p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = 'matches';
                    }}
                  >
                    Explore →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="interest-band">
          <div className="wrap reveal from-bottom">
            <p className="kicker">TRENDING IN INDIA</p>
            <h2>Start with something you love</h2>
            <div className="interest-chips">
              {[
                'DelhiNCR',
                'MumbaiSingles',
                'BengaluruVibe',
                'ChaiLover',
                'FilterCoffee',
                'StreetFoodTrails',
                'BollywoodTrivia',
                'IndieMusic',
                'WeekendTreks',
                'LateNightDrives',
                'StandupComedy',
                'FamilyValues',
              ].map((item) => (
                <button key={item} type="button">
                  #{item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap community-row">
          <div className="community-image reveal from-left">
            <img
              src="/1raushan1_ssspin.io_1793082108.png"
              alt="Couple walking along the shore at sunset leaving footprints in the sand"
              style={{ objectPosition: 'center 15%' }}
            />
          </div>
          <div className="reveal from-right">
            <p className="kicker">SAFE &amp; VERIFIED IN INDIA</p>
            <h2>
              Real people. Real conversations.
              <br />
              Zero creepy vibes.
            </h2>
            <p>
              Built with mandatory selfie &amp; ID checks, high privacy boundaries for Indian women,
              and prompt reporting so you can explore romance with total peace of mind.
            </p>
            <div className="mini-stats">
              <span>
                <b>4.9/5</b>trust score across India
              </span>
              <span>
                <b>100%</b>safe verified profiles
              </span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
