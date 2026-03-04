import dynamic from 'next/dynamic'

const LandingPhoneDemoInner = dynamic(() => import('./LandingPhoneDemoInner'), { ssr: false })

export default function LandingPhoneDemo() {
  return <LandingPhoneDemoInner />
}
