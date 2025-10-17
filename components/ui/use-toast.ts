type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = (options: ToastOptions) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[toast]', options);
    }
  };

  return { toast };
}

export const toast = (options: ToastOptions) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[toast]', options);
  }
};
