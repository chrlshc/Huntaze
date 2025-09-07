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
    <div className="h-full bg-blue-600 transition-all" style={{ width: `${value}%` }}></div>
  </div>
)

export const Button = ({ children, className = "", variant = "default", ...props }: any) => {
  const variantClasses = variant === "outline" ? "border border-gray-300" : "bg-blue-600 text-white";
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

export const Input = ({ className = "", ...props }: any) => (
  <input className={`border rounded px-3 py-2 ${className}`} {...props} />
)
