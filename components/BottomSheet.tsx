import { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  snapHeight?: string
}

export default function BottomSheet({ open, onClose, children, snapHeight = 'auto' }: BottomSheetProps) {
  return (
    <>
      {/* Sheet — no backdrop so the map stays fully interactive */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={snapHeight !== 'auto' ? { height: snapHeight } : undefined}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        {children}
      </div>
    </>
  )
}
