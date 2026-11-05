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
          debe_cambiar_password: boolean
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
          debe_cambiar_password?: boolean
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
          debe_cambiar_password?: boolean
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
          estado: string
          lote_id: string | null
          version: number
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
          estado?: string
          lote_id?: string | null
          version?: number
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
          estado?: string
          lote_id?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      informes: {
        Row: {
          id: string
          empresa_id: string
          version: number
          texto: string
          factores: Json
          metadatos: Json
          creado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          version: number
          texto: string
          factores: Json
          metadatos: Json
          creado_por: string
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          version?: number
          texto?: string
          factores?: Json
          metadatos?: Json
          creado_por?: string
          created_at?: string
        }
        Relationships: []
      }
      lotes: {
        Row: {
          id: string
          empresa_id: string
          creado_por: string
          titulo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          creado_por: string
          titulo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          creado_por?: string
          titulo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lote_mensajes: {
        Row: {
          id: string
          lote_id: string
          autor_id: string
          mensaje: string
          canal: string
          solo_lectura_roles: string[]
          created_at: string
        }
        Insert: {
          id?: string
          lote_id: string
          autor_id: string
          mensaje: string
          canal: string
          solo_lectura_roles?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          lote_id?: string
          autor_id?: string
          mensaje?: string
          canal?: string
          solo_lectura_roles?: string[]
          created_at?: string
        }
        Relationships: []
      }
      factor_historial: {
        Row: {
          id: string
          factor_id: string
          lote_id: string | null
          usuario_id: string | null
          accion: string
          estado_anterior: string | null
          estado_nuevo: string | null
          diff: Json | null
          comentario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          factor_id: string
          lote_id?: string | null
          usuario_id?: string | null
          accion: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          diff?: Json | null
          comentario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          factor_id?: string
          lote_id?: string | null
          usuario_id?: string | null
          accion?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          diff?: Json | null
          comentario?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          id: string
          usuario_id: string
          empresa_id: string | null
          tipo: string
          titulo: string
          cuerpo: string | null
          enlace: string | null
          leida: boolean
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          empresa_id?: string | null
          tipo: string
          titulo: string
          cuerpo?: string | null
          enlace?: string | null
          leida?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          empresa_id?: string | null
          tipo?: string
          titulo?: string
          cuerpo?: string | null
          enlace?: string | null
          leida?: boolean
          created_at?: string
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
