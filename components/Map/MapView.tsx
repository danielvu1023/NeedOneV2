import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import Map, { GeolocateControl, NavigationControl, Marker, Source, Layer, type MapRef } from 'react-map-gl'
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
import type { Park, CheckIn } from '@/lib/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const INITIAL_VIEW = {
  longitude: -117.89793372,
  latitude: 34.10202438,
  zoom: 15,
}

const MAX_VISIBLE_AVATARS = 6
// Radius in metres for the avatar circle around a park
const CIRCLE_RADIUS_M = 120

// Degrees per metre at a given latitude
function metresPerDegLat() { return 111320 }
function metresPerDegLng(lat: number) { return 111320 * Math.cos((lat * Math.PI) / 180) }

/**
 * Distribute up to MAX_VISIBLE_AVATARS check-ins evenly around a geographic
 * circle of CIRCLE_RADIUS_M centred on the park.
 * Start angle: top (−π/2), going clockwise.
 */
function getCircularAvatarPositions(checkIns: CheckIn[], park: Park) {
  const visible = checkIns.slice(0, MAX_VISIBLE_AVATARS)
  if (visible.length === 0) return []

  const n = visible.length
  const dLat = CIRCLE_RADIUS_M / metresPerDegLat()
  const dLng = CIRCLE_RADIUS_M / metresPerDegLng(park.lat)

  return visible.map((ci, i) => {
    // Each avatar gets its own angular sector (guarantees no two land in the same spot),
    // with UUID-seeded radius variation so they're not all on the same ring.
    const hex = ci.id.replace(/-/g, '')
    const byte1 = parseInt(hex.slice(2, 4), 16)  // 0–255 → radius
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const r = 0.4 + 0.6 * (byte1 / 255)
    return {
      checkIn: ci,
      lat: park.lat + dLat * r * Math.sin(angle),
      lng: park.lng + dLng * r * Math.cos(angle),
    }
  })
}

/**
 * Build a GeoJSON FeatureCollection with one circle polygon per park.
 * Each feature carries a `selected` property so the layer can style it differently.
 */
function buildAllParksGeoJSON(parks: Park[], selectedParkId: string | null, radiusM: number, steps = 64): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = parks.map((park) => {
    const dLat = radiusM / metresPerDegLat()
    const dLng = radiusM / metresPerDegLng(park.lat)
    const coords: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps
      coords.push([
        park.lng + dLng * Math.cos(angle),
        park.lat + dLat * Math.sin(angle),
      ])
    }
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: { selected: park.id === selectedParkId },
    }
  })
  return { type: 'FeatureCollection', features }
}

export default function MapView() {
  const { session } = useAuth()
  const { parks, activeCheckIns, selectedPark, setSelectedPark } = useMapStore()
  const { currentCheckIn, checkIn, checkOut } = useCheckIn()
  const { friendships } = useFriendships()
  // selectedCheckIn drives the player detail view inside ParkCard
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null)
  const mapRef = useRef<MapRef>(null)

  const friendIds = useMemo(() => {
    if (!session) return []
    return friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => f.requester_id === session.user.id ? f.addressee_id : f.requester_id)
  }, [friendships, session])

  useRealtimeCheckIns(friendIds)

  useEffect(() => {
    if (!selectedPark) setSelectedCheckIn(null)
  }, [selectedPark])

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

  // Avatar head tap: open the park card (if needed) then jump to player view
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
  const avatarPositions = selectedPark ? getCircularAvatarPositions(selectedParkCheckIns, selectedPark) : []
  const overflowCount = selectedParkCheckIns.length - MAX_VISIBLE_AVATARS

  const circleGeoJSON = useMemo(
    () => parks.length > 0
      ? buildAllParksGeoJSON(parks, selectedPark?.id ?? null, CIRCLE_RADIUS_M)
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parks, selectedPark?.id]
  )

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => {
          if (selectedPark) { setSelectedPark(null); setSelectedCheckIn(null) }
        }}
      >
        <GeolocateControl position="bottom-right" trackUserLocation />
        <NavigationControl position="bottom-right" showCompass={false} />

        {parks.map((park) => (
          selectedPark?.id === park.id ? null : (
            <ParkPin
              key={park.id}
              park={park}
              checkIns={checkInsForPark(park.id)}
              onClick={handleParkClick}
            />
          )
        ))}

        {/* Circles around all parks — brighter when selected */}
        {circleGeoJSON && (
          <Source id="park-rings" type="geojson" data={circleGeoJSON}>
            <Layer
              id="park-ring-fill"
              type="fill"
              paint={{
                'fill-color': '#22c55e',
                'fill-opacity': ['case', ['get', 'selected'], 0.09, 0.04],
              }}
            />
            <Layer
              id="park-ring-line"
              type="line"
              paint={{
                'line-color': '#22c55e',
                'line-width': ['case', ['get', 'selected'], 1.8, 1],
                'line-opacity': ['case', ['get', 'selected'], 0.45, 0.2],
              }}
            />
          </Source>
        )}

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

        {/* Overflow badge sits at the park centre */}
        {selectedPark && overflowCount > 0 && (
          <Marker
            longitude={selectedPark.lng}
            latitude={selectedPark.lat}
            anchor="center"
          >
            <div className="w-11 h-11 rounded-full bg-zinc-700 border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">+{overflowCount}</span>
            </div>
          </Marker>
        )}
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
        selectedCheckIn={selectedCheckIn}
        onPlayerTap={handleAvatarClick}
        onBackFromPlayer={() => setSelectedCheckIn(null)}
      />
    </div>
  )
}
