import Header from '../components/Header'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'
import useReveal from '../hooks/useReveal'

const groups = [
  { name: 'Chai & Cafe Dates', icon: '☕', count: '1,420+ singles', image: '/images%20(15).jpg' },
  { name: 'Sunset & Marine Walks', icon: '🌅', count: '890+ singles', image: '/images%20(16).jpg' },
  { name: 'Serious Relationship & Dil Se', icon: '♡', count: '2,850+ singles', image: '/itz_aartiii__ssspin.io_1793082150.jpg' },
  { name: 'Bollywood & Indie Music', icon: '🎶', count: '1,640+ singles', image: '/images%20(17).jpg' }
]

export default function DiscoverPage() {
  useReveal()
  return (
    <>
      <Header activePage="discover" />
      <PageHero
        eyebrow="DISCOVER INDIAN SINGLES"
        title={<>A little closer to<br /><em>your kind of person, dil se.</em></>}
        text="Find genuine people through the things that matter most in India — shared cultural rhythms, favorite food spots, city vibes, and honest intentions."
        image="/elane2000santos_ssspin.io_1793082036.jpg"
        imagePosition="center 65%"
        imageAlt="Indian couple enjoying a romantic conversation over candlelight dinner"
      >
        <a className="coral-button" href="#categories">Start discovering →</a>
      </PageHero>

      <main>
        <section className="wrap discovery-categories" id="categories">
          <div className="section-intro reveal from-top">
            <p className="kicker">BROWSE BY VIBE & CITY</p>
            <h2>Find a connection that<br />feels natural & respectful.</h2>
            <p>Pick a vibe and let Lovekaro introduce you to verified singles across Delhi NCR, Mumbai, Bengaluru, Pune, and 50+ Indian cities.</p>
          </div>
          <div className="category-grid">
            {groups.map((group, index) => (
              <article className={`category-card reveal ${index % 2 ? 'from-right' : 'from-left'}`} key={group.name}>
                <img src={group.image} alt={group.name} />
                <div>
                  <span>{group.icon}</span>
                  <h3>{group.name}</h3>
                  <p>{group.count}</p>
                  <button>Explore →</button>
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
                'FamilyValues'
              ].map((item) => (
                <button key={item}>#{item}</button>
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
            <p className="kicker">SAFE & VERIFIED IN INDIA</p>
            <h2>Real people. Real conversations.<br />Zero creepy vibes.</h2>
            <p>Built with mandatory selfie & ID checks, high privacy boundaries for Indian women, and prompt reporting so you can explore romance with total peace of mind.</p>
            <div className="mini-stats">
              <span><b>4.9/5</b>trust score across India</span>
              <span><b>100%</b>safe verified profiles</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

