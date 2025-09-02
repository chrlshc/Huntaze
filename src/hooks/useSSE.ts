'use client'

import { useEffect } from 'react'
import { showToast, showMessageToast } from '@/components/Toast'
import { usePushNotifications } from './usePushNotifications'

export function useSSE() {
  const { showLocalNotification, permission } = usePushNotifications();
  
  useEffect(() => {
    let es: EventSource | null = null

    const connect = () => {
      try {
        es = new EventSource('/api/events')

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data?.type === 'new-message') {
              // Notify listeners (e.g., bottom nav badges)
              window.dispatchEvent(new CustomEvent('new-message', { detail: data }))
              // Haptics (VIP pattern if any)
              if ('vibrate' in navigator) {
                const isVip = !!data?.message?.isVip
                navigator.vibrate(isVip ? [200, 100, 200] : 200)
              }
              // Contextual toast
              const attachments = Array.isArray(data?.message?.attachments) ? data.message.attachments : []
              const hasImage = attachments.some((a: any) => a.type === 'image')
              const hasFile = attachments.some((a: any) => a.type !== 'image')
              const toastText = data?.message?.text
                || (hasImage ? '📷 Photo' : hasFile ? '📎 Document' : '')
              if (data?.message?.fanName && toastText) {
                showMessageToast({
                  fanName: data.message.fanName,
                  fanAvatar: data.message.fanAvatar,
                  text: toastText,
                })
              } else {
                showToast('New message received!')
              }
              // Optional sound
              try {
                const audio = new Audio('/notification.mp3')
                audio.volume = 0.5
                audio.play().catch(() => {})
              } catch {}
              
              // Push notification if enabled and app is in background
              if (permission === 'granted' && document.hidden) {
                showLocalNotification(
                  `New message from ${data.message.fanName}`,
                  {
                    body: toastText,
                    icon: data.message.fanAvatar || '/icon-192x192.png',
                    tag: `message-${data.message.id}`,
                    data: {
                      conversationId: data.conversationId,
                      url: `/messages/${data.conversationId}`
                    }
                  }
                );
              }
            } else if (data?.type === 'typing-start' || data?.type === 'typing-stop') {
              // Forward typing events to listeners (conversation view)
              window.dispatchEvent(new CustomEvent(data.type, { detail: data }))
            }
          } catch (e) {
            console.error('SSE parse error:', e)
          }
        }

        es.onerror = () => {
          es?.close()
          // Try to reconnect after a short delay
          setTimeout(connect, 5000)
        }
      } catch (e) {
        // fallback silently
        console.warn('SSE connection failed, will retry', e)
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      es?.close()
    }
  }, [])
}
