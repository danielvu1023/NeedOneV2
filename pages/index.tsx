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
      <div className="absolute inset-0" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <MapView />
      </div>

      {/* Top-right: notification bell */}
      <NotificationBell />

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
