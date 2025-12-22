import * as React from "react";

export function MajordomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* Top hat minimal, style "line icon" */}
      <path
        d="M6.2 8.2h7.6c.4 0 .7.3.7.7v4.2c0 .4-.3.7-.7.7H6.2c-.4 0-.7-.3-.7-.7V8.9c0-.4.3-.7.7-.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.1 8.2V6.6c0-1 .8-1.8 1.8-1.8h2.2c1 0 1.8.8 1.8 1.8v1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.2 13.8c0 .9 2.6 1.6 5.8 1.6s5.8-.7 5.8-1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
