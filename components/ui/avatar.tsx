import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

Avatar.displayName = "Avatar";

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>((props, ref) => (
  <img ref={ref} {...props} />
));

AvatarImage.displayName = "AvatarImage";

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ children, ...props }, ref) => (
    <span ref={ref} {...props}>
      {children}
    </span>
  )
);

AvatarFallback.displayName = "AvatarFallback";

export default Avatar;
