import { useState, useCallback } from 'react'

// Matches DEMO_CHECKINS from original + the "You" avatar
const DEMO_CHECKINS = [
  { id: '1', initial: 'M', color: '#E53E3E', lat: 34.1028, lng: -117.8988 },
  { id: '2', initial: 'J', color: '#3182CE', lat: 34.1015, lng: -117.8970 },
  { id: '3', initial: 'C', color: '#805AD5', lat: 34.1022, lng: -117.8995 },
]
const YOU = { id: 'you', initial: 'Y', color: '#22C55E', lat: 34.1018, lng: -117.8980 }

// Matches the AvatarHead component exactly — circular with ring, triangle pointer
function DemoMarker({ initial, color, isSelf, entered }: {
  initial: string; color: string; isSelf?: boolean; entered?: boolean
}) {
  return (
    <div style={{
      opacity: entered === false ? 0 : 1,
      transform: entered === false ? 'scale(0.5)' : 'scale(1)',
      transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      cursor: 'pointer',
    }}>
      {/* Avatar circle — matches AvatarHead w-11 h-11 */}
      <div style={{
        width: 44, height: 44,
        borderRadius: '50%',
        overflow: 'hidden',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: 'white',
        // Blue ring for self, green for friends, white for others — matches AvatarHead.tsx
        boxShadow: isSelf
          ? '0 0 0 2.5px #3b82f6, 0 0 12px 4px rgba(59,130,246,0.5)'
          : '0 0 0 2.5px white, 0 4px 6px -1px rgba(0,0,0,0.4)',
      }}>
        {initial}
      </div>
      {/* Triangle pointer — matches AvatarHead.tsx */}
      <div style={{
        width: 0, height: 0, margin: '0 auto',
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: `6px solid ${isSelf ? '#3b82f6' : 'white'}`,
      }} />
    </div>
  )
}

// Bell icon
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2E0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

// Warning/report icon
function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2E0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// Map placeholder (shown when no Mapbox token)
function MapPlaceholder() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f0ede6',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Street grid pattern */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d4cfc5" strokeWidth="1.5"/>
          </pattern>
          <pattern id="bigGrid" width="120" height="80" patternUnits="userSpaceOnUse">
            <rect width="120" height="80" fill="none" stroke="#c8c2b5" strokeWidth="2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <rect width="100%" height="100%" fill="url(#bigGrid)"/>
        {/* A couple road lines */}
        <line x1="0" y1="55%" x2="100%" y2="45%" stroke="#ccc6bc" strokeWidth="8"/>
        <line x1="30%" y1="0" x2="40%" y2="100%" stroke="#ccc6bc" strokeWidth="8"/>
        <line x1="70%" y1="0" x2="75%" y2="100%" stroke="#ccc6bc" strokeWidth="6"/>
      </svg>
      {/* Green circle park area */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -55%)',
        width: 140, height: 140,
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.08)',
        border: '1.5px solid rgba(34,197,94,0.4)',
      }} />
    </div>
  )
}

