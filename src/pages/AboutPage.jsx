import Header from '../components/Header'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'
import useReveal from '../hooks/useReveal'

export default function AboutPage() {
  useReveal()
  return (
    <>
      <Header activePage="about" />
      <PageHero
        eyebrow="ABOUT LOVEKARO INDIA"
        title={<>Modern Indian dating<br /><em>that feels respectful & real.</em></>}
        text="Lovekaro bridges the gap in India between superficial swipe apps and rigid traditional matrimonial portals — giving young Indians a safe, warm space to build genuine relationships."
        image="/1raushan1_ssspin.io_1793082108.png"
      >
        <a className="coral-button" href="#our-story">Our story →</a>
      </PageHero>

      <main>
        <section className="wrap story-grid" id="our-story">
          <div className="story-image reveal from-left">
            <img src="/itz_aartiii__ssspin.io_1793082150.jpg" alt="Two people holding hands over flowers" />
          </div>
          <div className="reveal from-right">
            <p className="kicker">WHY WE CREATED LOVEKARO</p>
            <h2>Built for India, crafted with heart.</h2>
            <p>Dating in India is unique. We cherish heartfelt conversations, shared chai, family bonds, and above all, mutual respect. Yet most global dating apps treat connections like an endless game, while traditional matrimonial sites feel like rigid interviews.</p>
            <p>Lovekaro is the warm middle ground: a respectful haven where modern Indian singles can connect organically, share laughs, and fall in love without pressure.</p>
          </div>
        </section>

        <section className="values">
          <div className="wrap">
            <div className="section-intro reveal from-top">
              <p className="kicker">OUR PILLARS</p>
              <h2>What we bring to Indian dating</h2>
            </div>
            <div className="value-grid">
              {[
                ['01', 'Dil Se & Authentic', 'Profiles built on real stories, cultural interests, and everyday passions rather than superficial flexes.'],
                ['02', 'Women’s Safety First', 'Mandatory verification, zero-tolerance harassment rules, and privacy filters so women date with total confidence.'],
                ['03', 'Culture Meets Modernity', 'Designed for modern Indians across Delhi, Mumbai, Bengaluru, and beyond who seek lasting, meaningful companionship.']
              ].map((value, index) => (
                <article className={`reveal ${index === 1 ? 'from-bottom' : 'from-left'}`} key={value[0]}>
                  <b>{value[0]}</b>
                  <h3>{value[1]}</h3>
                  <p>{value[2]}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap team-callout reveal from-bottom">
          <div>
            <p className="kicker">START YOUR STORY</p>
            <h2>Ready to find your person<br />in India?</h2>
          </div>
          <a className="coral-button" href="#matches">Join Lovekaro free →</a>
        </section>
      </main>
      <Footer />
    </>
  )
}

