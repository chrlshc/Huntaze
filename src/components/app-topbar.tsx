"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
};

type Props = {
  title?: string;
  primaryAction?: Action;
  secondaryActions?: Action[];
  rightSlot?: React.ReactNode;
  showSaveBar?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
};

export default function AppTopbar({
  title,
  primaryAction,
  secondaryActions = [],
  rightSlot,
  showSaveBar = false,
  onSave,
  onDiscard,
}: Props) {
  const prefersReduced = useReducedMotion();

  const ActionButton = ({ action, variant = "primary" }: { action: Action; variant?: "primary" | "secondary" }) => {
    const content = (
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        {action.icon ? <span aria-hidden className="w-4 h-4 inline-flex">{action.icon}</span> : null}
        {action.label}
      </span>
    );
    const base =
      variant === "primary"
        ? "px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
        : "px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";
    if (action.href) {
      return (
        <motion.span whileHover={prefersReduced ? undefined : { scale: 1.02 }} whileTap={prefersReduced ? undefined : { scale: 0.98 }}>
          <Link href={action.href} aria-label={action.ariaLabel || action.label} className={base}>
            {content}
          </Link>
        </motion.span>
      );
    }
    return (
      <motion.button
        type="button"
        onClick={action.onClick}
        className={base}
        whileHover={prefersReduced ? undefined : { scale: 1.02 }}
        whileTap={prefersReduced ? undefined : { scale: 0.98 }}
        aria-label={action.ariaLabel || action.label}
      >
        {content}
      </motion.button>
    );
  };

  return (
    <header className="sticky top-0 z-50 sticky-header-blur">
      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0 }}
        animate={prefersReduced ? undefined : { opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {title ? (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white" role="heading" aria-level={1}>
                  {title}
                </h1>
              ) : null}
              {secondaryActions?.length ? (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  {secondaryActions.map((a, i) => (
                    <ActionButton key={i} action={a} variant="secondary" />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {primaryAction ? <ActionButton action={primaryAction} /> : null}
              {rightSlot}
            </div>
          </div>
        </div>
      </motion.div>
      {showSaveBar ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="w-full border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
        >
          <div className="px-6 lg:px-8 py-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm"
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
