import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClass = variant === "default" ? "badge-default" :
                       variant === "secondary" ? "badge-secondary" :
                       variant === "destructive" ? "badge-destructive" :
                       variant === "outline" ? "badge-outline" :
                       "badge-default";

  return (
    <span
      className={`badge ${variantClass} ${className}`}
      {...props}
    />
  );
}

export { Badge };
