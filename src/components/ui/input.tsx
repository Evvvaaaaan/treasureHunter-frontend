import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`input ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
