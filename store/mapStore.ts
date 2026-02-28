import { create } from 'zustand'
import type { CheckIn, Park } from '@/lib/types'

interface MapStore {
  parks: Park[]
  activeCheckIns: CheckIn[]
  selectedPark: Park | null
  setParks: (parks: Park[]) => void
  setActiveCheckIns: (checkIns: CheckIn[]) => void
  upsertCheckIn: (checkIn: CheckIn) => void
  removeCheckIn: (checkInId: string) => void
  setSelectedPark: (park: Park | null) => void
}

export const useMapStore = create<MapStore>((set) => ({
  parks: [],
  activeCheckIns: [],
  selectedPark: null,

  setParks: (parks) => set({ parks }),
  setActiveCheckIns: (checkIns) => set({ activeCheckIns: checkIns }),

  upsertCheckIn: (checkIn) =>
    set((state) => {
      const existing = state.activeCheckIns.findIndex((c) => c.id === checkIn.id)
      if (existing >= 0) {
        const updated = [...state.activeCheckIns]
        updated[existing] = checkIn
        return { activeCheckIns: updated }
      }
      return { activeCheckIns: [...state.activeCheckIns, checkIn] }
    }),

  removeCheckIn: (checkInId) =>
    set((state) => ({
      activeCheckIns: state.activeCheckIns.filter((c) => c.id !== checkInId),
    })),

  setSelectedPark: (park) => set({ selectedPark: park }),
}))
