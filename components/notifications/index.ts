// Stub component for notifications
export const NotificationCenter = () => null;
export const NotificationBadge = () => null;
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => children;
export const useNotifications = () => ({ 
  notifications: [], 
  markAsRead: () => {},
  showNotification: (_: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => {},
  showContextualNotification: (_: string, __: Record<string, any>) => {},
});
