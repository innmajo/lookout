export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          trm_usd: number
          nombre_empresa: string | null
          nit: string | null
          responsable_nombre: string | null
          responsable_apellido: string | null
          responsable_cedula: string | null
          direccion: string | null
          ciudad: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          trm_usd?: number
          nombre_empresa?: string | null
          nit?: string | null
          responsable_nombre?: string | null
          responsable_apellido?: string | null
          responsable_cedula?: string | null
          direccion?: string | null
          ciudad?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trm_usd?: number
          nombre_empresa?: string | null
          nit?: string | null
          responsable_nombre?: string | null
          responsable_apellido?: string | null
          responsable_cedula?: string | null
          direccion?: string | null
          ciudad?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      factores: {
        Row: {
          id: string
          user_id: string
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

export interface DatosEmpresaRegistro {
  nombreEmpresa: string
  nit: string
  responsableNombre: string
  responsableApellido: string
  responsableCedula: string
  direccion: string
  ciudad: string
}
