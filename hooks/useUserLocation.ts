import { useState, useEffect } from 'react'

interface UserLocation {
  lat: number
  lng: number
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(null),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [])

  return location
}
