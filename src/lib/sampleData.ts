import type { SectorId } from '@/lib/sectores'
import type { FactorPestel } from '@/types/pestel'

const BASE = new Date('2026-10-01T12:00:00.000Z').getTime()

function ejemplo(
  index: number,
  data: Omit<FactorPestel, 'id' | 'fechaRegistro' | 'esEjemplo'> & {
    sector?: SectorId
    valorCOP?: number
  },
): FactorPestel {
  return {
    sector: 'agro',
    ...data,
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
  ejemplo(17, {
    sector: 'hidrocarburos',
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 4_200_000_000,
    descripcion:
      'Retrasos en consultas previas y licencias ambientales que detienen la perforación de pozos de desarrollo en el Piedemonte llanero.',
  }),
  ejemplo(18, {
    sector: 'hidrocarburos',
    categoria: 'Ecológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 3_100_000_000,
    descripcion:
      'Mayores exigencias de descarbonización y compensación de emisiones que encarecen la operación de campos maduros.',
  }),
  ejemplo(19, {
    sector: 'hidrocarburos',
    categoria: 'Económico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 2_400_000_000,
    descripcion:
      'Precio internacional del crudo por encima del presupuesto base, con margen para acelerar mantenimiento y recobro mejorado.',
  }),
  ejemplo(20, {
    sector: 'energia',
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_600_000_000,
    descripcion:
      'Posible intervención tarifaria de la CREG que comprimiría el margen de comercialización de energía en el mercado regulado.',
  }),
  ejemplo(21, {
    sector: 'energia',
    categoria: 'Ecológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 2_800_000_000,
    descripcion:
      'Bajos aportes hídricos por El Niño que reducen la generación de las plantas propias y obligan a comprar energía cara en bolsa.',
  }),
  ejemplo(22, {
    sector: 'energia',
    categoria: 'Legal',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Comunidades energéticas y subastas de renovables que abren cupos para proyectos solares en el Caribe y los Llanos.',
  }),
  ejemplo(23, {
    sector: 'industria',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_350_000_000,
    descripcion:
      'Alza de la energía industrial y del acero importado que eleva el costo de transformación en las plantas del Eje Cafetero.',
  }),
  ejemplo(24, {
    sector: 'industria',
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    descripcion:
      'Reforma laboral que incrementaría el costo de turnos nocturnos y dominicales en líneas de producción continua.',
  }),
  ejemplo(25, {
    sector: 'industria',
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 480_000_000,
    descripcion:
      'Automatización y mantenimiento predictivo 4.0 para reducir paradas no programadas y scrap en el ensamble.',
  }),
  ejemplo(26, {
    sector: 'construccion',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 5_500_000_000,
    descripcion:
      'Tasas de crédito hipotecario elevadas que frenan la colocación de vivienda VIS y el cierre financiero de torres en obra.',
  }),
  ejemplo(27, {
    sector: 'construccion',
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_900_000_000,
    descripcion:
      'Demoras en licencias urbanísticas y ajustes al POT que dejan proyectos residenciales sin radicación de ventas.',
  }),
  ejemplo(28, {
    sector: 'construccion',
    categoria: 'Político',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 3_200_000_000,
    descripcion:
      'Plan nacional de vías terciarias y 5G que habilita contratos de infraestructura con mayor participación de regionales.',
  }),
  ejemplo(29, {
    sector: 'comercio',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 740_000_000,
    descripcion:
      'Caída del gasto de hogares por inflación de alimentos que reduce el ticket promedio en tiendas de conveniencia.',
  }),
  ejemplo(30, {
    sector: 'comercio',
    categoria: 'Social',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 510_000_000,
    descripcion:
      'Recuperación del turismo doméstico y de experiencias que impulsa ocupaciones y consumo en destinos de fin de semana.',
  }),
  ejemplo(31, {
    sector: 'comercio',
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Nuevas reglas de protección al consumidor y garantía extendida que aumentan el costo de postventa en retail electrónico.',
  }),
  ejemplo(32, {
    sector: 'financiero',
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 2_200_000_000,
    descripcion:
      'Hallazgos de la Superintendencia Financiera en SARLAFT y protección de datos que pueden derivar en órdenes y sanciones.',
  }),
  ejemplo(33, {
    sector: 'financiero',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_100_000_000,
    descripcion:
      'Ciclo de tasas altas del Banco de la República que encarece el fondeo y estrecha el margen de la cartera de consumo.',
  }),
  ejemplo(34, {
    sector: 'financiero',
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 650_000_000,
    descripcion:
      'Open finance y APIs de pagos inmediatos para lanzar productos embebidos con aliados de comercio y nómina.',
  }),
  ejemplo(35, {
    sector: 'tic',
    categoria: 'Tecnológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 1_450_000_000,
    descripcion:
      'Ciberataque a la nube de un proveedor crítico que interrumpiría plataformas SaaS y centros de contacto de clientes.',
  }),
  ejemplo(36, {
    sector: 'tic',
    categoria: 'Legal',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 380_000_000,
    descripcion:
      'Proyecto de regulación de inteligencia artificial y habeas data que exigiría rehacer modelos de perfilamiento comercial.',
  }),
  ejemplo(37, {
    sector: 'tic',
    categoria: 'Social',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Demanda de talento digital y formación corporativa en nubes e IA que abre líneas de servicios de conocimiento.',
  }),
  ejemplo(38, {
    sector: 'tic',
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 620_000_000,
    descripcion:
      'Retraso en la subasta y despliegue de espectro 5G que pospone proyectos de conectividad y edge computing con operadores.',
  }),
  ejemplo(39, {
    sector: 'tic',
    categoria: 'Político',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Programas de transformación digital del MinTIC y Colombia 4.0 que canalizan demanda de software y capacitación para pymes.',
  }),
  ejemplo(40, {
    sector: 'tic',
    categoria: 'Político',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Largo plazo',
    descripcion:
      'Inestabilidad en el presupuesto de gobierno digital que hace volátil la pipeline de contratos con entidades públicas.',
  }),
  ejemplo(41, {
    sector: 'tic',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 980_000_000,
    descripcion:
      'Devaluación del peso que encarece las suscripciones de nube, licencias y créditos de GPU facturados en dólares.',
  }),
  ejemplo(42, {
    sector: 'tic',
    categoria: 'Económico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 1_100_000_000,
    descripcion:
      'Nearshoring de desarrollo y centros de excelencia desde EE. UU. y España hacia equipos en Bogotá, Medellín y Cali.',
  }),
  ejemplo(43, {
    sector: 'tic',
    categoria: 'Económico',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Tasas de crédito corporativo altas que retrasan la inversión en renovación de data center y equipos de ciberseguridad.',
  }),
  ejemplo(44, {
    sector: 'tic',
    categoria: 'Social',
    tipo: 'Amenaza',
    impacto: 'Medio',
    plazo: 'Largo plazo',
    descripcion:
      'Brecha digital en regiones y escasez de perfil senior que eleva la rotación y el costo de reclutar desarrolladores.',
  }),
  ejemplo(45, {
    sector: 'tic',
    categoria: 'Social',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 340_000_000,
    descripcion:
      'Aceleración de la adopción digital en pymes y colegios que abre mercado para plataformas de colaboración y ciberhigiene.',
  }),
  ejemplo(46, {
    sector: 'tic',
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    valorCOP: 720_000_000,
    descripcion:
      'IA generativa aplicada a desarrollo y soporte que reduce tiempo de entrega y abre paquetes de copilotos para clientes.',
  }),
  ejemplo(47, {
    sector: 'tic',
    categoria: 'Tecnológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Mediano plazo',
    valorCOP: 510_000_000,
    descripcion:
      'Obsolescencia de plataformas on-premise y fin de soporte de sistemas core que obliga a migraciones no presupuestadas.',
  }),
  ejemplo(48, {
    sector: 'tic',
    categoria: 'Tecnológico',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Redes 5G y edge computing para IoT industrial que habilitan nuevos servicios de analítica en tiempo real.',
  }),
  ejemplo(49, {
    sector: 'tic',
    categoria: 'Ecológico',
    tipo: 'Amenaza',
    impacto: 'Alto',
    plazo: 'Corto plazo',
    descripcion:
      'Exigencias de eficiencia energética en centros de datos y presión por reportar huella de carbono de la nube.',
  }),
  ejemplo(50, {
    sector: 'tic',
    categoria: 'Legal',
    tipo: 'Oportunidad',
    impacto: 'Medio',
    plazo: 'Mediano plazo',
    descripcion:
      'Incentivos de economía naranja y beneficios tributarios para exportación de software que mejoran el margen de servicios.',
  }),
]
