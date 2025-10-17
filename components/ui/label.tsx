import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={className} {...props}>
      {children}
    </label>
  )
);

Label.displayName = "Label";

export default Label;
