import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FactorFormValues, FactorPestel } from '@/types/pestel'
import { FACTORES_EJEMPLO } from '@/lib/sampleData'

interface PestelState {
  factores: FactorPestel[]
  agregarFactor: (values: FactorFormValues) => FactorPestel
  actualizarFactor: (id: string, values: FactorFormValues) => void
  eliminarFactor: (id: string) => void
  borrarTodo: () => void
  cargarEjemplos: () => void
}

export const usePestelStore = create<PestelState>()(
  persist(
    (set) => ({
      factores: [],
      agregarFactor: (values) => {
        const factor: FactorPestel = {
          ...values,
          id: crypto.randomUUID(),
          fechaRegistro: new Date().toISOString(),
          esEjemplo: false,
        }
        set((state) => ({ factores: [factor, ...state.factores] }))
        return factor
      },
      actualizarFactor: (id, values) => {
        set((state) => ({
          factores: state.factores.map((factor) =>
            factor.id === id ? { ...factor, ...values, esEjemplo: false } : factor,
          ),
        }))
      },
      eliminarFactor: (id) => {
        set((state) => ({
          factores: state.factores.filter((factor) => factor.id !== id),
        }))
      },
      borrarTodo: () => set({ factores: [] }),
      cargarEjemplos: () => set({ factores: FACTORES_EJEMPLO }),
    }),
    { name: 'lookout-pestel' },
  ),
)
