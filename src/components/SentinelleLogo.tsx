interface LogoProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Logo SENTINELLE — "Œil radar national" (proposition B adoptée).
 * Anneau tricolore (vert / rouge / or) + disque radar + étoile du drapeau.
 */
export function SentinelleLogo({ size = 40, className, style }: LogoProps) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      className={className}
      style={{
        display: 'block',
        width: dim,
        height: dim,
        lineHeight: 0,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="slbDisc" cx="0.5" cy="0.42" r="0.72">
            <stop offset="0" stopColor="#0fa052" />
            <stop offset="1" stopColor="#053b18" />
          </radialGradient>
        </defs>
        <g transform="rotate(-90 32 32)" fill="none" strokeWidth="5">
          <circle
            cx="32"
            cy="32"
            r="27"
            stroke="#0a7d3c"
            strokeDasharray="56.55 113.1"
          />
          <circle
            cx="32"
            cy="32"
            r="27"
            stroke="#ce1126"
            strokeDasharray="56.55 113.1"
            strokeDashoffset="-56.55"
          />
          <circle
            cx="32"
            cy="32"
            r="27"
            stroke="#fcd116"
            strokeDasharray="56.55 113.1"
            strokeDashoffset="-113.1"
          />
        </g>
        <circle cx="32" cy="32" r="22" fill="url(#slbDisc)" />
        <circle
          cx="32"
          cy="32"
          r="15"
          fill="none"
          stroke="#fcd116"
          strokeOpacity=".3"
          strokeWidth="1.3"
        />
        <circle
          cx="32"
          cy="32"
          r="9"
          fill="none"
          stroke="#fcd116"
          strokeOpacity=".45"
          strokeWidth="1.3"
        />
        <path
          d="M32 32 L32 17 A15 15 0 0 1 44.99 24.5 Z"
          fill="#fcd116"
          fillOpacity=".15"
        />
        <path
          d="M32 25 L33.65 29.74 L38.66 29.84 L34.66 32.87 L36.11 37.66 L32 34.8 L27.89 37.66 L29.34 32.87 L25.34 29.84 L30.35 29.74 Z"
          fill="#fcd116"
        />
        <circle cx="46" cy="22" r="2.4" fill="#ce1126" stroke="#fff" strokeWidth=".7" />
      </svg>
    </span>
  );
}
