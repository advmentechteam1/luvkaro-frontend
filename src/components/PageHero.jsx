export default function PageHero({ eyebrow, title, text, image, children }) {
  return <section className="page-hero"><div className="wrap page-hero-grid"><div className="reveal from-left"><p className="kicker">{eyebrow}</p><h1>{title}</h1><p>{text}</p>{children}</div><div className="page-hero-photo reveal from-right"><img src={image} alt=""/></div></div></section>
}
