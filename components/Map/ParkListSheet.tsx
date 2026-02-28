import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useUserLocation } from '@/hooks/useUserLocation'
import { distanceMiles, formatDistance } from '@/lib/geoUtils'
import type { Park } from '@/lib/types'

interface ParkListSheetProps {
  open: boolean
  onClose: () => void
  onSelectPark: (park: Park) => void
}

export default function ParkListSheet({ open, onClose, onSelectPark }: ParkListSheetProps) {
  const { parks, activeCheckIns } = useMapStore()
  const userLocation = useUserLocation()

  const sortedParks = useMemo(() => {
    return [...parks]
      .map((park) => {
        const count = activeCheckIns.filter((c) => c.park_id === park.id).length
        const distance = userLocation
          ? distanceMiles(userLocation.lat, userLocation.lng, park.lat, park.lng)
          : null
        return { park, count, distance }
      })
      .sort((a, b) => {
        // Sort by distance if available, otherwise by player count desc
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance
        return b.count - a.count
      })
  }, [parks, activeCheckIns, userLocation])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-zinc-700" />
      </div>

      <div className="px-5 pb-8 pt-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Parks</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {sortedParks.map(({ park, count, distance }) => (
            <button
              key={park.id}
              onClick={() => { onSelectPark(park); onClose() }}
              className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 transition-colors text-left"
            >
              {/* Activity dot */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${count > 0 ? 'bg-green-500' : 'bg-zinc-600'}`} />

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{park.name}</p>
                {park.description && (
                  <p className="text-zinc-500 text-xs mt-0.5 truncate">{park.description}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                {count > 0 && (
                  <span className="text-green-400 text-xs font-semibold">
                    {count} playing
                  </span>
                )}
                {distance !== null && (
                  <span className="text-zinc-500 text-xs">{formatDistance(distance)}</span>
                )}
              </div>

              <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
