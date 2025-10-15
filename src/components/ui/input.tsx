import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input({ className = "", type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`input ${className}`}
      {...props}
    />
  );
}

export { Input };
