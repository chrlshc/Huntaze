import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Human‑readable bytes formatter (e.g., 1.2 MB)
export function formatBytes(bytes?: number | null, digits: number = 1): string {
  try {
    if (bytes === undefined || bytes === null || isNaN(bytes as number)) return '';
    const b = Number(bytes);
    if (b < 1024) return `${b} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let i = -1;
    let value = b;
    do {
      value /= 1024;
      i++;
    } while (value >= 1024 && i < units.length - 1);
    return `${value.toFixed(digits)} ${units[i]}`;
  } catch {
    return '';
  }
}

export function formatCurrency(
  amount?: number | null,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  } catch {
    return `${currency} ${amount.toFixed ? amount.toFixed(2) : amount}`;
  }
}
