
interface WeatherIconProps {
  type: 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'storm'
  className?: string
  size?: number | string
}

export function WeatherIcon({ type, className = '', size = 48 }: WeatherIconProps) {
  const cloudPath = (fill = '#ffffff', stroke = '#7fa6e6') => (
    <path
      d="M18 50h28c6 0 11-5 11-11 0-5-4-10-9-11-2-7-8-11-15-11-9 0-16 7-16 15v1c-4 1-7 5-7 9 0 4 3 8 8 8Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  )

  const sunCircle = (cx = 32, cy = 32, r = 13) => (
    <circle cx={cx} cy={cy} r={r} fill="#ffc83d" />
  )

  const rainDrops = (
    <g stroke="#4a8bf0" strokeWidth="3" strokeLinecap="round">
      <path d="M22 54l-2 5" />
      <path d="M33 54l-2 5" />
      <path d="M44 54l-2 5" />
    </g>
  )

  const lightning = (
    <path
      d="M34 44l-8 12h6l-3 8 11-13h-6z"
      fill="#ffc83d"
      stroke="#e5a100"
      strokeWidth="0.8"
    />
  )

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {type === 'sunny' && (
        <g className="animate-spin-slow">
          <circle cx="32" cy="32" r="14" fill="#ffc83d" />
          {/* Sun rays */}
          <line x1="32" y1="8" x2="32" y2="13" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="51" x2="32" y2="56" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="32" x2="13" y2="32" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="51" y1="32" x2="56" y2="32" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="15" x2="19" y2="19" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="45" x2="49" y2="49" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="49" x2="19" y2="45" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="19" x2="49" y2="15" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {type === 'partly' && (
        <>
          {sunCircle(24, 22, 11)}
          {cloudPath('#ffffff')}
        </>
      )}

      {type === 'cloudy' && (
        <>
          {cloudPath('#eef4ff', '#93b5ec')}
        </>
      )}

      {type === 'rainy' && (
        <>
          {cloudPath('#dbe8fb', '#6b95d9')}
          {rainDrops}
        </>
      )}

      {type === 'storm' && (
        <>
          {cloudPath('#c5d3ea', '#5d82be')}
          {lightning}
        </>
      )}
    </svg>
  )
}
