import React from 'react';

// Export simple placeholder components
export const Card = ({ children, className = "" }: any) => <div className={`rounded-lg border p-4 ${className}`}>{children}</div>
export const CardHeader = ({ children, className = "" }: any) => <div className={`pb-4 ${className}`}>{children}</div>
export const CardTitle = ({ children, className = "" }: any) => <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
export const CardContent = ({ children, className = "" }: any) => <div className={className}>{children}</div>
export const CardDescription = ({ children, className = "" }: any) => <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
export const CardFooter = ({ children, className = "" }: any) => <div className={`pt-4 ${className}`}>{children}</div>

export const Alert = ({ children, className = "", variant = "default" }: any) => {
  const variantClasses = variant === "destructive" ? "border-red-500 bg-red-50" : "border-gray-300";
  return <div className={`rounded-lg border p-4 ${variantClasses} ${className}`}>{children}</div>
}
export const AlertDescription = ({ children, className = "" }: any) => <p className={`text-sm ${className}`}>{children}</p>
export const AlertTitle = ({ children, className = "" }: any) => <h4 className={`font-medium ${className}`}>{children}</h4>

export const Progress = ({ value = 0, className = "" }: any) => (
  <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div className="h-full bg-primary transition-all" style={{ width: `${value}%` }}></div>
  </div>
)

export const Input = ({ className = "", ...props }: any) => (
  <input className={`w-full border rounded px-3 py-2 outline-none focus:ring ${className}`} {...props} />
)

export const Textarea = ({ className = "", rows = 3, ...props }: any) => (
  <textarea rows={rows} className={`w-full border rounded px-3 py-2 outline-none focus:ring ${className}`} {...props} />
)

export const Separator = ({ className = "" }: any) => (
  <hr className={`border-t border-gray-200 my-2 ${className}`} />
)

export const Switch = ({ checked = false, onCheckedChange, className = "", ...props }: any) => (
  <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
    <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} {...props} />
    <span className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
      <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </span>
  </label>
)

export const Button = ({ children, className = "", variant = "default", ...props }: any) => {
  const variantClasses = variant === "outline" ? "btn-outline" : "btn-primary";
  return <button className={`px-4 py-2 rounded-md ${variantClasses} ${className}`} {...props}>{children}</button>
}

export const Badge = ({ children, className = "", variant = "default" }: any) => {
  const variantClasses = variant === "destructive" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-1 text-xs rounded-full ${variantClasses} ${className}`}>{children}</span>
}

export const Select = ({ children, ...props }: any) => <select className="border rounded px-2 py-1" {...props}>{children}</select>
export const SelectTrigger = ({ children, ...props }: any) => <button className="border rounded px-2 py-1 w-full text-left" {...props}>{children}</button>
export const SelectContent = ({ children }: any) => <div>{children}</div>
export const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>

export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const TabsList = ({ children, className = "" }: any) => <div className={`flex space-x-2 ${className}`}>{children}</div>
export const TabsTrigger = ({ children, className = "", ...props }: any) => <button className={`px-4 py-2 ${className}`} {...props}>{children}</button>
export const TabsContent = ({ children, ...props }: any) => <div {...props}>{children}</div>

export const Dialog = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const DialogTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const DialogContent = ({ children, className = "" }: any) => <div className={`fixed inset-0 flex items-center justify-center p-4 ${className}`}><div className="bg-white rounded-lg p-6 max-w-md w-full">{children}</div></div>
export const DialogHeader = ({ children, className = "" }: any) => <div className={`mb-4 ${className}`}>{children}</div>
export const DialogTitle = ({ children, className = "" }: any) => <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
export const DialogDescription = ({ children, className = "" }: any) => <p className={`text-gray-600 ${className}`}>{children}</p>
export const DialogFooter = ({ children, className = "" }: any) => <div className={`mt-4 ${className}`}>{children}</div>

export const Slider = ({ value = [50], onValueChange, className = "", ...props }: any) => (
  <input 
    type="range" 
    value={value[0]} 
    onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
    className={`w-full ${className}`} 
    {...props} 
  />
)
