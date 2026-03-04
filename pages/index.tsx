import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { QRCodeSVG } from 'qrcode.react'
import InitialsAvatar from '@/components/InitialsAvatar'
import { useAuth } from '@/hooks/useAuth'

const LandingPhoneDemo = dynamic(() => import('@/components/LandingPhoneDemo'), { ssr: false })

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 5l2 2 4-4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const NeedOneLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size * (72 / 82)} viewBox="0 0 82 72" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g fill="#0f1e0c">
      <path d="M66.8 36.2 C 66.8 50.3 55.4 61.7 41.3 61.7 27.3 61.7 15.9 50.3 15.9 36.2 15.9 22.2 27.3 10.8 41.3 10.8 55.4 10.8 66.8 22.2 66.8 36.2 Z M32.2 60.5  M59.2 36.1 C 59.2 26 51.1 17.9 41 17.9 31 17.9 22.8 26 22.8 36.1 22.8 46.1 31 54.3 41 54.3 51.1 54.3 59.2 46.1 59.2 36.1 Z M49.7 51.9 " />
    </g>
    <g fill="#98c52c">
      <path d="M63.1 36 C 63.1 48.2 53.2 58.1 41 58.1 28.8 58.1 18.9 48.2 18.9 36 18.9 23.8 28.8 14 41 14 53.2 14 63.1 23.8 63.1 36 Z M33.2 56.9  m 9.4 -20 c 1 -1.7 -1.3 -3.6 -2.7 -2.2 -1.2 1.2 -0.4 3.3 1.1 3.3 0.5 0 1.2 -0.5 1.6 -1.1 z " />
    </g>
    <g fill="#ccfe48">
      <path d="M62.1 36 C 62.1 47.7 52.7 57.2 41 57.2 29.3 57.2 19.9 47.7 19.9 36 19.9 24.4 29.3 14.9 41 14.9 52.7 14.9 62.1 24.4 62.1 36 Z M32.4 55.6  M56.9 36.1 C 56.9 27.3 49.8 20.2 41 20.2 32.2 20.2 25.1 27.3 25.1 36.1 25.1 44.9 32.2 52 41 52 49.8 52 56.9 44.9 56.9 36.1 Z M47.9 50.5 " />
      <path d="M54.7 36 C 54.7 43.6 48.5 49.7 40.9 49.7 33.3 49.7 27.2 43.6 27.2 36 27.2 28.4 33.3 22.2 40.9 22.2 48.5 22.2 54.7 28.4 54.7 36 Z M34.2 48  M48.9 36 C 48.9 31.7 45.4 28.1 41 28.1 36.7 28.1 33.1 31.7 33.1 36 33.1 40.4 36.7 43.9 41 43.9 45.4 43.9 48.9 40.4 48.9 36 Z M46.5 41.5 " />
      <path d="M 37 40 c -1.1 -1.1 -2 -2.9 -2 -4 0 -2.6 3.4 -6 6 -6 2.6 0 6 3.4 6 6 0 1.1 -0.9 2.9 -2 4 -1.1 1.1 -2.9 2 -4 2 -1.1 0 -2.9 -0.9 -4 -2 z" />
    </g>
  </svg>
)

const VIDEOS = [
  {
    num: '01',
    title: 'Check in',
    desc: 'One tap to check in at your park. Your head appears on the map and your crew gets notified.',
    src: '/needone-checkin.mp4',
    fallback: '/NeedOneCheckIn.mov',
  },
  {
    num: '02',
    title: 'Friends',
    desc: 'Find and add friends from the parks you play at. Build your court network.',
    src: '/needone-friends.mp4',
    fallback: '/NeedOneFriends.mov',
  },
  {
    num: '03',
    title: 'Notifications',
    desc: 'Get notified the moment a friend checks in. Never miss a game again.',
    src: '/needone-notifications.mp4',
    fallback: '/NeedOneNotifications.mov',
  },
]

