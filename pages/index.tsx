import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useMapStore } from '@/store/mapStore'
import BottomNav from '@/components/BottomNav'
import NotificationBell from '@/components/NotificationBell'
import CheckInToast from '@/components/CheckInToast'
import PermissionModal from '@/components/PermissionModal'
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
      <div className="min-h-screen bg-sage flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sage-mid border-t-forest rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-sage">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView />
      </div>

      {/* Top-right controls: vertically stacked, below check-in chip zone */}
      <div
        className="absolute right-4 z-20 flex flex-col gap-2"
        style={{ top: 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' }}
      >
        <NotificationBell />
        <button
          onClick={() => router.push('/feedback')}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-sage-mid flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          aria-label="Send feedback"
        >
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-forest">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </button>
      </div>

      {/* In-app check-in toast */}
      <CheckInToast />

      {/* Permission modal */}
      <PermissionModal />

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
