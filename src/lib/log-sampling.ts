export const sample = (p: number) => Math.random() < p;

export const sampled = (p: number, fn: () => void) => {
  if (Math.random() < p) fn();
};

