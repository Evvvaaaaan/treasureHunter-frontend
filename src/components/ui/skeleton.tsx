import * as React from "react";

function Skeleton({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={`skeleton ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
