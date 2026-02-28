import { Marker } from 'react-map-gl'
import type { Park, CheckIn } from '@/lib/types'

interface ParkPinProps {
  park: Park
  checkIns: CheckIn[]
  onClick: (park: Park) => void
}

export default function ParkPin({ park, checkIns, onClick }: ParkPinProps) {
  const count = checkIns.length

  return (
    <Marker
      longitude={park.lng}
      latitude={park.lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick(park)
      }}
    >
      <div className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center">
        <div className="bg-green-500 text-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 min-w-[48px] justify-center">
          {/* Pickleball icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M12 2 Q8 7 8 12 Q8 17 12 22" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M12 2 Q16 7 16 12 Q16 17 12 22" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
          {count > 0 && (
            <span className="text-xs font-bold">{count}</span>
          )}
        </div>
        <div className="w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #22C55E',
          }}
        />
      </div>
    </Marker>
  )
}
