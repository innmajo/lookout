import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useThemeStore } from '@/store/useThemeStore'

function Toaster({ ...props }: ToasterProps) {
  const tema = useThemeStore((s) => s.tema)

  return (
    <Sonner
      theme={tema}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast font-sans glass text-foreground',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-foreground/10 text-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
