export interface Park {
  id: string
  name: string
  lat: number
  lng: number
}

export const PARKS: Park[] = [
  {
    id: 'hollenbeck',
    name: 'Hollenbeck Park',
    lat: 34.0435,
    lng: -118.2087,
  },
  {
    id: 'elysian',
    name: 'Elysian Park',
    lat: 34.0778,
    lng: -118.2373,
  },
  {
    id: 'griffith',
    name: 'Griffith Park',
    lat: 34.1366,
    lng: -118.2942,
  },
]

export const DEFAULT_PARK = PARKS[0]
