// Injection script - Runs in OnlyFans page context
(function() {
  'use strict';
  
  console.log('Huntaze injection script loaded');
  
  // Intercept OnlyFans API responses
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    return originalFetch.apply(this, args)
      .then(response => {
        // Clone response to read it without consuming
        const cloned = response.clone();
        
        // Intercept specific API endpoints
        if (url.includes('/api2/v2/')) {
          cloned.json().then(data => {
            // Send intercepted data to content script
            window.postMessage({
              type: 'HUNTAZE_API_RESPONSE',
              url,
              method: options?.method || 'GET',
              data,
              timestamp: Date.now()
            }, '*');
            
            // Special handling for specific endpoints
            if (url.includes('/users/list')) {
              handleFansList(data);
            } else if (url.includes('/stories/')) {
              handleStories(data);
            } else if (url.includes('/chats/')) {
              handleChats(data);
            } else if (url.includes('/subscriptions/')) {
              handleSubscriptions(data);
            } else if (url.includes('/payouts/')) {
              handlePayouts(data);
            }
          }).catch(() => {
            // Not JSON response, ignore
          });
        }
        
        return response;
      });
  };
  
  // Intercept XMLHttpRequest for older API calls
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    xhr.open = function(method, url, ...args) {
      xhr._huntazeUrl = url;
      xhr._huntazeMethod = method;
      return originalOpen.apply(xhr, [method, url, ...args]);
    };
    
    xhr.send = function(body) {
      xhr.addEventListener('load', function() {
        if (xhr._huntazeUrl?.includes('/api2/v2/') && xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            window.postMessage({
              type: 'HUNTAZE_XHR_RESPONSE',
              url: xhr._huntazeUrl,
              method: xhr._huntazeMethod,
              data,
              timestamp: Date.now()
            }, '*');
          } catch (e) {
            // Not JSON, ignore
          }
        }
      });
      
      return originalSend.apply(xhr, [body]);
    };
    
    return xhr;
  };
  
  // Access OnlyFans Vue/Nuxt store if available
  function accessOFStore() {
    // Try to find Vue instance
    const app = document.querySelector('#app')?.__vue__ || 
                document.querySelector('[data-v-app]')?.__vue__;
    
    if (app && app.$store) {
      const state = app.$store.state;
      window.postMessage({
        type: 'HUNTAZE_STORE_DATA',
        data: {
          user: state.auth?.user,
          stats: state.profile?.stats,
          earnings: state.earnings,
          fans: state.fans?.list
        }
      }, '*');
    }
    
    // Try Nuxt store
    if (window.__NUXT__) {
      window.postMessage({
        type: 'HUNTAZE_NUXT_DATA',
        data: window.__NUXT__.state
      }, '*');
    }
  }
  
  // WebSocket interception for real-time events
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = new Proxy(OriginalWebSocket, {
    construct(target, args) {
      const ws = new target(...args);
      
      // Monitor WebSocket messages
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Forward interesting events
          if (data.type === 'message' || data.type === 'tip' || 
              data.type === 'subscription' || data.type === 'online_status') {
            window.postMessage({
              type: 'HUNTAZE_WS_MESSAGE',
              wsUrl: ws.url,
              data,
              timestamp: Date.now()
            }, '*');
          }
        } catch (e) {
          // Not JSON, ignore
        }
      });
      
      return ws;
    }
  });
  
  // Handlers for specific data types
  function handleFansList(data) {
    if (data.list) {
      const enrichedFans = data.list.map(fan => ({
        id: fan.id,
        username: fan.username,
        name: fan.name,
        totalSpent: calculateTotalSpent(fan),
        lastSeen: fan.lastSeen,
        isOnline: fan.isOnline,
        isVIP: fan.listsStates?.includes('vip'),
        hasActiveSubscription: fan.subscribedBy,
        subscriptionPrice: fan.subscribePrice,
        tipStats: fan.tipStats,
        messageStats: fan.messageStats
      }));
      
      window.postMessage({
        type: 'HUNTAZE_FANS_ENRICHED',
        data: enrichedFans
      }, '*');
    }
  }
  
  function calculateTotalSpent(fan) {
    let total = 0;
    if (fan.tipStats?.totalAmount) total += fan.tipStats.totalAmount;
    if (fan.messageStats?.paidAmount) total += fan.messageStats.paidAmount;
    if (fan.subscribeStats?.totalAmount) total += fan.subscribeStats.totalAmount;
    return total;
  }
  
  function handleChats(data) {
    if (data.list) {
      const unreadChats = data.list.filter(chat => chat.unreadMessagesCount > 0);
      window.postMessage({
        type: 'HUNTAZE_UNREAD_CHATS',
        data: unreadChats
      }, '*');
    }
  }
  
  function handleSubscriptions(data) {
    window.postMessage({
      type: 'HUNTAZE_SUBSCRIPTIONS',
      data: {
        active: data.active,
        expired: data.expired,
        trial: data.trial
      }
    }, '*');
  }
  
  function handleStories(data) {
    // Track story views and engagement
    window.postMessage({
      type: 'HUNTAZE_STORIES',
      data: data
    }, '*');
  }
  
  function handlePayouts(data) {
    window.postMessage({
      type: 'HUNTAZE_PAYOUTS',
      data: data
    }, '*');
  }
  
  // Initialize store access after page load
  let storeCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      accessOFStore();
      
      // Check periodically for dynamic updates
      setInterval(accessOFStore, 30000);
      clearInterval(storeCheckInterval);
    }
  }, 1000);
  
  // Expose helper functions for content script
  window.HUNTAZE = {
    getStore: accessOFStore,
    sendMessage: (userId, message, price) => {
      // Direct API call using OnlyFans auth
      return fetch(`/api2/v2/messages/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          price: price || 0
        })
      });
    },
    getFanDetails: (userId) => {
      return fetch(`/api2/v2/users/${userId}`).then(r => r.json());
    }
  };
  
})();