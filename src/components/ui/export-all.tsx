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
export const DialogContent = ({ children, className = "" }: any) => (
  <div className="fixed inset-0" style={{ zIndex: 'var(--huntaze-z-index-modal, 50)' }}>
    {/* overlay */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

    {/* centerer (gutter viewport) */}
    <div className="relative flex min-h-full items-center justify-center p-4 sm:p-8">
      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          // largeur + marges écran (jamais collé)
          "w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-5xl",
          // hauteur + scroll
          "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden",
          // style
          "rounded-3xl bg-white shadow-2xl ring-1 ring-black/5",
          // IMPORTANT: p-0 ici, tu gères le padding dans header/body/footer
          "p-0",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  </div>
)
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
