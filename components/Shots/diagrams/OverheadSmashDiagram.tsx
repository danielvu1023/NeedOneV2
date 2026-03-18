export default function OverheadSmashDiagram() {
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
      {/* Top-right: correct zone (teal) */}
      <rect x={cx} y="20" width="100" height={cy - 20} fill="rgb(20,184,166)" opacity="0.06" />
      {/* Top-left: open face (amber) */}
      <rect x="15" y="20" width={cx - 15} height={cy - 20} fill="rgb(245,158,11)" opacity="0.06" />
      {/* Bottom: too closed (red) */}
      <rect x="15" y={cy} width="200" height="110" fill="rgb(239,68,68)" opacity="0.04" />

      {/* Quadrant labels */}
      <text x="45" y="36" fontSize="8" fill="rgb(245,158,11)" opacity="0.7">open face</text>
      <text x={cx + 10} y="36" fontSize="8" fill="rgb(20,184,166)" opacity="0.7">correct zone</text>

      {/* ── Origin dot ── */}
      <circle cx={cx} cy={cy} r="3" fill="rgb(245,158,11)" />

      {/* ── OPEN FACE (yellow) — tilted back, top goes left ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(245,158,11)" opacity="0.5"
        transform={`rotate(-15, ${cx}, ${cy})`}
      />
      <text x="20" y={cy - 30} fontSize="9" fill="rgb(245,158,11)" fontWeight="600">open face</text>
      <text x="20" y={cy - 19} fontSize="7" fill="rgb(245,158,11)" opacity="0.8">{`tilts back \u2192 goes long`}</text>

      {/* ── CORRECT (green) — 20° forward tilt ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(20,184,166)" opacity="0.9"
        transform={`rotate(20, ${cx}, ${cy})`}
      />
      <text x={cx + 30} y={cy - 30} fontSize="9" fill="rgb(20,184,166)" fontWeight="600">correct</text>
      <text x={cx + 30} y={cy - 19} fontSize="8" fill="rgb(20,184,166)">slight forward tilt</text>

      {/* Angle arc + label */}
      <path d={`M ${cx},${cy - 38} A 38,38 0 0,1 ${cx + 13},${cy - 36}`} fill="none" stroke="rgb(245,158,11)" strokeWidth="1.5" />
      <text x={cx + 3} y={cy - 22} fontSize="10" fill="rgb(245,158,11)" fontWeight="600">20°</text>

      {/* ── TOO CLOSED (red) — ~55° forward, face points at ground ── */}
      <rect
        x={cx - 6} y={cy - 26} width="12" height="52" rx="3"
        fill="rgb(239,68,68)" opacity="0.5"
        transform={`rotate(55, ${cx}, ${cy})`}
      />
      <text x={cx + 20} y={cy + 25} fontSize="9" fill="rgb(239,68,68)" fontWeight="600">too closed</text>
      <text x={cx + 20} y={cy + 36} fontSize="7" fill="rgb(239,68,68)" opacity="0.8">{`face points down \u2192 net`}</text>
      <text x="30" y={cy + 50} fontSize="8" fill="rgb(239,68,68)" opacity="0.6">too closed</text>

      {/* ── Right side: Body height reference ── */}
      <g transform="translate(330,50)">
        {/* Ball — above head */}
        <circle cx="12" cy="-5" r="9" fill="rgb(245,158,11)" />
        <text x="-2" y="-22" fontSize="11" fill="rgb(245,158,11)" fontWeight="600">ball</text>

        {/* "above head" label */}
        <text x="30" y="20" fontSize="9" fill="rgb(156,163,175)">above head</text>

        {/* Body silhouette — lowered */}
        <circle cx="0" cy="50" r="15" fill="rgb(156,163,175)" opacity="0.3" />
        <rect x="-11" y="67" width="22" height="55" rx="5" fill="rgb(156,163,175)" opacity="0.3" />
        <line x1="-8" y1="122" x2="-14" y2="165" stroke="rgb(156,163,175)" strokeWidth="4" opacity="0.3" strokeLinecap="round" />
        <line x1="8" y1="122" x2="14" y2="165" stroke="rgb(156,163,175)" strokeWidth="4" opacity="0.3" strokeLinecap="round" />

        {/* "head" label */}
        <text x="22" y="55" fontSize="9" fill="rgb(156,163,175)">head</text>
      </g>
    </svg>
  )
}
