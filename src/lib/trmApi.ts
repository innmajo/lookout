import { TRM_POR_DEFECTO } from '@/lib/dinero'

const TRM_API_URL = 'https://open.er-api.com/v6/latest/USD'

export type TrmMercado = {
  valor: number
  actualizadoEn: string | null
  fuente: string
}

/** COP por 1 USD desde ExchangeRate-API (open, sin clave). */
export async function fetchTrmMercado(): Promise<TrmMercado> {
  const res = await fetch(TRM_API_URL)
  if (!res.ok) throw new Error(`No se pudo consultar la TRM (${res.status})`)

  const data = (await res.json()) as {
    result?: string
    rates?: { COP?: number }
    time_last_update_utc?: string
  }

  if (data.result !== 'success') {
    throw new Error('La API de tasas no devolvió un resultado válido')
  }

  const cop = data.rates?.COP
  if (typeof cop !== 'number' || !Number.isFinite(cop) || cop <= 0) {
    throw new Error('La API no trajo una tasa COP válida')
  }

  return {
    valor: Math.round(cop * 100) / 100,
    actualizadoEn: data.time_last_update_utc ?? null,
    fuente: 'Exchange Rate API',
  }
}

export async function fetchTrmMercadoOFallback(): Promise<TrmMercado> {
  try {
    return await fetchTrmMercado()
  } catch {
    return {
      valor: TRM_POR_DEFECTO,
      actualizadoEn: null,
      fuente: 'valor de respaldo',
    }
  }
}
