import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { profiles } from '../data/profiles'
import useReveal from '../hooks/useReveal'

const benefits = [
  ['♥','100% Verified Profiles','Aadhaar & photo-verified singles across India. Zero bots.'],
  ['✦','Safe for Indian Women','Privacy filters, anti-screenshot & 24/7 dedicated moderation.'],
  ['☕','Chai, Vibe & Culture','Match on food walks, languages, music, and shared life goals.'],
  ['▣','Meaningful Chats','Thoughtful icebreakers so you never start with an awkward "Hey".'],
  ['★','Pan-India Community','Connect in Delhi NCR, Mumbai, Bengaluru, Pune & 50+ cities.']
]
const steps = [
  ['01','♙','Create Your Profile','Share your photos, your city, languages, and what truly makes you smile.'],
  ['02','⌕','Discover Compatible Singles','Browse verified Indian singles filtered by lifestyle, vibe, and intent.'],
  ['03','▢','Start A Real Conversation','Send a genuine like, chat safely, and plan that low-pressure first chai.']
]

export default function HomePage() {
  useReveal()
  const [liked, setLiked] = useState([])
  const toggle = (name) => setLiked(list => list.includes(name) ? list.filter(item => item !== name) : [...list, name])
  return <main className="soul-home">
    <Header activePage="home" />
    <section className="soul-hero" id="home">
      <div className="soul-hero-inner wrap">
        <div className="soul-copy">
          <p className="soul-pill">♥ India’s Warmest Dating Space　•　100% Verified Singles　•　Zero Creep Policy</p>
          <h1>Not Just Another Dating App,<br/>It’s India’s Space to <em>Fall in Love♡</em></h1>
          <p>Meet verified singles across Delhi, Mumbai, Bengaluru, Pune & 50+ Indian cities who share your values, everyday joys, and genuine intentions.</p>
          <div className="soul-actions">
            <a href="#matches">Find Your Match Now　→</a>
            <a className="ghost" href="#how-it-works">How Luvkaro Works</a>
          </div>
          <div className="soul-members">
            <div className="avatars">
              {profiles.map(person => <img src={person.image} key={person.name} alt={person.name}/>)}
            </div>
            <span><b>5 Lakh+ Verified Singles</b><br/>Connecting across India</span>
          </div>
        </div>
        <div className="soul-photo">
          <img src="/images%20(17).jpg" alt="A happy Indian couple holding hearts together"/>
          <p>Better<br/>Together <span>♡</span></p>
          <i>♡</i>
          <div className="soul-match">
            <img src={profiles[0].image} alt="Priya"/>
            <span><b>New Mutual Match!</b><small>Priya from New Delhi liked your profile<br/>2m ago</small></span>
            <strong>→</strong>
          </div>
        </div>
      </div>
    </section>
    <section className="soul-benefits">
      <div className="wrap">
        {benefits.map(item => (
          <article key={item[1]}>
            <i>{item[0]}</i>
            <h3>{item[1]}</h3>
            <p>{item[2]}</p>
          </article>
        ))}
      </div>
    </section>
    <section className="soul-steps wrap" id="how-it-works"><div><p className="soul-kicker">♥ HOW IT WORKS IN INDIA</p><h2>Finding Your Person<br/>Is Easier Than You Think <em>♡</em></h2><p>We replaced superficial swipes and awkward biodatas with a dignified, modern matchmaking experience tailored for today’s young Indians.</p><a href="#matches">Explore Verified Profiles　→</a></div><div className="step-cards">{steps.map((step,index) => <article key={step[0]}><b>{step[0]}</b><i>{step[1]}</i><h3>{step[2]}</h3><p>{step[3]}</p>{index < 2 && <span>→</span>}</article>)}</div></section>
    <section className="soul-featured" id="matches"><div className="wrap"><div className="feature-top"><div><p className="soul-kicker">♥ FEATURED INDIAN SINGLES</p><h2>Real People, Real Connections</h2><p>Discover thoughtful working professionals, creative souls, and genuine singles<br/>who are looking for real companionship.</p></div><a href="#discover">Browse By City & Interests　→</a></div><div className="soul-profile-row">{profiles.map((person) => <article className="soul-profile" key={person.name}><img src={person.image} alt={person.name}/><span className="online">● Active Today</span><div><h3>{person.name.split(' ')[0]}, {person.age}</h3><p>⌖ {person.city}</p><small>{person.tags.slice(0,2).map(tag => <b key={tag}>{tag}</b>)}</small></div><button onClick={() => toggle(person.name)} className={liked.includes(person.name) ? 'liked' : ''}>♡</button></article>)}</div></div></section>
    <section className="soul-testimonials wrap"><p className="soul-kicker">♥ STORIES FROM INDIA</p><h2>Real Couples. Real Love Stories.</h2><p>From late-night chai dates to lifelong partnerships, see how singles across India found their person on Luvkaro.</p><div>{[['Priya & Siddharth (Delhi NCR)','/priya-sharma.jpg','We bonded over our shared love for Old Delhi food walks and acoustic indie music. Luvkaro made dating feel respectful, warm, and genuine!'],['Rohit & Ananya (Mumbai)','/rohit-verma.jpg','In a fast-paced city like Mumbai, it is rare to find someone who shares your values. We met for a Marine Drive sunset walk, and it felt like home.'],['Sneha & Vikram (Bengaluru)','/images%20(7).jpg','As a woman, my safety and peace of mind were top priorities. Luvkaro’s verified community gave me the safest, most comfortable dating experience.']].map(item => <article key={item[0]}><img src={item[1]} alt={item[0]}/><p>“{item[2]}”</p><b>{item[0]}</b><small>★★★★★</small></article>)}</div></section>
    <section className="soul-app wrap"><div className="app-phones"><img src="/1raushan1_ssspin.io_1793082108.png" alt="Couple walking on beach at sunset"/><img src="/kariheslinofficial_ssspin.io_1793082068.jpg" alt="Couple walking in sea"/></div><div><p className="soul-kicker">♥ DIL SE DATING • ON THE GO</p><h2>Love Karo, Dil Se.<br/>Download Luvkaro.</h2><p>Connect with verified singles across Delhi NCR, Mumbai, Bengaluru, Pune, Hyderabad, and 50+ Indian cities anytime, anywhere.</p><button>　Download on App Store</button><button>▶　GET IT ON Google Play</button></div><ul><li>🔔 <span><b>Instant Match Alerts</b>Never miss a message from your favorite connection</span></li><li>♥ <span><b>Cultural & Lifestyle Matching</b>Match on food, music, languages & goals</span></li><li>▣ <span><b>Private & Safe Messaging</b>End-to-end encrypted with screenshot protection</span></li></ul></section>
    <section className="soul-match-flow"><div className="wrap"><div className="flow-heading"><p className="soul-kicker">MADE FOR MEANINGFUL CONNECTIONS IN INDIA</p><h2>More than a match.<br/><em>A better beginning for your heart.</em></h2><p>From the first warm hello to dates you both look forward to, Luvkaro gives every connection the space and respect to blossom naturally.</p></div><div className="flow-list"><article><b>01</b><span>♡</span><div><h3>Share What Truly Matters</h3><p>Highlight your cultural background, career passions, weekend rituals, and what family means to you.</p></div></article><article><b>02</b><span>✦</span><div><h3>Meet Your Kind of Person</h3><p>Discover thoughtful, verified singles who appreciate who you are — not just a curated photo album.</p></div></article><article><b>03</b><span>☕</span><div><h3>From Chat to First Chai</h3><p>Break the ice with fun Indian cultural prompts and plan a relaxed first date at a favorite cafe.</p></div></article></div></div></section>
    <section className="soul-safety wrap"><div className="safety-photo"><img src="/itz_aartiii__ssspin.io_1793082150.jpg" alt="Two people holding hands over roses - safe dating"/><span>♡<br/><small>Private & Verified</small></span></div><div><p className="soul-kicker">WOMEN’S SAFETY FIRST IN INDIA</p><h2>Feel respected, safe & in control<br/>in every conversation.</h2><p>We built Luvkaro specifically to solve safety and harassment concerns in Indian online dating with proactive AI moderation, ID verification, and full privacy tools.</p><div className="safety-points"><span>✓ 100% Aadhaar & Selfie Verified</span><span>✓ Zero tolerance for creeps or spam</span><span>✓ Anti-screenshot & private photos</span><span>✓ 24/7 Dedicated Indian support team</span></div><a href="#messages">Learn how we keep dating safe　→</a></div></section>
    <section className="soul-moments"><div className="wrap"><div className="moments-title"><p className="soul-kicker">INDIAN FIRST-DATE INSPIRATIONS</p><h2>Great dates start with<br/>a simple, good idea.</h2><p>Skip the formal dinner interviews. Try these relaxed, low-pressure date ideas tailored for Indian cities.</p></div><div className="moment-grid"><article className="moment-tall"><img src="/images%20(15).jpg" alt="Coffee and conversation"/><div><span>01</span><h3>Kulhad chai, then a walk</h3><p>From cozy indie cafes in Hauz Khas to Bandra or Indiranagar, start with an easy conversation.</p></div></article><article><span>02</span><i>♫</i><h3>Trade Bollywood & Indie tunes</h3><p>From Arijit Singh to Prateek Kuhad, exchange songs that describe your vibe.</p></article><article className="moment-dark"><span>03</span><i>✦</i><h3>Ask a better question</h3><p>“Sunday morning filter coffee or late night ice cream drive at India Gate / Marine Drive?”</p></article><article className="moment-wide"><img src="/images%20(16).jpg" alt="Happy couple watching the sunset"/><div><span>04</span><h3>Sunset by the promenade</h3><p>Catch the evening breeze, share street food, and talk without rush.</p></div></article></div></div></section>
    <section className="dating-guide"><div className="wrap"><div className="dating-guide-intro"><p className="soul-kicker">DATE WITH CONFIDENCE IN INDIA</p><h2>Good chemistry starts<br/>with genuine conversation.</h2><p>Everything you need to move from a first like to a comfortable, memorable first date in your city—at your own pace.</p><a href="#matches">Explore verified singles near you →</a></div><div className="dating-guide-grid"><article><span>01</span><i>☕</i><h3>Choose relaxed public spots</h3><p>Meet at a well-known cafe, bookstore or art exhibit where both of you feel comfortable and relaxed.</p><small>Zero-pressure first dates</small></article><article><span>02</span><i>✦</i><h3>Skip the biodata checklist</h3><p>Ask about their passions, favorite monsoon memories, or childhood dreams instead of job CTC or resume stats.</p><small>Real conversation starters</small></article><article><span>03</span><i>♡</i><h3>Honor your comfort & boundaries</h3><p>Take your time before sharing personal numbers. Stay on Luvkaro chat until you feel 100% confident.</p><small>Safe & private always</small></article></div></div></section>
    <section className="dating-note wrap"><span>♡</span><p><b>Dating tip of the day</b> — Mentioning their favorite chai spot, travel story, or music artist gets 4x more replies than a plain "Hey" or "Hii dear"!</p><button>Save this tip</button></section>
    <Footer />
  </main>
}
