import * as React from "react";

function Table({ className = "", ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="table-container">
      <table
        data-slot="table"
        className={`table ${className}`}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className = "", ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={`table-header ${className}`}
      {...props}
    />
  );
}

function TableBody({ className = "", ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={`table-body ${className}`}
      {...props}
    />
  );
}

function TableFooter({ className = "", ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={`table-footer ${className}`}
      {...props}
    />
  );
}

function TableRow({ className = "", ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={`table-row ${className}`}
      {...props}
    />
  );
}

function TableHead({ className = "", ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={`table-head ${className}`}
      {...props}
    />
  );
}

function TableCell({ className = "", ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={`table-cell ${className}`}
      {...props}
    />
  );
}

function TableCaption({
  className = "",
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={`table-caption ${className}`}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
