import type { Profile } from '@/lib/types'

export function getDisplayName(profile: Profile | null | undefined): string {
  if (!profile) return 'Someone'
  if (profile.first_name) {
    return profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name
  }
  return profile.username ?? 'Someone'
}
