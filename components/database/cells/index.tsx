'use client'

import { useState, useRef, useEffect } from 'react'
import { DatabaseProperty, useDatabaseStore, SelectOption } from '@/lib/store/database-store'
import { format, parseISO, isValid } from 'date-fns'
import { Check, X, Calendar, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CellProps {
  property: DatabaseProperty
  value: any
  rowId: string
  onChange: (value: any) => void
}

// Text Cell
export function TextCell({ value, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = () => {
    onChange(text)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setText(value || '')
            setIsEditing(false)
          }
        }}
        className="w-full px-2 py-1 bg-transparent outline-none border border-blue-500 rounded"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 cursor-text min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
    >
      {value || <span className="text-neutral-400">Empty</span>}
    </div>
  )
}

// Title Cell (like text but bold)
export function TitleCell({ value, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = () => {
    onChange(text)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setText(value || '')
            setIsEditing(false)
          }
        }}
        className="w-full px-2 py-1 bg-transparent outline-none border border-blue-500 rounded font-medium"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 cursor-text min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded font-medium"
    >
      {value || <span className="text-neutral-400">Untitled</span>}
    </div>
  )
}

// Number Cell
export function NumberCell({ value, onChange, property }: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [num, setNum] = useState(value?.toString() || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = () => {
    const parsed = parseFloat(num)
    onChange(isNaN(parsed) ? null : parsed)
    setIsEditing(false)
  }

  const formatNumber = (val: number) => {
    const fmt = property.config?.numberFormat || 'number'
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
      case 'percent':
        return new Intl.NumberFormat('en-US', { style: 'percent' }).format(val / 100)
      default:
        return val.toLocaleString()
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setNum(value?.toString() || '')
            setIsEditing(false)
          }
        }}
        className="w-full px-2 py-1 bg-transparent outline-none border border-blue-500 rounded"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 cursor-text min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded text-right"
    >
      {value != null ? formatNumber(value) : <span className="text-neutral-400">Empty</span>}
    </div>
  )
}

// Select Cell
export function SelectCell({ value, onChange, property }: CellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { selectOptions, addSelectOption } = useDatabaseStore()
  const [newOptionName, setNewOptionName] = useState('')

  // selectOptions is Record<string, SelectOption[]> keyed by property_id
  const options = selectOptions[property.id] || []
  const selectedOption = options.find(o => o.id === value)

  const handleSelect = (optionId: string) => {
    onChange(optionId)
    setIsOpen(false)
  }

  const handleAddOption = async () => {
    if (newOptionName.trim()) {
      const colors = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']
      const color = colors[options.length % colors.length]
      await addSelectOption(property.id, newOptionName.trim(), color)
      setNewOptionName('')
    }
  }

  const colorClasses: Record<string, string> = {
    gray: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200',
    red: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200',
    orange: 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    yellow: 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    green: 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200',
    blue: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    purple: 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    pink: 'bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
  }

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 cursor-pointer min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded flex items-center gap-1"
      >
        {selectedOption ? (
          <span className={cn('px-2 py-0.5 rounded text-sm', colorClasses[selectedOption.color])}>
            {selectedOption.name}
          </span>
        ) : (
          <span className="text-neutral-400">Select</span>
        )}
        <ChevronDown className="h-4 w-4 ml-auto text-neutral-400" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className={cn('px-2 py-0.5 rounded', colorClasses[option.color])}>
                  {option.name}
                </span>
                {option.id === value && <Check className="h-4 w-4 ml-auto" />}
              </button>
            ))}
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-1 pt-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="Add option..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddOption()
                  }}
                />
                <button onClick={handleAddOption} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Multi-Select Cell
