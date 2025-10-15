import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
}

// CSS 클래스 기반 buttonVariants - 다른 컴포넌트와의 호환성을 위해
export const buttonVariants = ({ 
  variant = "default", 
  size = "default", 
  className = "" 
}: { 
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
} = {}) => {
  const variantClass = 
    variant === "default" ? "btn-default" : 
    variant === "outline" ? "btn-outline" :
    variant === "ghost" ? "btn-ghost" :
    variant === "link" ? "btn-link" :
    variant === "destructive" ? "btn-destructive" :
    variant === "secondary" ? "btn-secondary" :
    "btn-default";
    
  const sizeClass = 
    size === "sm" ? "btn-sm" :
    size === "lg" ? "btn-lg" :
    size === "icon" ? "btn-icon" :
    "btn-default-size";

  return `btn ${variantClass} ${sizeClass} ${className}`.trim();
};

function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export { Button };
