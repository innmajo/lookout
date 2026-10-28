function Ring({
  cx,
  cy,
  r,
  strokeWidth = 2,
  opacity = 0.35,
}: {
  cx: number
  cy: number
  r: number
  strokeWidth?: number
  opacity?: number
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  )
}

function Dot({ cx, cy, r, opacity = 0.4 }: { cx: number; cy: number; r: number; opacity?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" opacity={opacity} />
}

export function ThemeContentFigures() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-primary transition-colors duration-500"
      aria-hidden
    >
      <svg className="absolute left-[14rem] top-2 h-40 w-40 sm:left-[18rem]" viewBox="0 0 160 160" fill="none">
        <circle cx="92" cy="58" r="36" stroke="currentColor" strokeWidth="9" opacity="0.28" />
        <circle cx="92" cy="58" r="22" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
        <circle cx="92" cy="58" r="8" fill="currentColor" opacity="0.22" />
        <circle cx="28" cy="24" r="10" stroke="currentColor" strokeWidth="4" opacity="0.4" />
        <circle cx="140" cy="20" r="4" fill="currentColor" opacity="0.45" />
      </svg>
      <svg className="absolute -right-6 top-0 h-64 w-64" viewBox="0 0 256 256" fill="none">
        <circle cx="196" cy="64" r="52" stroke="currentColor" strokeWidth="11" opacity="0.24" />
        <circle cx="196" cy="64" r="32" stroke="currentColor" strokeWidth="3" opacity="0.48" />
        <circle cx="196" cy="64" r="12" stroke="currentColor" strokeWidth="6" opacity="0.32" />
        <circle cx="40" cy="36" r="12" stroke="currentColor" strokeWidth="4" opacity="0.38" />
        <circle cx="72" cy="120" r="5" fill="currentColor" opacity="0.4" />
      </svg>
      <svg className="absolute right-10 top-[42%] h-44 w-44" viewBox="0 0 176 176" fill="none">
        <circle
          cx="88"
          cy="88"
          r="62"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 7"
          opacity="0.38"
        />
        <circle cx="88" cy="88" r="18" stroke="currentColor" strokeWidth="6" opacity="0.28" />
        <circle cx="88" cy="88" r="6" fill="currentColor" opacity="0.35" />
      </svg>
      <svg className="absolute bottom-16 left-2 h-52 w-52" viewBox="0 0 208 208" fill="none">
        <circle cx="52" cy="156" r="44" stroke="currentColor" strokeWidth="8" opacity="0.24" />
        <circle cx="52" cy="156" r="22" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
        <circle cx="148" cy="48" r="20" stroke="currentColor" strokeWidth="5" opacity="0.36" />
        <circle cx="176" cy="112" r="5" fill="currentColor" opacity="0.4" />
        <circle cx="120" cy="176" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  )
}

export function ThemeBubbles() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden text-primary transition-colors duration-500"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <g>
          <Ring cx={1380} cy={120} r={92} strokeWidth={14} opacity={0.2} />
          <Ring cx={1380} cy={120} r={58} strokeWidth={3} opacity={0.42} />
          <Dot cx={1380} cy={120} r={9} opacity={0.4} />

          <Ring cx={70} cy={220} r={46} strokeWidth={8} opacity={0.28} />
          <Ring cx={70} cy={220} r={20} strokeWidth={2} opacity={0.4} />

          <Ring cx={980} cy={36} r={20} strokeWidth={6} opacity={0.38} />
          <Dot cx={1040} cy={70} r={5} opacity={0.4} />
          <Dot cx={920} cy={58} r={3} opacity={0.3} />

          <Ring cx={1400} cy={520} r={64} strokeWidth={3} opacity={0.32} />
          <Dot cx={1400} cy={520} r={12} opacity={0.2} />

          <Ring cx={1280} cy={780} r={100} strokeWidth={13} opacity={0.16} />
          <Ring cx={1280} cy={780} r={52} strokeWidth={2} opacity={0.36} />
          <Dot cx={1188} cy={700} r={8} opacity={0.32} />

          <Ring cx={430} cy={860} r={40} strokeWidth={5} opacity={0.26} />
          <Dot cx={490} cy={830} r={5} opacity={0.35} />

          <circle
            cx={250}
            cy={640}
            r={36}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="3 6"
            opacity="0.28"
          />
        </g>

        <path
          d="M0 790 C 200 740, 360 840, 560 808 C 800 770, 980 860, 1440 800 L 1440 900 L 0 900 Z"
          fill="currentColor"
          opacity="0.08"
        />
      </svg>
    </div>
  )
}
