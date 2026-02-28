import { useRef, useCallback, useState, useEffect } from 'react'
import Map, { GeolocateControl, NavigationControl, Marker, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/mapStore'
import { useRealtimeCheckIns } from '@/hooks/useRealtimeCheckIns'
import { useCheckIn } from '@/hooks/useCheckIn'
import { useAuth } from '@/hooks/useAuth'
import { useFriendships } from '@/hooks/useFriendships'
import ParkPin from './ParkPin'
import AvatarHead from './AvatarHead'
import ParkCard from './ParkCard'
import CheckInChip from './CheckInChip'
import UserBottomSheet from './UserBottomSheet'
import type { Park, CheckIn } from '@/lib/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const INITIAL_VIEW = {
  longitude: -117.89793372,
  latitude: 34.10202438,
  zoom: 15,
}

const MAX_VISIBLE_AVATARS = 5
const AVATAR_SPACING_LNG = 0.00022
const AVATAR_OFFSET_LAT = 0.00042

function getAvatarPositions(checkIns: CheckIn[], park: Park) {
  const visible = checkIns.slice(0, MAX_VISIBLE_AVATARS)
  const n = visible.length
  return visible.map((ci, i) => ({
    checkIn: ci,
    lat: park.lat + AVATAR_OFFSET_LAT,
    lng: park.lng + (i - (n - 1) / 2) * AVATAR_SPACING_LNG,
  }))
}

export default function MapView() {
  const { session } = useAuth()
  const { parks, activeCheckIns, selectedPark, setSelectedPark } = useMapStore()
  const { currentCheckIn, checkIn, checkOut } = useCheckIn()
  const { sendRequest, friendships } = useFriendships()
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null)
  const mapRef = useRef<MapRef>(null)

  useRealtimeCheckIns()

  // Fly to park whenever selectedPark changes (handles both pin tap and park list selection)
  useEffect(() => {
    if (!selectedPark) return
    mapRef.current?.flyTo({
      center: [selectedPark.lng, selectedPark.lat],
      zoom: 16,
      duration: 800,
      essential: true,
    })
  }, [selectedPark])

  const handleParkClick = useCallback((park: Park) => {
    setSelectedCheckIn(null)
    setSelectedPark(park)
  }, [setSelectedPark])

  const handleAvatarClick = useCallback((checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn)
  }, [])

  function getFriendStatus(userId: string): 'none' | 'pending' | 'accepted' | 'self' {
    if (!session) return 'none'
    if (userId === session.user.id) return 'self'
    const f = friendships.find(
      (f) => f.requester_id === userId || f.addressee_id === userId
    )
    if (!f) return 'none'
    return f.status as 'pending' | 'accepted'
  }

  function checkInsForPark(parkId: string) {
    return activeCheckIns.filter((c) => c.park_id === parkId)
  }

  const selectedParkCheckIns = selectedPark ? checkInsForPark(selectedPark.id) : []
  const avatarPositions = selectedPark ? getAvatarPositions(selectedParkCheckIns, selectedPark) : []
  const overflowCount = selectedParkCheckIns.length - MAX_VISIBLE_AVATARS

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={() => {
          if (selectedPark) { setSelectedPark(null); setSelectedCheckIn(null) }
        }}
      >
        <GeolocateControl position="bottom-right" trackUserLocation />
        <NavigationControl position="bottom-right" showCompass={false} />

        {parks.map((park) => (
          // Hide the selected park's pin — avatars take focus when zoomed in
          selectedPark?.id === park.id ? null : (
            <ParkPin
              key={park.id}
              park={park}
              checkIns={checkInsForPark(park.id)}
              onClick={handleParkClick}
            />
          )
        ))}

        {avatarPositions.map(({ checkIn: ci, lat, lng }) => (
          <AvatarHead
            key={ci.id}
            checkIn={ci}
            lat={lat}
            lng={lng}
            isSelf={getFriendStatus(ci.user_id) === 'self'}
            isFriend={getFriendStatus(ci.user_id) === 'accepted'}
            onClick={handleAvatarClick}
          />
        ))}

        {selectedPark && overflowCount > 0 && (() => {
          const n = Math.min(selectedParkCheckIns.length, MAX_VISIBLE_AVATARS)
          const overflowLng = selectedPark.lng + (n - (n - 1) / 2) * AVATAR_SPACING_LNG
          return (
            <Marker
              longitude={overflowLng}
              latitude={selectedPark.lat + AVATAR_OFFSET_LAT}
              anchor="bottom"
            >
              <div className="w-11 h-11 rounded-full bg-zinc-700 border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">+{overflowCount}</span>
              </div>
            </Marker>
          )
        })()}
      </Map>

      {currentCheckIn && (
        <CheckInChip checkIn={currentCheckIn} onCheckOut={checkOut} />
      )}

      <ParkCard
        park={selectedPark}
        checkIns={selectedPark ? checkInsForPark(selectedPark.id) : []}
        isCheckedIn={!!currentCheckIn}
        currentParkId={currentCheckIn?.park_id ?? null}
        onCheckIn={() => selectedPark && checkIn(selectedPark.id)}
        onCheckOut={checkOut}
        onClose={() => { setSelectedPark(null); setSelectedCheckIn(null) }}
        hidden={!!selectedCheckIn}
      />

      <UserBottomSheet
        checkIn={selectedCheckIn}
        onClose={() => { setSelectedCheckIn(null); setSelectedPark(null) }}
        onBack={() => setSelectedCheckIn(null)}
        onAddFriend={sendRequest}
        friendStatus={selectedCheckIn ? getFriendStatus(selectedCheckIn.user_id) : 'none'}
      />
    </div>
  )
}
