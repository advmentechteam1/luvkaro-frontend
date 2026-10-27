import Header from '../components/Header'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'
import ProfileCard from '../components/ProfileCard'
import useReveal from '../hooks/useReveal'
import { profiles } from '../data/profiles'

export default function MatchesPage() {
  useReveal()
  return (
    <>
      <Header activePage="matches" />
      <PageHero
        eyebrow="INDIAN COMPATIBILITY MATCHES"
        title={<>Matches shaped by<br /><em>values, vibe and vision.</em></>}
        text="Every suggestion is shaped by the things that matter most in India — emotional maturity, city rhythm, chai & food affinities, and shared family values."
        image="/kariheslinofficial_ssspin.io_1793082068.jpg"
        imagePosition="center 8%"
        imageAlt="Indian couple walking happily together on the beach"
      >
        <a className="coral-button" href="#match-list">View today’s matches →</a>
      </PageHero>

      <main>
        <section className="wrap match-summary reveal from-top">
          <div>
            <span>✦</span>
            <b>14 new matches</b>
            <p>Fresh profiles curated for you today</p>
          </div>
          <div>
            <span>♡</span>
            <b>94% average fit</b>
            <p>High lifestyle and emotional resonance</p>
          </div>
          <div>
            <span>✓</span>
            <b>100% Verified</b>
            <p>Aadhaar & photo verified for safe dating</p>
          </div>
        </section>

        <section className="wrap match-list" id="match-list">
          <div className="section-intro reveal from-left">
            <p className="kicker">CURATED FOR YOU</p>
            <h2>Today’s top matches</h2>
            <p>Genuine singles nearby who share your humor, favorite cafes, and perspective on life.</p>
          </div>
          <div className="match-grid">
            {profiles.map((profile, index) => (
              <div className={`reveal ${index % 2 ? 'from-right' : 'from-left'}`} key={profile.name}>
                <ProfileCard profile={profile} isLiked={false} onLike={() => {}} />
                <div className="fit-label">✦ {97 - index * 3}% compatibility fit</div>
              </div>
            ))}
          </div>
        </section>

        <section className="match-tip">
          <div className="wrap reveal from-bottom">
            <span>♡</span>
            <div>
              <h2>Show your real desi charm & story.</h2>
              <p>Profiles that share authentic prompts — favorite street food trails, indie playlists, or how you spend Sunday mornings with chai — get 3x more meaningful connections.</p>
            </div>
            <a className="coral-button" href="#home">Update profile →</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

