import * as React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      className={`label ${className}`}
      {...props}
    />
  );
}

export { Label };
