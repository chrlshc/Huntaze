import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const subscribeToPush = async () => {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) return null;

      // Wait for service worker to be ready
      const sw = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
          'BKd0ZV5m5kYeZv5NdBPx4fdPQj5HLJwM6UaUPK6pVvG9Lz_VXLwPYTFvIZpJcK7HlT_Km-VnQq0au5IDgGUC0Cc'
        )
      });

      setSubscription(subscription);
      
      // Send subscription to backend
      await saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;
    
    try {
      await subscription.unsubscribe();
      await removeSubscription(subscription);
      setSubscription(null);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const removeSubscription = async (subscription: PushSubscription) => {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  };

  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    try {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options
      });
    } catch (error) {
      // Fallback for mobile where Notification constructor might not work
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options
        });
      }
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    subscribeToPush,
    unsubscribeFromPush,
    showLocalNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}