export function MultiSelectCell({ value, onChange, property }: CellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { selectOptions, addSelectOption } = useDatabaseStore()
  const [newOptionName, setNewOptionName] = useState('')

  // selectOptions is Record<string, SelectOption[]> keyed by property_id
  const options = selectOptions[property.id] || []
  const selectedValues = Array.isArray(value) ? value : []
  const selectedOptions = options.filter(o => selectedValues.includes(o.id))

  const handleToggle = (optionId: string) => {
    if (selectedValues.includes(optionId)) {
      onChange(selectedValues.filter(v => v !== optionId))
    } else {
      onChange([...selectedValues, optionId])
    }
  }

  const handleAddOption = async () => {
    if (newOptionName.trim()) {
      const colors = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']
      const color = colors[options.length % colors.length]
      await addSelectOption(property.id, newOptionName.trim(), color)
      setNewOptionName('')
    }
  }

  const colorClasses: Record<string, string> = {
    gray: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200',
    red: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200',
    orange: 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    yellow: 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    green: 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200',
    blue: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    purple: 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    pink: 'bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
  }

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 cursor-pointer min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded flex items-center gap-1 flex-wrap"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span key={option.id} className={cn('px-2 py-0.5 rounded text-sm', colorClasses[option.color])}>
              {option.name}
            </span>
          ))
        ) : (
          <span className="text-neutral-400">Select</span>
        )}
        <ChevronDown className="h-4 w-4 ml-auto text-neutral-400" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleToggle(option.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <div className={cn(
                  'w-4 h-4 border rounded flex items-center justify-center',
                  selectedValues.includes(option.id) ? 'bg-blue-600 border-blue-600' : 'border-neutral-300 dark:border-neutral-600'
                )}>
                  {selectedValues.includes(option.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={cn('px-2 py-0.5 rounded', colorClasses[option.color])}>
                  {option.name}
                </span>
              </button>
            ))}
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-1 pt-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="Add option..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddOption()
                  }}
                />
                <button onClick={handleAddOption} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Date Cell
export function DateCell({ value, onChange }: CellProps) {
  const [isOpen, setIsOpen] = useState(false)

  const dateValue = value ? (typeof value === 'string' ? parseISO(value) : new Date(value)) : null
  const isValidDate = dateValue && isValid(dateValue)

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 cursor-pointer min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded flex items-center gap-1"
      >
        <Calendar className="h-4 w-4 text-neutral-400" />
        {isValidDate ? (
          <span>{format(dateValue, 'MMM d, yyyy')}</span>
        ) : (
          <span className="text-neutral-400">Select date</span>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3">
            <input
              type="date"
              value={isValidDate ? format(dateValue, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
                setIsOpen(false)
              }}
              className="bg-transparent outline-none"
            />
            {isValidDate && (
              <button
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-600"
              >
                Clear date
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Checkbox Cell
export function CheckboxCell({ value, onChange }: CellProps) {
  return (
    <div
      onClick={() => onChange(!value)}
      className="w-full px-2 py-1 cursor-pointer min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded flex items-center justify-center"
    >
      <div className={cn(
        'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
        value ? 'bg-blue-600 border-blue-600' : 'border-neutral-300 dark:border-neutral-600'
      )}>
        {value && <Check className="h-3 w-3 text-white" />}
      </div>
    </div>
  )
}

// URL Cell
export function UrlCell({ value, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = () => {
    onChange(url)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setUrl(value || '')
            setIsEditing(false)
          }
        }}
        className="w-full px-2 py-1 bg-transparent outline-none border border-blue-500 rounded"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 cursor-text min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
    >
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-neutral-400">Add URL</span>
      )}
    </div>
  )
}

// Email Cell
export function EmailCell({ value, onChange }: CellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = () => {
    onChange(email)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setEmail(value || '')
            setIsEditing(false)
          }
        }}
        className="w-full px-2 py-1 bg-transparent outline-none border border-blue-500 rounded"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 cursor-text min-h-[28px] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
    >
      {value ? (
        <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 dark:text-blue-400">
          {value}
        </a>
      ) : (
        <span className="text-neutral-400">Add email</span>
      )}
    </div>
  )
}

// Cell Renderer
export function CellRenderer({ property, value, rowId, onChange }: CellProps) {
  const props = { property, value, rowId, onChange }

  switch (property.type) {
    case 'title':
      return <TitleCell {...props} />
    case 'text':
      return <TextCell {...props} />
    case 'number':
      return <NumberCell {...props} />
    case 'select':
      return <SelectCell {...props} />
    case 'multi_select':
      return <MultiSelectCell {...props} />
    case 'date':
      return <DateCell {...props} />
    case 'checkbox':
      return <CheckboxCell {...props} />
    case 'url':
      return <UrlCell {...props} />
    case 'email':
      return <EmailCell {...props} />
    default:
      return <TextCell {...props} />
  }
}
