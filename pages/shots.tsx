import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'
import ShotCard from '@/components/Shots/ShotCard'
import { shots } from '@/components/Shots/shotData'
import OverheadSmashDiagram from '@/components/Shots/diagrams/OverheadSmashDiagram'
import HighForehandSlapDiagram from '@/components/Shots/diagrams/HighForehandSlapDiagram'
import SwingingVolleyDiagram from '@/components/Shots/diagrams/SwingingVolleyDiagram'

const diagrams: Record<string, ReactNode> = {
  'overhead-smash': <OverheadSmashDiagram key="overhead" />,
  'high-forehand-slap': <HighForehandSlapDiagram key="forehand" />,
  'swinging-volley': <SwingingVolleyDiagram key="volley" />,
}

function PlaceholderDiagram() {
  return (
    <div className="flex items-center justify-center h-32 text-moss text-sm opacity-60">
      <svg className="w-8 h-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
      Diagram coming soon
    </div>
  )
}

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
            {shots.map((shot) => (
              <ShotCard
                key={shot.id}
                shot={shot}
                diagram={diagrams[shot.id] || <PlaceholderDiagram />}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
