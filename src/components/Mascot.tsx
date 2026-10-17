
interface MascotProps {
  className?: string
  width?: number | string
  height?: number | string
  animated?: boolean
}

export function MascotSvg({
  className = '',
  width = 64,
  height = 54,
  animated = false,
}: MascotProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      width={width}
      height={height}
      className={`${animated ? 'animate-float' : ''} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Cloud body */}
      <path
        d="M26 86h68c13 0 22-9 22-21 0-10-7-18-17-20 0-15-12-27-28-27-10 0-18 5-23 12-4-3-8-4-13-4-12 0-21 9-21 20 0 1 0 2 .2 3C8 51 2 57 2 66c0 11 10 20 24 20Z"
        fill="#ffffff"
        stroke="#bcd5f7"
        strokeWidth="3.5"
      />
      {/* Rosy blush cheeks */}
      <ellipse cx="42" cy="62" rx="7" ry="4.5" fill="#ffb3c7" opacity="0.9" />
      <ellipse cx="82" cy="62" rx="7" ry="4.5" fill="#ffb3c7" opacity="0.9" />
      {/* Cheerful blue eyes */}
      <circle cx="46" cy="53" r="4.2" fill="#234685" />
      <circle cx="78" cy="53" r="4.2" fill="#234685" />
      {/* Eye glints */}
      <circle cx="47.5" cy="51.5" r="1.3" fill="#ffffff" />
      <circle cx="79.5" cy="51.5" r="1.3" fill="#ffffff" />
      {/* Sweet smile */}
      <path
        d="M55 62q7 7 14 0"
        fill="none"
        stroke="#234685"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
