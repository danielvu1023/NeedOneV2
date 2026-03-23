export interface ShotError {
  label: string
  description: string
  severity: 'danger' | 'warning' | 'neutral'
}

export interface ShotData {
  id: string
  name: string
  subtitle: string
  comparePill?: string
  technique: string[]
  tip: string
  errors: ShotError[]
  drawerDetails: string[]
  videoStart: number
}

export interface EnrichedShot {
  id: string
  name: string
  videoId: string
  category: 'putaway' | 'counter' | 'drive' | 'reset' | 'serve' | 'other'
  startTime: number
  subtitle: string | null
  technique: { label: string; cue: string }[]
  errors: { badge: string; description: string }[]
  tip: string | null
  grip: string | null
  swingDirection: 'low-to-high' | 'flat' | 'high-to-low' | null
  finishPosition: string | null
  relatedShots: string[]
  expandDetails: string[]
  confidence: 'high' | 'medium' | 'low'
}

export type Shot = ShotData | EnrichedShot

export function isEnrichedShot(shot: Shot): shot is EnrichedShot {
  return 'videoId' in shot
}

export const VIDEO_ID = '1GCxgYCUb8E'

export const shots: Shot[] = [
  {
    id: 'overhead-smash',
    name: 'Overhead smash',
    subtitle: 'Ball above your head',
    videoStart: 159,
    technique: [
      'Grip: continental (edge-on, like holding a hammer)',
      'Stance: unit turn, closed stance — shuffle back to get behind ball',
      'Contact: full extension, ball above and slightly in front — paddle face ~20° forward tilt from vertical',
      'Finish: throw motion — follow through down across body, end below left hip',
    ],
    tip: 'Mental cue: imagine catching the ball out in front and slightly to the right',
    errors: [
      { label: 'Into net', description: 'Paddle face too closed — tilted too far forward, face points at the ground. Keep it closer to vertical at contact.', severity: 'danger' },
      { label: 'Goes long', description: 'Open paddle face (tilting back) or contacting too late — ball gets behind you, face opens up. Fix is footwork: shuffle back early.', severity: 'warning' },
      { label: 'Weak shot', description: 'Not enough space — ball too close or too far left. Create room to reach full extension out front and right.', severity: 'neutral' },
    ],
    drawerDetails: [
      'Set up with your non-paddle hand pointing at the ball to track it.',
      'Shift weight from back foot to front foot as you swing.',
      'Aim for the opponent\'s feet or the deep corners.',
      'If the lob is short, let it bounce first — you\'ll get a better angle.',
      'Practice the timing: too early = no power, too late = mis-hit.',
    ],
  },
  {
    id: 'high-forehand-slap',
    name: 'High forehand slap',
    subtitle: 'Ball at head/shoulder height',
    videoStart: 548,
    comparePill: 'vs overhead: nearly vertical paddle, finish at midsection not hip',
    technique: [
      'Grip: continental or slight eastern',
      'Wrist: super loose — this is where all the power comes from, not the swing',
      'Contact: start paddle at ball height, drive through the ball toward target',
      'Finish: relaxed follow-through ending around midsection, not below hip',
    ],
    tip: 'Power comes from the loose wrist and momentum through the ball — not a big swing',
    errors: [
      { label: 'Into net', description: 'Swinging down instead of through — paddle face tilts too far forward and points at ground. Drive through the ball, not at it.', severity: 'danger' },
      { label: 'Late / mishit', description: 'Too big a backswing — causes late contact and loss of control. Keep it compact, the loose wrist does the work.', severity: 'warning' },
      { label: 'Too early', description: 'Taking the ball before it reaches the right contact point. Let it arrive at shoulder/head height, then drive through.', severity: 'warning' },
    ],
    drawerDetails: [
      'Only a slight shoulder turn needed — no full unit turn like the overhead. Less setup, faster reaction shot.',
      'You may need to shuffle laterally to get in position — don\'t reach, get your feet to the ball.',
      'Chest and shoulders rotate through contact for power — but the rotation is compact, not a full wind-up.',
      'Think of it as a relaxed slapping motion — the loose wrist snaps through naturally at contact.',
    ],
  },
  {
    id: 'swinging-volley',
    name: 'Swinging volley',
    subtitle: 'Ball between waist and shoulder',
    videoStart: 791,
    comparePill: 'vs forehand slap: more closed face, swing goes low-to-high not flat',
    technique: [
      'Grip: eastern or slight eastern — closes face for topspin',
      'Setup: ball to your right, slight shoulder and hip turn to load',
      'Swing: start at or below ball level, drive low-to-high with loose wrist',
      'Finish: high across body like a full drive — topspin keeps it in court',
    ],
    tip: 'Topspin is the whole point — lets you swing aggressively and still land in court',
    errors: [
      { label: 'Into net', description: 'Swinging down instead of low-to-high — slices the ball, kills topspin, hard to clear the net. Start below ball level.', severity: 'danger' },
      { label: 'Mishit', description: 'Not enough space to the right — cramped swing means you can\'t get below the ball. Shuffle right to set up properly.', severity: 'warning' },
      { label: 'Weak / no spin', description: 'Open paddle face — losing the closed angle from the eastern grip. Check grip before the shot, not mid-swing.', severity: 'neutral' },
    ],
    drawerDetails: [
      'Ball height range is waist to shoulder — must be above net height or this shot doesn\'t apply.',
      'Shuffle right to position ball on your right side — don\'t reach across your body.',
      'Finish should feel like a full drive — high across the body, not stopping at midsection like the forehand slap.',
      'Eastern grip naturally closes the paddle face a few degrees — generates topspin without extra wrist work.',
    ],
  },
]
