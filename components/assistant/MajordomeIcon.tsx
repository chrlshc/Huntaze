import * as React from "react";

export default function MajordomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Tête */}
      <path
        d="M12 3.5c3 0 5.5 2.2 5.5 5.1 0 1.7-.8 3.3-2 4.2-.5.4-.8 1-.8 1.6V16c0 1.7-1.3 3-2.7 3s-2.7-1.3-2.7-3v-1.6c0-.6-.3-1.2-.8-1.6-1.2-.9-2-2.5-2-4.2C6.5 5.7 9 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Lunettes */}
      <path
        d="M7.2 10.6c.5-.7 1.4-1.1 2.3-1.1.9 0 1.8.4 2.3 1.1m2.7 0c.5-.7 1.4-1.1 2.3-1.1.9 0 1.8.4 2.3 1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M11.8 10.6h.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Nœud papillon */}
      <path
        d="M9.2 19.3l2.1-1.1c.4-.2.9-.2 1.3 0l2.1 1.1-1.6 1.1c-.6.4-1.4.4-2 0l-1.6-1.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
