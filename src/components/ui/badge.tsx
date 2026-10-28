import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-border bg-foreground/10 text-foreground',
        critico: 'border-critico/30 bg-critico/15 text-critico',
        atencion: 'border-atencion/30 bg-atencion/15 text-atencion',
        monitorear: 'border-monitorear/30 bg-monitorear/15 text-monitorear',
        amenaza: 'border-critico/30 bg-critico/15 text-critico',
        oportunidad: 'border-monitorear/30 bg-monitorear/15 text-monitorear',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
