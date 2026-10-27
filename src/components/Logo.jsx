export default function Logo({ size = 'default', light = false }) {
  return (
    <div className={`brand-logo brand-logo-${size} ${light ? 'brand-logo-light' : ''}`}>
      <svg
        className="brand-logo-icon"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="luvkaro-gradient" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff5e94" />
            <stop offset="0.55" stopColor="#f23878" />
            <stop offset="1" stopColor="#e02967" />
          </linearGradient>
          <linearGradient id="luvkaro-spark" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffd875" />
            <stop offset="1" stopColor="#ff9f43" />
          </linearGradient>
          <filter id="luvkaro-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#f23878" floodOpacity="0.32" />
          </filter>
        </defs>
        {/* Rounded Heart Icon Badge */}
        <rect width="36" height="36" rx="10" fill="url(#luvkaro-gradient)" filter="url(#luvkaro-shadow)" />
        {/* Outer Crisp Heart */}
        <path
          d="M18 28.2C17.3 27.5 9.5 20.6 9.5 14.8C9.5 11.2 12.3 8.5 15.8 8.5C17.9 8.5 19.4 9.5 20.2 11C21 9.5 22.5 8.5 24.6 8.5C28.1 8.5 30.9 11.2 30.9 14.8C30.9 20.6 23.1 27.5 22.4 28.2L20.2 30.4L18 28.2Z"
          fill="#ffffff"
        />
        {/* Inner Heart Layer */}
        <path
          d="M20.2 25.5C19.7 24.9 13.8 19.6 13.8 15.2C13.8 12.6 15.8 10.7 18.2 10.7C19.6 10.7 20.7 11.4 21.3 12.4C21.9 11.4 23 10.7 24.4 10.7C26.8 10.7 28.8 12.6 28.8 15.2C28.8 19.6 22.9 24.9 22.4 25.5L21.3 26.6L20.2 25.5Z"
          fill="#ffebf2"
        />
        {/* Sparkle Accent */}
        <path
          d="M26.5 5.5L27.4 7.6L29.5 8.5L27.4 9.4L26.5 11.5L25.6 9.4L23.5 8.5L25.6 7.6L26.5 5.5Z"
          fill="url(#luvkaro-spark)"
        />
      </svg>
      <span className="brand-logo-text">
        <span className="brand-name-main">Luv</span>
        <span className="brand-name-accent">karo</span>
        <span className="brand-dot">♥</span>
      </span>
    </div>
  )
}
