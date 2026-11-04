import type { Rol } from '@/lib/roles'
import type { SectorId } from '@/lib/sectores'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nombre: string
          nit: string
          direccion: string | null
          ciudad: string | null
          sector: SectorId
          trm_usd: number
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          nit: string
          direccion?: string | null
          ciudad?: string | null
          sector: SectorId
          trm_usd?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          nit?: string
          direccion?: string | null
          ciudad?: string | null
          sector?: SectorId
          trm_usd?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          id: string
          empresa_id: string | null
          rol: Rol
          activo: boolean
          nombre: string | null
          apellido: string | null
          cedula: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          empresa_id?: string | null
          rol: Rol
          activo?: boolean
          nombre?: string | null
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string | null
          rol?: Rol
          activo?: boolean
          nombre?: string | null
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      factores: {
        Row: {
          id: string
          user_id: string
          empresa_id: string
          creado_por: string | null
          categoria: string
          descripcion: string
          tipo: string
          impacto: string
          plazo: string
          sector: string
          valor_cop: number | null
          fecha_registro: string
          es_ejemplo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          empresa_id: string
          creado_por?: string | null
          categoria: string
          descripcion: string
          tipo: string
          impacto: string
          plazo: string
          sector: string
          valor_cop?: number | null
          fecha_registro?: string
          es_ejemplo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          empresa_id?: string
          creado_por?: string | null
          categoria?: string
          descripcion?: string
          tipo?: string
          impacto?: string
          plazo?: string
          sector?: string
          valor_cop?: number | null
          fecha_registro?: string
          es_ejemplo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type FactorRow = Database['public']['Tables']['factores']['Row']
export type FactorInsert = Database['public']['Tables']['factores']['Insert']
export type PerfilRow = Database['public']['Tables']['perfiles']['Row']
export type EmpresaRow = Database['public']['Tables']['empresas']['Row']

export interface DatosEmpresaRegistro {
  nombreEmpresa: string
  nit: string
  sector: SectorId
  responsableNombre: string
  responsableApellido: string
  responsableCedula: string
  direccion: string
  ciudad: string
}

export interface SesionContexto {
  perfil: PerfilRow
  empresa: EmpresaRow | null
}
