import BottomSheet from '@/components/BottomSheet'
import type { Park, CheckIn } from '@/lib/types'

interface ParkCardProps {
  park: Park | null
  checkIns: CheckIn[]
  isCheckedIn: boolean
  currentParkId: string | null
  onCheckIn: () => void
  onCheckOut: () => void
  onClose: () => void
  hidden?: boolean
}

export default function ParkCard({
  park,
  checkIns,
  isCheckedIn,
  currentParkId,
  onCheckIn,
  onCheckOut,
  onClose,
  hidden = false,
}: ParkCardProps) {
  if (!park) return null

  const isCheckedInHere = isCheckedIn && currentParkId === park.id
  const playerCount = checkIns.length

  return (
    <div className={`transition-transform duration-300 ease-out ${hidden ? 'translate-y-full' : ''}`}>
      <BottomSheet open={!!park} onClose={onClose}>
        <div className="px-6 pt-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-forest text-xl font-display font-bold">{park.name}</h2>
            <button onClick={onClose} className="text-moss hover:text-forest transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {park.description && (
            <p className="text-moss text-sm mb-4">{park.description}</p>
          )}

          <div className="flex items-center gap-1.5 mb-6">
            <div className={`w-2 h-2 rounded-full ${playerCount > 0 ? 'bg-green-500' : 'bg-sage-mid'}`} />
            <span className="text-forest/70 text-sm">
              {playerCount === 0
                ? 'No one here right now'
                : `${playerCount} player${playerCount === 1 ? '' : 's'} here`}
            </span>
          </div>

          {isCheckedInHere ? (
            <button
              onClick={() => { onCheckOut(); onClose() }}
              className="w-full bg-white border-2 border-forest text-forest rounded-xl py-4 text-sm font-display font-bold tracking-wide hover:bg-sage transition-colors"
            >
              Check Out
            </button>
          ) : isCheckedIn ? (
            <button
              onClick={() => { onCheckIn(); onClose() }}
              className="w-full bg-green-500 text-forest rounded-xl py-4 text-sm font-display font-bold tracking-wide hover:bg-green-400 transition-colors"
            >
              Move Here
            </button>
          ) : (
            <button
              onClick={() => { onCheckIn(); onClose() }}
              className="w-full bg-green-500 text-forest rounded-xl py-4 text-sm font-display font-bold tracking-wide hover:bg-green-400 transition-colors"
            >
              Check In
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
