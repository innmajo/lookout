import { create } from 'zustand'
import { TRM_POR_DEFECTO } from '@/lib/dinero'
import {
  deleteAllFactores,
  deleteFactor,
  fetchFactores,
  fetchTrm,
  insertFactor,
  mensajeErrorSupabase,
  replaceWithEjemplos,
  updateFactor,
  upsertTrm,
} from '@/lib/factoresApi'
import { FACTORES_EJEMPLO } from '@/lib/sampleData'
import type { FactorFormValues, FactorPestel } from '@/types/pestel'

interface PestelState {
  factores: FactorPestel[]
  trmUsd: number
  loading: boolean
  error: string | null
  hydratedUserId: string | null
  cargarDesdeNube: (userId: string) => Promise<void>
  limpiarLocal: () => void
  setTrmUsd: (trm: number) => Promise<void>
  agregarFactor: (userId: string, values: FactorFormValues) => Promise<FactorPestel>
  actualizarFactor: (userId: string, id: string, values: FactorFormValues) => Promise<void>
  eliminarFactor: (userId: string, id: string) => Promise<void>
  borrarTodo: (userId: string) => Promise<void>
  cargarEjemplos: (userId: string) => Promise<void>
}

export const usePestelStore = create<PestelState>((set, get) => ({
  factores: [],
  trmUsd: TRM_POR_DEFECTO,
  loading: false,
  error: null,
  hydratedUserId: null,

  limpiarLocal: () =>
    set({
      factores: [],
      trmUsd: TRM_POR_DEFECTO,
      loading: false,
      error: null,
      hydratedUserId: null,
    }),

  cargarDesdeNube: async (userId) => {
    if (get().hydratedUserId === userId && !get().loading) return
    set({ loading: true, error: null })
    try {
      const [factores, trm] = await Promise.all([fetchFactores(userId), fetchTrm(userId)])
      set({
        factores,
        trmUsd: trm ?? TRM_POR_DEFECTO,
        loading: false,
        hydratedUserId: userId,
        error: null,
      })
    } catch (error) {
      set({
        loading: false,
        error: mensajeErrorSupabase(error),
        hydratedUserId: userId,
      })
      throw error
    }
  },

  setTrmUsd: async (trmUsd) => {
    const valor = trmUsd > 0 ? trmUsd : TRM_POR_DEFECTO
    const userId = get().hydratedUserId
    set({ trmUsd: valor })
    if (!userId) return
    try {
      await upsertTrm(userId, valor)
    } catch (error) {
      set({ error: mensajeErrorSupabase(error) })
      throw error
    }
  },

  agregarFactor: async (userId, values) => {
    const factor = await insertFactor(userId, values)
    set((state) => ({ factores: [factor, ...state.factores] }))
    return factor
  },

  actualizarFactor: async (userId, id, values) => {
    const actualizado = await updateFactor(userId, id, values)
    set((state) => ({
      factores: state.factores.map((factor) => (factor.id === id ? actualizado : factor)),
    }))
  },

  eliminarFactor: async (userId, id) => {
    await deleteFactor(userId, id)
    set((state) => ({
      factores: state.factores.filter((factor) => factor.id !== id),
    }))
  },

  borrarTodo: async (userId) => {
    await deleteAllFactores(userId)
    set({ factores: [] })
  },

  cargarEjemplos: async (userId) => {
    const factores = await replaceWithEjemplos(userId, FACTORES_EJEMPLO)
    set({ factores })
  },
}))
