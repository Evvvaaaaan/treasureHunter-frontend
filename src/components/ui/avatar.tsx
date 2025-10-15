import * as React from "react";

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function Avatar({
  className = "",
  children,
  ...props
}: AvatarProps) {
  return (
    <div className={`avatar ${className}`} {...props}>
      {children}
    </div>
  );
}

interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

function AvatarImage({
  className = "",
  ...props
}: AvatarImageProps) {
  return (
    <img className={`avatar-image ${className}`} {...props} />
  );
}

interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function AvatarFallback({
  className = "",
  ...props
}: AvatarFallbackProps) {
  return (
    <div
      className={`avatar-fallback ${className}`}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };