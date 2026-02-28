export interface Profile {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean | null
  created_at: string
}

export interface Park {
  id: string
  name: string
  lat: number
  lng: number
  description: string | null
  created_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  park_id: string
  checked_in_at: string
  expires_at: string
  profile?: Profile
  park?: Park
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'friend_checkin'
  actor_id: string | null
  park_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
  park?: Park
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}
