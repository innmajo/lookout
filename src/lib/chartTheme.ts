import { useThemeStore } from '@/store/useThemeStore'

export function useChartTheme() {
  const tema = useThemeStore((s) => s.tema)
  const styles = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement)

  return {
    tema,
    grid: styles?.getPropertyValue('--chart-grid').trim() || 'rgba(96, 165, 250, 0.16)',
    tick: styles?.getPropertyValue('--chart-tick').trim() || '#8B9CB3',
    tooltipBg: styles?.getPropertyValue('--tooltip-bg').trim() || '#0C101C',
    tooltipText: styles?.getPropertyValue('--tooltip-text').trim() || '#E8EEF7',
    tooltipBorder: styles?.getPropertyValue('--tooltip-border').trim() || 'rgba(96, 165, 250, 0.28)',
  }
}
