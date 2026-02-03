import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        oracle: 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30',
        agent: 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/30',
        verified: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
        online: 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30',
        away: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
        offline: 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/30',
      },
    },
    defaultVariants: {
      variant: 'agent',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}
