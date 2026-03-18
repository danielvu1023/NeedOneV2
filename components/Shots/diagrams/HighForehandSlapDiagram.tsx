export default function HighForehandSlapDiagram() {
  // Contact point / pivot for all paddles
  const cx = 115
  const cy = 130

  return (
    <svg viewBox="0 0 420 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      {/* ── Axes ── */}
      <line x1={cx} y1="20" x2={cx} y2="240" stroke="rgb(156,163,175)" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="15" y1={cy} x2="215" y2={cy} stroke="rgb(156,163,175)" strokeWidth="1" strokeDasharray="4 3" />

      {/* Axis labels */}
      <text x={cx} y="14" fontSize="8" fill="rgb(156,163,175)" textAnchor="middle">vertical (neutral)</text>
      <text x="18" y={cy + 14} fontSize="8" fill="rgb(156,163,175)">back</text>
      <text x="185" y={cy + 14} fontSize="8" fill="rgb(156,163,175)">forward</text>

      {/* ── Quadrant tints ── */}
      <rect x={cx} y="20" width="100" height={cy - 20} fill="rgb(20,184,166)" opacity="0.06" />
      <rect x="15" y="20" width={cx - 15} height={cy - 20} fill="rgb(245,158,11)" opacity="0.06" />
      <rect x="15" y={cy} width="200" height="110" fill="rgb(239,68,68)" opacity="0.04" />

      {/* Quadrant labels */}
      <text x="45" y="36" fontSize="8" fill="rgb(245,158,11)" opacity="0.7">open face</text>
      <text x={cx + 10} y="36" fontSize="8" fill="rgb(20,184,166)" opacity="0.7">correct zone</text>

      {/* ── Origin dot ── */}
      <circle cx={cx} cy={cy} r="3" fill="rgb(245,158,11)" />

      {/* ── GHOST: Overhead smash reference at 20° ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(156,163,175)" opacity="0.15"
        stroke="rgb(156,163,175)" strokeWidth="1" strokeDasharray="3 2"
        transform={`rotate(20, ${cx}, ${cy})`}
      />
      <text x={cx + 38} y={cy - 48} fontSize="7" fill="rgb(156,163,175)" opacity="0.5">overhead ref</text>

      {/* ── OPEN FACE (yellow) — tilted back ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(245,158,11)" opacity="0.5"
        transform={`rotate(-12, ${cx}, ${cy})`}
      />
      <text x="20" y={cy - 30} fontSize="9" fill="rgb(245,158,11)" fontWeight="600">open face</text>
      <text x="20" y={cy - 19} fontSize="7" fill="rgb(245,158,11)" opacity="0.8">{`tilts back \u2192 goes long`}</text>

      {/* ── CORRECT (green) — 8° forward tilt, nearly vertical ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(20,184,166)" opacity="0.9"
        transform={`rotate(8, ${cx}, ${cy})`}
      />
      <text x={cx + 24} y={cy - 30} fontSize="9" fill="rgb(20,184,166)" fontWeight="600">correct</text>
      <text x={cx + 24} y={cy - 19} fontSize="8" fill="rgb(20,184,166)">nearly vertical</text>

      {/* Angle arc + label */}
      <path d={`M ${cx},${cy - 38} A 38,38 0 0,1 ${cx + 5},${cy - 37.5}`} fill="none" stroke="rgb(245,158,11)" strokeWidth="1.5" />
      <text x={cx + 3} y={cy - 22} fontSize="10" fill="rgb(245,158,11)" fontWeight="600">8°</text>

      {/* ── TOO CLOSED (red) — ~45° forward ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(239,68,68)" opacity="0.5"
        transform={`rotate(45, ${cx}, ${cy})`}
      />
      <text x={cx + 20} y={cy + 25} fontSize="9" fill="rgb(239,68,68)" fontWeight="600">too closed</text>
      <text x={cx + 20} y={cy + 36} fontSize="7" fill="rgb(239,68,68)" opacity="0.8">{`face points down \u2192 net`}</text>

      {/* ── Right side: Body height reference ── */}
      <g transform="translate(330,40)">
        {/* Ball — at head/shoulder height */}
        <circle cx="20" cy="30" r="8" fill="rgb(245,158,11)" />
        <text x="32" y="34" fontSize="10" fill="rgb(245,158,11)" fontWeight="600">ball</text>

        {/* Body silhouette */}
        <circle cx="0" cy="55" r="15" fill="rgb(156,163,175)" opacity="0.3" />
        <rect x="-11" y="72" width="22" height="55" rx="5" fill="rgb(156,163,175)" opacity="0.3" />
        <line x1="-8" y1="127" x2="-14" y2="170" stroke="rgb(156,163,175)" strokeWidth="4" opacity="0.3" strokeLinecap="round" />
        <line x1="8" y1="127" x2="14" y2="170" stroke="rgb(156,163,175)" strokeWidth="4" opacity="0.3" strokeLinecap="round" />

        {/* "head" label */}
        <text x="22" y="50" fontSize="9" fill="rgb(156,163,175)">head</text>
        {/* "shoulder" label */}
        <text x="22" y="72" fontSize="9" fill="rgb(156,163,175)">shoulder</text>
      </g>
    </svg>
  )
}
