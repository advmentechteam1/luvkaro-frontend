export default function ProfileCard({ profile, isLiked, onLike }) {
  return <article className="profile-card">
    <div className="profile-photo"><img src={profile.image} alt={profile.name}/><span className="online-dot">● Online</span><button className="photo-heart" onClick={onLike} aria-label={`Like ${profile.name}`}>♡</button></div>
    <div className="profile-info"><h3>{profile.name}, {profile.age} <span>●</span></h3><p>⌖ {profile.city}</p><div className="tags">{profile.tags.map((tag) => <small key={tag}>{tag}</small>)}</div><div className="card-actions"><button onClick={onLike} aria-label="Skip">×</button><button className={isLiked ? 'liked' : ''} onClick={onLike} aria-label="Like">♥</button></div></div>
  </article>
}
