import * as React from "react";

function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={`card ${className}`}
      {...props}
    />
  );
}

function CardHeader({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={`card-header ${className}`}
      {...props}
    />
  );
}

function CardTitle({ className = "", ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="card-title"
      className={`card-title ${className}`}
      {...props}
    />
  );
}

function CardDescription({ className = "", ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={`card-description ${className}`}
      {...props}
    />
  );
}

function CardAction({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={`card-action ${className}`}
      {...props}
    />
  );
}

function CardContent({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={`card-content ${className}`}
      {...props}
    />
  );
}

function CardFooter({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={`card-footer ${className}`}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
