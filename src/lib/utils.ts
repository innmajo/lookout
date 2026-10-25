import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fechaHoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nombreArchivoExport(ext: string): string {
  return `Analisis_PESTEL_${fechaHoyIso()}.${ext}`
}

export function fechaLarga(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
