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
    // hidden=true slides it off-screen so UserBottomSheet can take the slot
    <div className={`transition-transform duration-300 ease-out ${hidden ? 'translate-y-full' : ''}`}>
      <BottomSheet open={!!park} onClose={onClose}>
        <div className="px-6 pb-8 pt-4">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-white text-xl font-bold">{park.name}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {park.description && (
            <p className="text-zinc-400 text-sm mb-4">{park.description}</p>
          )}

          <div className="flex items-center gap-1.5 mb-6">
            <div className={`w-2 h-2 rounded-full ${playerCount > 0 ? 'bg-green-500' : 'bg-zinc-600'}`} />
            <span className="text-zinc-300 text-sm">
              {playerCount === 0
                ? 'No one here right now'
                : `${playerCount} player${playerCount === 1 ? '' : 's'} here`}
            </span>
          </div>

          {isCheckedInHere ? (
            <button
              onClick={() => { onCheckOut(); onClose() }}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
            >
              Check out
            </button>
          ) : isCheckedIn ? (
            <button
              onClick={() => { onCheckIn(); onClose() }}
              className="w-full bg-white text-black rounded-xl py-3.5 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Move here
            </button>
          ) : (
            <button
              onClick={() => { onCheckIn(); onClose() }}
              className="w-full bg-white text-black rounded-xl py-3.5 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Check in
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
