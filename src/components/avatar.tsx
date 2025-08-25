'use client'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Generate a consistent color based on name
  const colors = [
    'from-purple-400 to-purple-600',
    'from-violet-400 to-violet-600', 
    'from-indigo-400 to-indigo-600',
    'from-fuchsia-400 to-fuchsia-600',
  ]
  
  const colorIndex = name.charCodeAt(0) % colors.length
  const gradientColor = colors[colorIndex]

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white font-semibold ${className}`}
    >
      {initials}
    </div>
  )
}