export default function LandingPhoneDemoInner() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [youEntered, setYouEntered] = useState(false)

  const handleCheckIn = useCallback(() => {
    setCheckedIn(true)
    setTimeout(() => setYouEntered(true), 30)
  }, [])

  const handleCheckOut = useCallback(() => {
    setCheckedIn(false)
    setYouEntered(false)
  }, [])

  const playerCount = checkedIn ? DEMO_CHECKINS.length + 1 : DEMO_CHECKINS.length

  return (
    <div
      className="phone-float"
      style={{
        width: 300,
        height: 608,
        borderRadius: 46,
        background: '#0a0a0a',
        border: '8px solid #1a1a1a',
        boxShadow: '0 50px 100px rgba(0,0,0,0.35), 0 20px 40px rgba(34,197,94,0.08), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Status bar — white bg, dark text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: 44,
        background: 'rgba(240,237,230,0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#0D1F0A' }}>9:41</span>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 72, height: 22,
          background: '#0a0a0a',
          borderRadius: 11,
        }} />
        {/* Status icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Signal */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            {[3,5,7,9].map((h, i) => (
              <rect key={i} x={i * 4.5} y={12 - h} width="3.5" height={h} rx="1" fill={i < 3 ? '#0D1F0A' : '#0D1F0A44'}/>
            ))}
          </svg>
          {/* Wifi */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#0D1F0A"/>
            <path d="M4.5 7C5.7 5.8 6.8 5 8 5s2.3.8 3.5 2" stroke="#0D1F0A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M1.5 4C3.3 2 5.5 1 8 1s4.7 1 6.5 3" stroke="#0D1F0A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
          </svg>
          {/* Battery */}
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="#0D1F0A" strokeWidth="1" fill="none"/>
            <rect x="19.5" y="4" width="2" height="4" rx="1" fill="#0D1F0A" opacity="0.4"/>
            <rect x="2" y="2" width="13" height="8" rx="1.5" fill="#D97706"/>
          </svg>
        </div>
      </div>

      {/* Map area */}
      <div style={{ position: 'absolute', top: 44, bottom: 0, left: 0, right: 0 }}>
        <MapPlaceholder />
        {/* Demo markers overlaid on placeholder */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {DEMO_CHECKINS.map((ci, i) => (
            <div key={ci.id} style={{
              position: 'absolute',
              left: `${30 + i * 18}%`,
              top: `${38 + (i % 2) * 12}%`,
              transform: 'translate(-50%, -100%)',
            }}>
              <DemoMarker initial={ci.initial} color={ci.color} entered />
            </div>
          ))}
          {checkedIn && (
            <div style={{
              position: 'absolute',
              left: '52%',
              top: '50%',
              transform: 'translate(-50%, -100%)',
            }}>
              <DemoMarker initial="Y" color="#3b82f6" isSelf entered={youEntered} />
            </div>
          )}
        </div>
      </div>

      {/* Check-in chip — matches real app: green pill with park name + × */}
      <div style={{
        position: 'absolute',
        top: 56,
        left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 20,
        opacity: checkedIn ? 1 : 0,
        transform: checkedIn ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.4s ease 0.15s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
        pointerEvents: checkedIn ? 'auto' : 'none',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#22C55E',
          borderRadius: 999,
          padding: '5px 12px 5px 10px',
          boxShadow: '0 2px 12px rgba(34,197,94,0.35)',
        }}>
          <div className="l-blink" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#0D1F0A', flexShrink: 0,
          }} />
          <span style={{ color: '#0D1F0A', fontSize: 11, fontFamily: 'Unbounded, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Hollenbeck Park
          </span>
          <button onClick={handleCheckOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 0 0 2px', lineHeight: 1,
            color: '#0D1F0A', fontSize: 13, fontWeight: 700,
            opacity: 0.6,
          }}>×</button>
        </div>
      </div>

      {/* Right-side floating map buttons — bell + warning, matches real app */}
      <div style={{
        position: 'absolute',
        top: '30%',
        right: 10,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {[<BellIcon key="bell" />, <WarningIcon key="warn" />].map((icon, i) => (
          <div key={i} style={{
            width: 36, height: 36,
            background: 'white',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer',
          }}>
            {icon}
          </div>
        ))}
      </div>

      {/* Bottom sheet — always visible, matches real app */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: 'white',
        borderRadius: '20px 20px 0 0',
        padding: '10px 16px 16px',
        zIndex: 15,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        minHeight: 160,
      }}>
        {/* Drag handle — matches real app */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: '#D8EBC4',
          margin: '0 auto 12px',
        }} />

        {/* Park name row with × close */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
          <div>
            <p style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: 15, color: '#0D1F0A', margin: 0, lineHeight: 1.2 }}>
              Hollenbeck Park
            </p>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#6B7A5E', margin: '3px 0 0', lineHeight: 1 }}>
              Covina pickleball courts
            </p>
          </div>
          <span style={{ fontSize: 16, color: '#6B7A5E', cursor: 'pointer', lineHeight: 1, marginTop: 2 }}>×</span>
        </div>

        {/* Player count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '8px 0' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: playerCount > 0 ? '#22C55E' : '#6B7A5E',
            flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: '#6B7A5E' }}>
            {playerCount} player{playerCount !== 1 ? 's' : ''} here
          </span>
        </div>

        {/* Player rows (when checked in) or empty state */}
        {checkedIn ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0',
            borderTop: '1px solid #F0F0EC',
            marginBottom: 10,
          }}>
            {/* Self avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: 'white',
              flexShrink: 0,
              boxShadow: '0 0 0 2px #3b82f6, 0 0 0 3.5px rgba(59,130,246,0.3)',
            }}>Y</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: '#0D1F0A', margin: 0 }}>You</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#6B7A5E', margin: '1px 0 0' }}>Just arrived</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7A5E" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 0 10px',
            borderTop: '1px solid #F0F0EC',
            marginBottom: 6,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7A5E" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#6B7A5E', margin: '4px 0 0', textAlign: 'center' }}>
              Be the first to check in
            </p>
          </div>
        )}

        {/* Check In / Check Out button — matches real app style (not uppercase) */}
        <button
          onClick={checkedIn ? handleCheckOut : handleCheckIn}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 12,
            border: checkedIn ? '1.5px solid rgba(13,31,10,0.12)' : 'none',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            background: checkedIn ? 'white' : '#22C55E',
            color: checkedIn ? '#0D1F0A' : '#0D1F0A',
            transition: 'all 0.25s ease',
          }}
        >
          {checkedIn ? 'Check Out' : 'Check In'}
        </button>
      </div>
    </div>
  )
}
