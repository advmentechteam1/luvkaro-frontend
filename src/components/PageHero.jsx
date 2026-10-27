export default function PageHero({
  eyebrow,
  title,
  text,
  image,
  imagePosition = 'center 15%',
  imageAlt = 'Indian couple connection',
  children
}) {
  return (
    <section className="page-hero">
      <div className="wrap page-hero-grid">
        <div className="reveal from-left">
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{text}</p>
          {children}
        </div>
        <div
          className="page-hero-photo reveal from-right"
          style={{ '--hero-pos': imagePosition }}
        >
          <img
            src={image}
            alt={imageAlt}
            style={{ objectPosition: imagePosition }}
          />
        </div>
      </div>
    </section>
  )
}

