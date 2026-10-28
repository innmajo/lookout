import type { FactorPestel } from '@/types/pestel'

const BASE = new Date('2026-10-01T12:00:00.000Z').getTime()

function ejemplo(
  index: number,
  data: Omit<FactorPestel, 'id' | 'fechaRegistro' | 'esEjemplo' | 'sector'> & {
    valorCOP?: number
  },
): FactorPestel {
  return {
    ...data,
    sector: 'agro',
    id: `ejemplo-${String(index).padStart(2, '0')}`,
    fechaRegistro: new Date(BASE + index * 86_400_000).toISOString(),
    esEjemplo: true,
  }
}

export const FACTORES_EJEMPLO: FactorPestel[] = [
  ejemplo(1, {
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_800_000_000,
    descripcion:
      'Posible cambio en los contingentes de importación de arroz blanco que presionaría el precio interno y la participación de las marcas locales en el mercado colombiano.',
  }),
  ejemplo(2, {
    categoria: 'Político',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Programas del Ministerio de Agricultura para fortalecer la agricultura familiar y la compra local de paddy en el Valle del Cauca y el norte del Cauca.',
  }),
  ejemplo(3, {
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 900_000_000,
    descripcion:
      'Paros y bloqueos de vías en el suroccidente que interrumpen el acopio de paddy y la distribución de arroz hacia Cali, Popayán y el Eje Cafetero.',
  }),
  ejemplo(4, {
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_200_000_000,
    descripcion:
      'Aumento del 20% en el precio de los fertilizantes nitrogenados, que eleva el costo de producción de los agricultores aliados y presiona el precio de compra del paddy.',
  }),
  ejemplo(5, {
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    descripcion:
      'Devaluación del peso colombiano que encarece empaques, maquinaria y refacciones importadas para el molino de Jamundí.',
  }),
  ejemplo(6, {
    categoria: 'Económico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 800_000_000,
    descripcion:
      'Crecimiento sostenido del consumo interno de arroz como alimento básico, con espacio para marcas regionales de confianza.',
  }),
  ejemplo(7, {
    categoria: 'Social',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Largo plazo',
    descripcion:
      'Mayor preferencia del consumidor vallecaucano por marcas de origen local y por historias de relación directa con agricultores.',
  }),
  ejemplo(8, {
    categoria: 'Social',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Largo plazo',
    descripcion:
      'Envejecimiento de la población agrícola en Jamundí y municipios vecinos, con menor relevo generacional en el cultivo de arroz.',
  }),
  ejemplo(9, {
    categoria: 'Social',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Interés de hogares urbanos por presentaciones prácticas (arroz precocido y empacado al vacío) y por información nutricional clara en el empaque.',
  }),
  ejemplo(10, {
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 220_000_000,
    descripcion:
      'Adopción de agricultura de precisión, sensores de humedad y drones para optimizar riego y fertilización en los lotes aliados.',
  }),
  ejemplo(11, {
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Trazabilidad digital de la cadena (lote–molino–retail) que permite demostrar origen y prácticas sostenibles ante grandes superficies.',
  }),
  ejemplo(12, {
    categoria: 'Ecológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 2_500_000_000,
    descripcion:
      'Fenómeno de El Niño con reducción de lluvias en el Valle del Cauca, que amenaza el rendimiento de la cosecha de paddy y la continuidad de molino.',
  }),
  ejemplo(13, {
    categoria: 'Ecológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    descripcion:
      'Presión sobre el recurso hídrico en distritos de riego del sur del Valle, con posibles restricciones de caudal para el cultivo de arroz.',
  }),
  ejemplo(14, {
    categoria: 'Ecológico',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Largo plazo',
    descripcion:
      'Demanda creciente de sellos verdes y de arroz producido con menor huella hídrica, alineada con las apuestas de sostenibilidad del sector.',
  }),
  ejemplo(15, {
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Corto plazo',
    descripcion:
      'Actualización de normas INVIMA de etiquetado nutricional y rotulado que obliga a rediseñar empaques de consumo en el corto plazo.',
  }),
  ejemplo(16, {
    categoria: 'Legal',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Incentivos tributarios y líneas Finagro para empresas agroindustriales que inviertan en eficiencia energética y economías de bajo carbono.',
  }),
]
