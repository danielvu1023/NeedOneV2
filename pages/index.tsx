import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useMapStore } from '@/store/mapStore'
import BottomNav from '@/components/BottomNav'
import NotificationBell from '@/components/NotificationBell'
import PushPrompt from '@/components/PushPrompt'
import ParkListSheet from '@/components/Map/ParkListSheet'

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false })

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { setSelectedPark } = useMapStore()
  const [parkListOpen, setParkListOpen] = useState(false)

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [session, loading, router])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Full-screen map */}
      <div className="absolute inset-0 bottom-16">
        <MapView />
      </div>

      {/* Top-right: notification bell */}
      <NotificationBell />

      {/* Top-left: parks list button */}
      <button
        onClick={() => setParkListOpen(true)}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm border border-zinc-700 rounded-full pl-3 pr-4 h-10 hover:bg-black/90 transition-colors"
        aria-label="Parks list"
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
        </svg>
        <span className="text-white text-sm font-medium">Parks</span>
      </button>

      {/* Push notification prompt */}
      <PushPrompt />

      {/* Park list sheet */}
      <ParkListSheet
        open={parkListOpen}
        onClose={() => setParkListOpen(false)}
        onSelectPark={(park) => {
          setSelectedPark(park)
          setParkListOpen(false)
        }}
      />

      {/* Bottom nav — Parks tab re-opens the list when already on this page */}
      <BottomNav onParkListOpen={() => setParkListOpen(true)} />
    </div>
  )
}
