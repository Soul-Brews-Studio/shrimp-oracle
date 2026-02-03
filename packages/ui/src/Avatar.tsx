import { type HTMLAttributes } from 'react'
import { cn, getAvatarGradient } from './utils'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
}

export function Avatar({ name, size = 'md', className, ...props }: AvatarProps) {
  const gradient = getAvatarGradient(name)
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white',
        gradient,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initial}
    </div>
  )
}
