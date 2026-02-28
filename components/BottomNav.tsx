import { useRouter } from 'next/router'

interface BottomNavProps {
  onParkListOpen?: () => void
}

const tabs = [
  { href: '/friends', label: 'Friends' },
  { href: '/',       label: 'Parks'   },
  { href: '/profile', label: 'Profile' },
]

function FriendsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ParksIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

const icons = {
  '/friends': FriendsIcon,
  '/': ParksIcon,
  '/profile': ProfileIcon,
}

export default function BottomNav({ onParkListOpen }: BottomNavProps) {
  const router = useRouter()

  function handleTabPress(href: string) {
    if (href === '/' && router.pathname === '/') {
      // Already on map — open park list instead of navigating
      onParkListOpen?.()
    } else {
      router.push(href)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-sm border-t border-zinc-800">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map((tab) => {
          const active = router.pathname === tab.href
          const Icon = icons[tab.href as keyof typeof icons]
          return (
            <button
              key={tab.href}
              onClick={() => handleTabPress(tab.href)}
              className="flex flex-col items-center gap-1 flex-1 py-2"
            >
              <Icon active={active} />
              <span className={`text-[10px] ${active ? 'text-white' : 'text-zinc-500'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
