import { calcularPrioridad } from '@/lib/prioridad'
import { SECTORES } from '@/lib/sectores'
import type { EmpresaRow } from '@/types/database'
import type { FactorPestel } from '@/types/pestel'

const WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_URL?.trim()
/** En local el navegador no puede llamar a n8n (CORS). Vite reenvía este path. */
const WEBHOOK_LOCAL = '/api/n8n-informe'

export function informeN8nConfigurado(): boolean {
  return Boolean(WEBHOOK)
}

export interface InformeN8nResultado {
  url?: string
  texto?: string
}

function comoTexto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined
}

function leerResultado(data: unknown): InformeN8nResultado {
  const nodo = Array.isArray(data) ? data[0] : data
  if (typeof nodo === 'string') return { texto: nodo }
  if (!nodo || typeof nodo !== 'object') return {}
  const obj = nodo as Record<string, unknown>
  const body =
    obj.body && typeof obj.body === 'object' ? (obj.body as Record<string, unknown>) : undefined
  const factores = Array.isArray(body?.factores) ? body.factores.length : undefined
  const empresa = comoTexto(body?.empresa)
  const recibido =
    factores !== undefined
      ? `n8n recibió ${factores} factor${factores === 1 ? '' : 'es'}${empresa ? ` de ${empresa}` : ''}.`
      : undefined
  return {
    url: comoTexto(obj.url) ?? comoTexto(obj.link) ?? comoTexto(obj.docUrl) ?? comoTexto(obj.documento),
    texto:
      comoTexto(obj.informe) ??
      comoTexto(obj.texto) ??
      comoTexto(obj.analisis) ??
      comoTexto(obj.resumen) ??
      comoTexto(obj.message) ??
      recibido,
  }
}

export async function solicitarInformeN8n(
  empresa: EmpresaRow,
  factores: FactorPestel[],
): Promise<InformeN8nResultado> {
  if (!WEBHOOK) {
    throw new Error('Falta VITE_N8N_WEBHOOK_URL')
  }

  const respuesta = await fetch(import.meta.env.DEV ? WEBHOOK_LOCAL : WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresa: empresa.nombre,
      empresaId: empresa.id,
      nit: empresa.nit,
      sector: empresa.sector,
      sectorNombre: SECTORES[empresa.sector]?.nombre ?? empresa.sector,
      ciudad: empresa.ciudad,
      generadoEn: new Date().toISOString(),
      factores: factores.map((factor) => {
        const prioridad = calcularPrioridad(factor)
        return {
          categoria: factor.categoria,
          tipo: factor.tipo,
          impacto: factor.impacto,
          plazo: factor.plazo,
          descripcion: factor.descripcion,
          puntaje: prioridad.puntaje,
          nivel: prioridad.nivel,
          valorCOP: factor.valorCOP ?? null,
        }
      }),
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!respuesta.ok) {
    const detalle = (await respuesta.text()).trim()
    let mensaje = `n8n respondió ${respuesta.status}`
    try {
      const json = JSON.parse(detalle) as { message?: string }
      if (json.message) mensaje = json.message
    } catch {
      if (detalle) mensaje = detalle
    }
    throw new Error(mensaje)
  }

  const tipo = respuesta.headers.get('content-type') ?? ''
  if (tipo.includes('application/json')) {
    return leerResultado(await respuesta.json())
  }
  const texto = (await respuesta.text()).trim()
  return texto ? { texto } : {}
}