export default function Landing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [activeVideo, setActiveVideo] = useState(0)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMsg, setContactMsg] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session) {
      router.replace('/map')
    }
  }, [loading, session])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMsg }),
    })
    if (res.ok) setContactSent(true)
  }

  return (
    <>
      <Head>
        <title>NeedOne — Find Your Game</title>
        <meta name="description" content="NeedOne shows you who's on the court in real time. Check in, see your friends on the map, fill the fourth spot." />
      </Head>

      <div className="noise-overlay" />

      <div className="landing">

        {/* ── NAVIGATION ── */}
        <nav className="nav-blur landing-nav fixed top-0 left-0 right-0 z-50 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <NeedOneLogo size={44} />
              <span className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>NeedOne</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>How it works</a>
              <a href="#community"    className="text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>Features</a>
              <a href="#get-app"      className="text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>Install PWA</a>
              <a href="#contact"      className="text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>Contact</a>
            </div>
            <a href="/auth">
              <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Sign in</button>
            </a>
          </div>
        </nav>


        {/* ── HERO ── */}
        <section className="map-bg relative min-h-screen flex items-center overflow-hidden pt-16">
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, var(--bg) 100%)' }} />

          <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full py-20 flex flex-col md:grid md:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

            {/* Hero Copy */}
            <div>
              <div className="l-reveal l-reveal-1 mb-5">
                <span className="tag-live">
                  <span className="l-blink w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                  Now in Beta
                </span>
              </div>

              <h1 className="font-display l-reveal l-reveal-2"
                style={{ fontSize: 'clamp(52px,8vw,90px)', lineHeight: 1.05, letterSpacing: '-1px' }}>
                Find your<br />
                <span style={{ color: 'var(--accent)' }}>fourth.</span>
              </h1>

              <p className="l-reveal l-reveal-3 mt-6 text-base leading-relaxed max-w-md" style={{ color: 'var(--muted-light)' }}>
                NeedOne shows you who&apos;s on the court — in real time. Check in, see your friends on the map, fill the fourth spot.
              </p>

              <div className="l-reveal l-reveal-4 flex flex-wrap gap-3 mt-8">
                <button className="btn-primary" onClick={() => document.getElementById('get-app')?.scrollIntoView({ behavior: 'smooth' })}>
                  Get the App
                </button>
                <button className="btn-secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  How it works
                </button>
              </div>

            </div>

            {/* Phone Demo */}
            <div className="relative flex flex-col justify-center items-center" style={{ height: '600px' }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34,197,94,0.12) 0%, transparent 70%)'
              }} />
              <LandingPhoneDemo />
              {/* Interaction hint */}
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="l-blink w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-display font-bold tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
                  Interactive — tap the phone
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
            style={{ background: 'linear-gradient(transparent,var(--bg))' }} />
        </section>


        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-16 md:py-24 max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="text-center mb-12 scroll-reveal">
            <p className="section-label mb-3" style={{ color: 'var(--accent)' }}>The Loop</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(40px,6vw,72px)', lineHeight: 1.05 }}>
              Three taps to<br /><span style={{ color: 'var(--accent)' }}>a full court.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                delay: '0.05s', num: '01', step: 'Step 01', title: 'Check in',
                desc: "Tap to check in at your park. Your profile head appears on the map instantly — and a push notification fires to every friend in your network.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                preview: (
                  <div className="p-4 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(13,31,10,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display font-bold" style={{ fontSize: 15, color: 'var(--text)' }}>Hollenbeck Park</span>
                      <span className="count-badge">7</span>
                    </div>
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: '#22C55E', color: 'white', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>
                      Check In
                    </button>
                  </div>
                ),
              },
              {
                delay: '0.15s', num: '02', step: 'Step 02', title: 'See your crew',
                desc: 'Open the map and see exactly who\'s playing, where. Your friends\' heads are pinned to real parks — no guessing, no DM chains.',
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                preview: (
                  <div className="px-4 py-3 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(13,31,10,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-end gap-3 flex-wrap">
                      {[
                        { name: 'Marcus Reid', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                        { name: 'Jordan Kim', id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
                        { name: 'Casey Park', id: 'c3d4e5f6-a7b8-9012-cdef-123456789012' },
                        { name: 'Alex Torres', id: 'd4e5f6a7-b8c9-0123-defa-234567890123' },
                      ].map(({ name, id }) => (
                        <div key={id} className="flex flex-col items-center">
                          <div style={{ boxShadow: '0 0 0 2.5px #22c55e, 0 0 12px 4px rgba(34,197,94,0.3)', borderRadius: '50%' }}>
                            <InitialsAvatar name={name} userId={id} size={36} />
                          </div>
                          <div className="w-0 h-0 mx-auto mt-0.5" style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '5px solid #22c55e',
                          }} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2.5" style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif' }}>4 friends at Hollenbeck</p>
                  </div>
                ),
              },
              {
                delay: '0.25s', num: '03', step: 'Step 03', title: 'Go play',
                desc: "Show up knowing exactly what to expect. You're never that person arriving at an empty court again. Games are happening, your people are there.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
                preview: (
                  <div className="p-4 rounded-2xl flex items-center" style={{ background: 'white', border: '1px solid rgba(13,31,10,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#22C55E' }}>
                      <div className="park-dot l-blink" style={{ flexShrink: 0, background: 'white', boxShadow: 'none' }} />
                      <span className="text-sm font-medium" style={{ color: 'white', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Hollenbeck Park</span>
                      <span className="ml-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>×</span>
                    </div>
                  </div>
                ),
              },
            ].map(({ delay, num, step, title, desc, icon, preview }) => (
              <div key={num} className="scroll-reveal" style={{ transitionDelay: delay }}>
                <div className="card-glass p-7 h-full relative overflow-hidden">
                  <div className="font-display absolute -top-4 -right-2 select-none pointer-events-none"
                    style={{ fontSize: '160px', lineHeight: 1, color: 'var(--accent)', opacity: 0.04 }}>{num}</div>
                  <div className="relative">
                    <div className="feature-icon mb-5">{icon}</div>
                    <span className="block mb-2 section-label" style={{ color: 'var(--accent)' }}>{step}</span>
                    <h3 className="font-display text-4xl mb-3">{title}</h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--muted-light)' }}>{desc}</p>
                    {preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ── SEE IT IN ACTION (videos) ── */}
        <section id="community" className="py-16 md:py-24" style={{ background: '#FAFCF6' }}>
          <div className="max-w-[1440px] mx-auto px-6 md:px-12">
            <div className="mb-12 scroll-reveal">
              <p className="section-label mb-3" style={{ color: 'var(--accent)' }}>See it in action</p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <h2 className="font-display" style={{ fontSize: 'clamp(40px,6vw,72px)', lineHeight: 1.05 }}>
                  Watch how<br /><span style={{ color: 'var(--accent)' }}>it works.</span>
                </h2>
              </div>
            </div>

            {/* Row 1: Check in — video left, text right */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 scroll-reveal">
              <div className="flex justify-center order-2 md:order-1">
                <video autoPlay muted loop playsInline
                  className="block w-full max-w-[260px] md:max-w-[320px]">
                  <source src="/needone-checkin.mp4" type="video/mp4" />
                  <source src="/NeedOneCheckIn.mov" type="video/quicktime" />
                </video>
              </div>
              <div className="order-1 md:order-2">
                <span className="tag-live mb-4 inline-flex"><span className="l-blink w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />Live feature</span>
                <h3 className="font-display mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1 }}>Check in<br />instantly</h3>
                <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                  One tap puts your profile head on the map at your park. Every friend in your network gets a push notification the moment you arrive — before you even pick up a paddle.
                </p>
                <ul className="space-y-3">
                  {['Tap once — your avatar appears on the map in real time','Push notification fires to your entire friend network','Check-in lasts 2 hours, then auto-expires'].map(t => (
                    <li key={t} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}><CheckIcon /></div>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 2: Friends — text left, video right */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 scroll-reveal">
              <div>
                <span className="tag-live mb-4 inline-flex"><span className="l-blink w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />Live feature</span>
                <h3 className="font-display mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1 }}>See your<br />crew on the map</h3>
                <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                  Open the map and know exactly who's there. Friend profile heads are pinned to real parks with a green ring — no guessing, no DM chains, no "are you at Hollenbeck?" texts.
                </p>
                <ul className="space-y-3">
                  {['Green ring on friend heads so you always know your crew','Tap any head to view their profile or send a friend request','Discover regulars at your parks and build your network'].map(t => (
                    <li key={t} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}><CheckIcon /></div>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <video autoPlay muted loop playsInline
                  className="block w-full max-w-[260px] md:max-w-[320px]">
                  <source src="/needone-friends.mp4" type="video/mp4" />
                  <source src="/NeedOneFriends.mov" type="video/quicktime" />
                </video>
              </div>
            </div>

            {/* Row 3: Notifications — video left, text right */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center scroll-reveal">
              <div className="flex justify-center order-2 md:order-1">
                <video autoPlay muted loop playsInline
                  className="block w-full max-w-[260px] md:max-w-[320px]">
                  <source src="/needone-notifications.mp4" type="video/mp4" />
                  <source src="/NeedOneNotifications.mov" type="video/quicktime" />
                </video>
              </div>
              <div className="order-1 md:order-2">
                <span className="tag-live mb-4 inline-flex"><span className="l-blink w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />Live feature</span>
                <h3 className="font-display mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1 }}>Never miss<br />a game</h3>
                <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                  The moment a friend checks in, your phone buzzes. Not a DM — a native push straight to your lock screen. You'll know who's there before they even walk through the gate.
                </p>
                <ul className="space-y-3">
                  {['Native push notifications — works on Android and iPhone','Tap the notification to open the map instantly','See the full activity feed: who played, where, and when'].map(t => (
                    <li key={t} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}><CheckIcon /></div>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </section>


        {/* ── GET THE APP / QR ── */}
        <section id="get-app" className="py-16 md:py-24 max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="text-center mb-14 scroll-reveal">
            <p className="section-label mb-3" style={{ color: 'var(--accent)' }}>Get the App</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(40px,6vw,72px)', lineHeight: 1.05 }}>
              Scan to install.<br /><span style={{ color: 'var(--accent)' }}>It&apos;s that easy.</span>
            </h2>
            <p className="mt-4 text-base max-w-sm mx-auto" style={{ color: 'var(--muted-light)' }}>
              NeedOne is a PWA — no App Store needed. Scan with your phone camera and add it to your home screen in seconds.
            </p>
          </div>

          {/* QR + button centered */}
          <div className="flex flex-col items-center mb-16 scroll-reveal">
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: '-24px', borderRadius: '52px',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div className="p-6 rounded-3xl relative" style={{
                background: 'var(--card)',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 0 0 1px var(--border), 0 24px 64px rgba(34,197,94,0.08)',
              }}>
                {typeof window !== 'undefined' && (
                  <QRCodeSVG
                    value={`${window.location.origin}${session ? '/map' : '/auth'}`}
                    size={200}
                    bgColor="transparent"
                    fgColor="#0f1e0c"
                    style={{ borderRadius: '12px', display: 'block' }}
                  />
                )}
                <p className="text-center mt-4" style={{
                  fontSize: '11px', color: 'var(--muted)',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '0.05em',
                }}>{typeof window !== 'undefined' ? `${window.location.host}${session ? '/map' : '/auth'}` : ''}</p>
              </div>
            </div>
            <a
              href={session ? '/map' : '/auth'}
              className="btn-secondary inline-flex items-center gap-1.5 mt-8"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {session ? 'Open app' : 'Sign in'}
            </a>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 scroll-reveal max-w-4xl mx-auto" style={{ transitionDelay: '0.1s' }}>
            {[
              { step: '1', title: 'Open your camera', desc: 'On iPhone or Android — no QR scanner app needed.' },
              { step: '2', title: 'Scan the QR code', desc: 'Tap the banner that appears at the top of your screen.' },
              { step: '3', title: 'Add to home screen', desc: 'iPhone: share icon → Add to Home Screen. Android: install prompt.' },
              { step: '4', title: 'Open NeedOne', desc: 'Find it on your home screen and check in at the park.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="p-5 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm mb-3"
                  style={{ background: 'var(--accent)', color: '#07090F' }}>{step}</div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-light)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ── CONTACT ── */}
        <section id="contact" className="py-16 md:py-24 max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="text-center mb-12 scroll-reveal">
            <p className="section-label mb-3" style={{ color: 'var(--accent)' }}>Contact</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1.05 }}>
              Get in touch.
            </h2>
            <p className="mt-4 text-base max-w-sm mx-auto" style={{ color: 'var(--muted-light)' }}>
              Questions, feedback, or want to partner? We&apos;re easy to reach.
            </p>
          </div>

          <div className="max-w-lg mx-auto scroll-reveal" style={{ transitionDelay: '0.1s' }}>
            {!contactSent ? (
              <form className="card-glass p-8" onSubmit={handleContact}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full input-waitlist"
                      style={{ borderRadius: '14px' }}
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full input-waitlist"
                      style={{ borderRadius: '14px' }}
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Message</label>
                    <textarea
                      placeholder="What's on your mind?"
                      rows={4}
                      className="w-full input-waitlist resize-none"
                      style={{ borderRadius: '14px' }}
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">Send Message</button>
                </div>
              </form>
            ) : (
              <div className="card-glass p-10 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-display text-xl mb-2">Message sent!</h3>
                <p className="text-sm" style={{ color: 'var(--muted-light)' }}>We&apos;ll get back to you soon.</p>
              </div>
            )}
          </div>
        </section>


        {/* ── FOOTER ── */}
        <footer className="py-10 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <NeedOneLogo size={36} />
              <span className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>NeedOne</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>© 2026 NeedOne</p>
          </div>
        </footer>

      </div>
    </>
  )
}
