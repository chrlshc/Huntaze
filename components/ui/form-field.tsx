'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type BaseProps = {
  id?: string
  name: string
  label: string
  required?: boolean
  help?: string
  error?: string
  className?: string
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & {
  as?: 'input'
}

type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: 'textarea'
}

type SelectOption = { value: string; label: string }
type SelectProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  as: 'select'
  options: SelectOption[]
}

type Props = InputProps | TextareaProps | SelectProps

export default function FormField(props: Props) {
  const { id, name, label, required, help, error, className, as = 'input', ...rest } = props as any
  const fieldId = id || name
  const describedBy = error ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined
  const baseClasses = cn('input-base', error && 'input-error')

  return (
    <div className={cn('mb-4', className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
        {label}{required ? <span className="text-red-600"> *</span> : null}
      </label>

      {as === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={baseClasses}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === 'select' ? (
        <select
          id={fieldId}
          name={name}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={baseClasses}
          {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(props as SelectProps).options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          name={name}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={baseClasses}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {help && !error && (
        <p id={`${fieldId}-help`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
