import * as React from "react";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className={`inline-flex items-center gap-2 ${className ?? ''}`}>
    <input type="checkbox" ref={ref} {...props} />
    <span className="text-sm">{props['aria-label']}</span>
  </label>
));

Switch.displayName = "Switch";

export default Switch;
