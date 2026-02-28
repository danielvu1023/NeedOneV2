import type { CheckIn } from '@/lib/types'

interface CheckInChipProps {
  checkIn: CheckIn
  onCheckOut: () => void
}

export default function CheckInChip({ checkIn, onCheckOut }: CheckInChipProps) {
  const parkName = checkIn.park?.name ?? 'a park'

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-forest/90 backdrop-blur-sm border border-forest rounded-full px-4 py-2.5 shadow-xl"
      style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-white text-sm font-medium whitespace-nowrap">
        {parkName}
      </span>
      <button
        onClick={onCheckOut}
        className="ml-1 text-white/50 hover:text-white transition-colors"
        aria-label="Check out"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
