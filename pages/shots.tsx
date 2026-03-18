import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'
import ShotCard from '@/components/Shots/ShotCard'
import { shots } from '@/components/Shots/shotData'
import OverheadSmashDiagram from '@/components/Shots/diagrams/OverheadSmashDiagram'
import HighForehandSlapDiagram from '@/components/Shots/diagrams/HighForehandSlapDiagram'
import SwingingVolleyDiagram from '@/components/Shots/diagrams/SwingingVolleyDiagram'

const diagrams = [
  <OverheadSmashDiagram key="overhead" />,
  <HighForehandSlapDiagram key="forehand" />,
  <SwingingVolleyDiagram key="volley" />,
]

export default function ShotsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) router.replace('/auth')
  }, [loading, session, router])

  if (loading || !session) return null

  return (
    <div className="flex flex-col bg-sage text-forest h-[100dvh]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
          {/* Header */}
          <h1 className="font-display font-bold text-2xl mb-1">Shot Reference</h1>
          <p className="text-moss text-sm mb-4">
            Compare paddle angles and contact points across power shots.
          </p>

          {/* Shot cards */}
          <div className="space-y-4 pb-6">
            {shots.map((shot, i) => (
              <ShotCard key={shot.id} shot={shot} diagram={diagrams[i]} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
