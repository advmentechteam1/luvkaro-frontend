import { useRef, useState } from 'react';

export default function ProfileCard({ profile, isLiked, onLike, onPass = onLike, isSaving = false, onSwipe }) {
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef(null);
  const startDrag = (event) => { if (!isSaving && onSwipe) { dragStart.current = event.clientX; event.currentTarget.setPointerCapture?.(event.pointerId); } };
  const moveDrag = (event) => { if (dragStart.current !== null) setDragX(event.clientX - dragStart.current); };
  const endDrag = () => { if (dragStart.current === null) return; const offset = dragX; dragStart.current = null; setDragX(0); if (Math.abs(offset) >= 90) onSwipe(offset > 0 ? 'like' : 'pass'); };
  return (
    <article className="profile-card swipeable-card" style={{ transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)` }} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="profile-photo">
        <img src={profile.image} alt={profile.name} />
        <span className="online-dot">● Online</span>
        <button className="photo-heart" onClick={onLike} disabled={isSaving} aria-label={`Like ${profile.name}`}>♡</button>
      </div>
      <div className="profile-info">
        <h3>{profile.name}, {profile.age} <span>●</span></h3>
        <p>⌖ {profile.city}</p>
        <div className="tags">{profile.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
        <div className="card-actions">
          <button onClick={onPass} disabled={isSaving} aria-label="Pass">×</button>
          <button className={isLiked ? 'liked' : ''} onClick={onLike} disabled={isSaving} aria-label="Like">♥</button>
        </div>
      </div>
    </article>
  );
}
