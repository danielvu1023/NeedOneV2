import { useState, type ReactNode } from 'react'
import type { ShotData } from './shotData'
import { VIDEO_ID } from './shotData'

interface ShotCardProps {
  shot: ShotData
  diagram: ReactNode
}

export default function ShotCard({ shot, diagram }: ShotCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl border border-sage-mid shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display font-bold text-forest text-lg">{shot.name}</h2>
          <p className="text-moss text-sm">{shot.subtitle}</p>
        </div>

        {/* Diagram */}
        <div className="mx-4 bg-sage rounded-xl p-2">
          {diagram}
        </div>

        {/* Compare pill */}
        {shot.comparePill && (
          <div className="px-4 pt-3">
            <span className="inline-block bg-sage rounded-full px-3 py-1.5 text-xs text-moss">
              {shot.comparePill}
            </span>
          </div>
        )}

        {/* Technique */}
        <div className="px-4 pt-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-moss mb-2">Key Technique</h3>
          <ul className="space-y-2">
            {shot.technique.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-forest">
                <span className="w-2 h-2 rounded-full bg-court mt-1.5 flex-shrink-0" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
          {/* Tip / mental cue */}
          <div className="mt-3 bg-sage rounded-xl px-3.5 py-2.5 flex gap-2 items-start">
            <span className="text-base mt-0.5 flex-shrink-0">💡</span>
            <span className="text-sm text-forest">{shot.tip}</span>
          </div>
        </div>

        {/* Errors */}
        <div className="px-4 pt-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-moss mb-3">Common Misses</h3>
          <div className="space-y-3">
            {shot.errors.map((error, i) => (
              <div key={i}>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-1 ${
                    error.severity === 'danger'
                      ? 'bg-red-100 text-red-700'
                      : error.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'border border-sage-mid text-moss'
                  }`}
                >
                  {error.label}
                </span>
                <p className="text-sm text-forest">{error.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Watch clip */}
        <div className="px-4 pt-3">
          <button
            onClick={() => setVideoOpen(true)}
            className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-xl bg-sage hover:bg-sage-mid transition-colors"
          >
            <svg className="w-5 h-5 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-sm font-medium text-forest">Watch clip</span>
            <span className="text-xs text-moss ml-auto">
              {Math.floor(shot.videoStart / 60)}:{String(shot.videoStart % 60).padStart(2, '0')}
            </span>
          </button>
        </div>

        {/* Expand/collapse drawer */}
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-display font-bold text-moss"
          >
            <span>{expanded ? 'Less' : 'More details'}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
              expanded ? 'max-h-[500px]' : 'max-h-0'
            }`}
          >
            <ul className="pt-3 space-y-2">
              {shot.drawerDetails.map((detail, i) => (
                <li key={i} className="flex gap-2 text-sm text-forest">
                  <span className="text-moss mt-0.5 flex-shrink-0">&#8226;</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Video modal — unmounts iframe on close so video stops */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setVideoOpen(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-2xl">
            {/* Close button — floated above the video */}
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Player — edge-to-edge on mobile, rounded on larger screens */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?start=${shot.videoStart}&rel=0&modestbranding=1&playsinline=1`}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="border-0"
              />
            </div>
            {/* Shot name under video */}
            <p className="text-white/60 text-xs text-center mt-3 font-display">{shot.name}</p>
          </div>
        </div>
      )}
    </>
  )
}
