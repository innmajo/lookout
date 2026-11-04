import { create } from 'zustand'
import { TRM_POR_DEFECTO } from '@/lib/dinero'
import {
  deleteAllFactores,
  deleteFactor,
  fetchFactores,
  fetchTrmEmpresa,
  insertFactor,
  mensajeErrorSupabase,
  replaceWithEjemplos,
  updateFactor,
  upsertTrmEmpresa,
} from '@/lib/factoresApi'
import { FACTORES_EJEMPLO } from '@/lib/sampleData'
import type { SectorId } from '@/lib/sectores'
import type { FactorFormValues, FactorPestel } from '@/types/pestel'

interface PestelState {
  factores: FactorPestel[]
  trmUsd: number
  loading: boolean
  error: string | null
  hydratedEmpresaId: string | null
  cargarDesdeNube: (empresaId: string, forzar?: boolean) => Promise<void>
  limpiarLocal: () => void
  setTrmUsd: (trm: number) => Promise<void>
  agregarFactor: (
    userId: string,
    empresaId: string,
    values: FactorFormValues,
  ) => Promise<FactorPestel>
  actualizarFactor: (
    userId: string,
    empresaId: string,
    id: string,
    values: FactorFormValues,
  ) => Promise<void>
  eliminarFactor: (empresaId: string, id: string) => Promise<void>
  borrarTodo: (empresaId: string) => Promise<void>
  cargarEjemplos: (userId: string, empresaId: string, sector: SectorId) => Promise<void>
}

export const usePestelStore = create<PestelState>((set, get) => ({
  factores: [],
  trmUsd: TRM_POR_DEFECTO,
  loading: false,
  error: null,
  hydratedEmpresaId: null,

  limpiarLocal: () =>
    set({
      factores: [],
      trmUsd: TRM_POR_DEFECTO,
      loading: false,
      error: null,
      hydratedEmpresaId: null,
    }),

  cargarDesdeNube: async (empresaId, forzar = false) => {
    if (!forzar && get().hydratedEmpresaId === empresaId && !get().loading) return
    // Si ya hay datos, refrescar en silencio para no bloquear AuthGate / desmontar la ruta.
    const silencioso = get().hydratedEmpresaId === empresaId
    if (!silencioso) set({ loading: true, error: null })
    try {
      const [factores, trm] = await Promise.all([
        fetchFactores(empresaId),
        fetchTrmEmpresa(empresaId),
      ])
      set({
        factores,
        trmUsd: trm ?? TRM_POR_DEFECTO,
        loading: false,
        hydratedEmpresaId: empresaId,
        error: null,
      })
    } catch (error) {
      set({
        loading: false,
        error: mensajeErrorSupabase(error),
        hydratedEmpresaId: empresaId,
      })
      throw error
    }
  },

  setTrmUsd: async (trmUsd) => {
    const valor = trmUsd > 0 ? trmUsd : TRM_POR_DEFECTO
    const empresaId = get().hydratedEmpresaId
    set({ trmUsd: valor })
    if (!empresaId) return
    try {
      await upsertTrmEmpresa(empresaId, valor)
    } catch (error) {
      set({ error: mensajeErrorSupabase(error) })
      throw error
    }
  },

  agregarFactor: async (userId, empresaId, values) => {
    const factor = await insertFactor(userId, empresaId, values)
    set((state) => ({ factores: [factor, ...state.factores] }))
    return factor
  },

  actualizarFactor: async (userId, empresaId, id, values) => {
    const { registrarDiffEdicion } = await import('@/lib/workflowApi')
    const previo = get().factores.find((f) => f.id === id)
    const actualizado = await updateFactor(userId, empresaId, id, values)
    if (previo) {
      await registrarDiffEdicion({
        userId,
        factorId: id,
        loteId: previo.loteId,
        antes: {
          categoria: previo.categoria,
          descripcion: previo.descripcion,
          tipo: previo.tipo,
          impacto: previo.impacto,
          plazo: previo.plazo,
          sector: previo.sector,
          valorCOP: previo.valorCOP,
        },
        despues: values,
      }).catch(() => undefined)
    }
    set((state) => ({
      factores: state.factores.map((factor) => (factor.id === id ? actualizado : factor)),
    }))
  },

  eliminarFactor: async (empresaId, id) => {
    await deleteFactor(empresaId, id)
    set((state) => ({
      factores: state.factores.filter((factor) => factor.id !== id),
    }))
  },

  borrarTodo: async (empresaId) => {
    await deleteAllFactores(empresaId)
    set({ factores: [] })
  },

  cargarEjemplos: async (userId, empresaId, sector) => {
    const factores = await replaceWithEjemplos(userId, empresaId, sector, FACTORES_EJEMPLO)
    set({ factores })
  },
}))
