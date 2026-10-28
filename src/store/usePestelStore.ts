import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRM_POR_DEFECTO } from '@/lib/dinero'
import { FACTORES_EJEMPLO } from '@/lib/sampleData'
import { esSectorId } from '@/lib/sectores'
import type { FactorFormValues, FactorPestel } from '@/types/pestel'

interface PestelState {
  factores: FactorPestel[]
  trmUsd: number
  setTrmUsd: (trm: number) => void
  agregarFactor: (values: FactorFormValues) => FactorPestel
  actualizarFactor: (id: string, values: FactorFormValues) => void
  eliminarFactor: (id: string) => void
  borrarTodo: () => void
  cargarEjemplos: () => void
}

function normalizarFactor(factor: FactorPestel): FactorPestel {
  return {
    ...factor,
    sector: esSectorId(factor.sector) ? factor.sector : 'agro',
    valorCOP: typeof factor.valorCOP === 'number' && Number.isFinite(factor.valorCOP) ? factor.valorCOP : undefined,
  }
}

export const usePestelStore = create<PestelState>()(
  persist(
    (set) => ({
      factores: [],
      trmUsd: TRM_POR_DEFECTO,
      setTrmUsd: (trmUsd) => set({ trmUsd: trmUsd > 0 ? trmUsd : TRM_POR_DEFECTO }),
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
    {
      name: 'lookout-pestel',
      version: 1,
      migrate: (persisted) => {
        const data = persisted as Partial<PestelState>
        return {
          factores: (data.factores ?? []).map(normalizarFactor),
          trmUsd: data.trmUsd && data.trmUsd > 0 ? data.trmUsd : TRM_POR_DEFECTO,
        }
      },
    },
  ),
)
