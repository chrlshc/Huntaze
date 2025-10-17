// OnlyFans Content Script - Extracts real-time data
console.log('Huntaze OnlyFans Manager loaded');

// Inject script into page context
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type && event.data.type.startsWith('HUNTAZE_')) {
    console.log('Received from inject:', event.data.type);
    
    // Forward to background script with AWS format
    chrome.runtime.sendMessage({
      type: 'scraped-data',
      dataType: event.data.type.toLowerCase().replace('huntaze_', ''),
      creatorId: window.location.pathname.split('/')[1] || 'unknown',
      data: event.data.data,
      timestamp: event.data.timestamp
    });
    
    // Handle specific data types
    switch (event.data.type) {
      case 'HUNTAZE_FANS_ENRICHED':
        // Store enriched fans data
        window.huntazeFansData = event.data.data;
        break;
      case 'HUNTAZE_UNREAD_CHATS':
        // Process unread chats
        handleUnreadChats(event.data.data);
        break;
      case 'HUNTAZE_WS_MESSAGE':
        // Handle real-time WebSocket messages
        handleRealtimeMessage(event.data.data);
        break;
    }
  }
});

// Inject on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
} else {
  injectScript();
}

// OnlyFans 2025 Real Selectors
const SELECTORS = {
  profile: {
    username: '.g-user-name, [data-test="profile-name"]',
    subscribers: '.b-tabs__nav__link:has(.b-svg-icon_fans) .b-tabs__nav__text__counter',
    likes: '.b-tabs__nav__text__counter_likes',
    posts: '.b-tabs__nav__link[href*="/posts"] .b-tabs__nav__text__counter',
    price: '.b-tabs__nav__text__price'
  },
  fans: {
    container: '.b-fans__list, .m-fans-list',
    fanItem: '.b-fans__item, .m-fans-list__item',
    username: '.g-user-name',
    totalSpent: '.m-fans-list-item__spent',
    vipBadge: '.m-label__text--vip',
    onlineStatus: '.m-status-indicator--online',
    expiry: '.m-fans-list-item__expires',
    userId: '[data-user]'
  },
  messages: {
    container: '.b-chats__list',
    thread: '.b-chat__item',
    unread: '.b-chat__item--unread',
    username: '.g-user-name',
    lastMessage: '.b-chat__item__message',
    timestamp: '.b-chat__item__time',
    tipIcon: '.b-svg-icon_tips',
    tipAmount: '.b-chat__item__tip-amount'
  },
  earnings: {
    today: '.b-earnings__value--today',
    week: '.b-earnings__value--week', 
    month: '.b-earnings__value--month',
    pending: '.b-balance__pending .b-balance__amount'
  },
  vault: {
    container: '.b-photos, .b-vault',
    item: '.b-photos__item',
    price: '.b-photos__item__price',
    sales: '.b-photos__item__sales',
    locked: '.b-photos__item--locked'
  }
};

// Helper to parse numbers with K/M suffixes
function parseCount(text) {
  if (!text) return 0;
  const clean = text.replace(/[^0-9.KM]/gi, '').toUpperCase();
  if (clean.includes('K')) return parseFloat(clean) * 1000;
  if (clean.includes('M')) return parseFloat(clean) * 1000000;
  return parseInt(clean) || 0;
}

// Data extraction functions
const extractors = {
  // Get profile stats
  getProfile: () => {
    const stats = {
      username: document.querySelector(SELECTORS.profile.username)?.textContent?.trim() || '',
      subscribers: parseCount(document.querySelector(SELECTORS.profile.subscribers)?.textContent || '0'),
      likes: parseCount(document.querySelector(SELECTORS.profile.likes)?.textContent || '0'),
      posts: parseCount(document.querySelector(SELECTORS.profile.posts)?.textContent || '0'),
      price: parseFloat(document.querySelector(SELECTORS.profile.price)?.textContent?.replace(/[^0-9.]/g, '') || '0')
    };
    return stats;
  },

  // Get fans list with spending data
  getFans: () => {
    const fans = [];
    document.querySelectorAll(SELECTORS.fans.fanItem).forEach(fanEl => {
      const userId = fanEl.getAttribute('data-user') || 
                    fanEl.querySelector('a[href*="/"]')?.href?.match(/\/(\d+)/)?.[1];
      
      const spentText = fanEl.querySelector(SELECTORS.fans.totalSpent)?.textContent || '$0';
      const totalSpent = parseFloat(spentText.replace(/[$,]/g, '').match(/\d+\.?\d*/)?.[0] || '0');
      
      fans.push({
        id: userId,
        username: fanEl.querySelector(SELECTORS.fans.username)?.textContent?.trim(),
        isOnline: !!fanEl.querySelector(SELECTORS.fans.onlineStatus),
        totalSpent,
        isVIP: !!fanEl.querySelector(SELECTORS.fans.vipBadge),
        subscriptionExpiry: fanEl.querySelector(SELECTORS.fans.expiry)?.textContent?.trim()
      });
    });
    return fans.filter(f => f.id && f.username);
  },

  // Get unread messages
  getMessages: () => {
    const messages = [];
    document.querySelectorAll(SELECTORS.messages.unread).forEach(msgEl => {
      const userId = msgEl.getAttribute('data-user') || 
                    msgEl.querySelector('a[href*="/"]')?.href?.match(/\/(\d+)/)?.[1];
      
      const tipText = msgEl.querySelector(SELECTORS.messages.tipAmount)?.textContent || '';
      const tipAmount = parseFloat(tipText.replace(/[$,]/g, '') || '0');
      
      messages.push({
        id: msgEl.getAttribute('data-id'),
        fanId: userId,
        fanUsername: msgEl.querySelector(SELECTORS.messages.username)?.textContent?.trim(),
        content: msgEl.querySelector(SELECTORS.messages.lastMessage)?.textContent?.trim(),
        timestamp: msgEl.querySelector(SELECTORS.messages.timestamp)?.textContent?.trim(),
        hasTipped: !!msgEl.querySelector(SELECTORS.messages.tipIcon),
        tipAmount
      });
    });
    return messages.filter(m => m.fanId);
  },

  // Get earnings data
  getEarnings: () => {
    const parseAmount = (selector) => {
      const text = document.querySelector(selector)?.textContent || '$0';
      return parseFloat(text.replace(/[$,]/g, '').match(/\d+\.?\d*/)?.[0] || '0');
    };
    
    return {
      today: parseAmount(SELECTORS.earnings.today),
      week: parseAmount(SELECTORS.earnings.week),
      month: parseAmount(SELECTORS.earnings.month),
      pending: parseAmount(SELECTORS.earnings.pending)
    };
  },

  // Get vault content performance
  getVaultContent: () => {
    const content = [];
    document.querySelectorAll(SELECTORS.vault.item).forEach(item => {
      const priceText = item.querySelector(SELECTORS.vault.price)?.textContent || '$0';
      const price = parseFloat(priceText.replace(/[$,]/g, '') || '0');
      
      const salesText = item.querySelector(SELECTORS.vault.sales)?.textContent || '0';
      const sales = parseInt(salesText.match(/\d+/)?.[0] || '0');
      
      content.push({
        id: item.getAttribute('data-id') || item.querySelector('a')?.href?.match(/\/([^/]+)$/)?.[1],
        type: item.classList.contains('b-photos__item--video') ? 'video' : 'photo',
        price,
        sales,
        revenue: price * sales,
        isLocked: !!item.querySelector(SELECTORS.vault.locked)
      });
    });
    return content;
  }
};

// Real-time monitoring
// Handle unread chats from API
function handleUnreadChats(chats) {
  chats.forEach(chat => {
    if (chat.unreadMessagesCount > 0) {
      chrome.runtime.sendMessage({
        type: 'unread_chat',
        data: {
          userId: chat.userId,
          username: chat.user?.username,
          unreadCount: chat.unreadMessagesCount,
          lastMessage: chat.lastMessage?.text,
          hasTip: chat.lastMessage?.price > 0
        }
      });
    }
  });
}

// Handle real-time WebSocket messages
function handleRealtimeMessage(data) {
  if (data.type === 'message') {
    chrome.runtime.sendMessage({
      type: 'realtime_message',
      data: {
        fromUserId: data.fromUser?.id,
        fromUsername: data.fromUser?.username,
        text: data.text,
        price: data.price,
        mediaCount: data.media?.length || 0
      }
    });
  } else if (data.type === 'tip') {
    chrome.runtime.sendMessage({
      type: 'realtime_tip',
      data: {
        amount: data.amount,
        fromUsername: data.fromUser?.username,
        message: data.message
      }
    });
  }
}

const monitor = {
  // Watch for new messages
  watchMessages: () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newMessages = Array.from(mutation.addedNodes).filter(node => 
            node.nodeType === 1 && node.matches('[data-name="message-thread"]')
          );
          
          newMessages.forEach(msgEl => {
            chrome.runtime.sendMessage({
              type: 'new_message',
              data: {
                fanId: msgEl.getAttribute('data-user-id'),
                fanUsername: msgEl.querySelector('[data-name="username"]')?.textContent,
                content: msgEl.querySelector('[data-name="last-message"]')?.textContent
              }
            });
          });
        }
      });
    });

    const messageContainer = document.querySelector('[data-name="messages-container"]');
    if (messageContainer) {
      observer.observe(messageContainer, { childList: true, subtree: true });
    }
  },

  // Watch for fans coming online
  watchOnlineFans: () => {
    setInterval(() => {
      // Use real selectors
      document.querySelectorAll(SELECTORS.fans.onlineStatus).forEach(indicator => {
        const fanEl = indicator.closest(SELECTORS.fans.fanItem);
        if (fanEl && !fanEl.hasAttribute('data-notified')) {
          fanEl.setAttribute('data-notified', 'true');
          
          // Use enriched data if available
          const userId = fanEl.getAttribute('data-user') || 
                        fanEl.querySelector('a[href*="/"]')?.href?.match(/\/(\d+)/)?.[1];
          
          const enrichedFan = window.huntazeFansData?.find(f => f.id === userId);
          
          chrome.runtime.sendMessage({
            type: 'fan_online',
            data: {
              fanId: userId,
              username: fanEl.querySelector(SELECTORS.fans.username)?.textContent?.trim(),
              totalSpent: enrichedFan?.totalSpent || parseFloat(fanEl.querySelector(SELECTORS.fans.totalSpent)?.textContent?.replace(/[$,]/g, '') || '0'),
              isVIP: enrichedFan?.isVIP || !!fanEl.querySelector(SELECTORS.fans.vipBadge)
            }
          });
        }
      });
    }, 5000); // Check every 5 seconds
  },

  // Watch for tips
  watchTips: () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const tipNotifications = Array.from(mutation.addedNodes).filter(node =>
          node.nodeType === 1 && node.textContent?.includes('tipped')
        );
        
        tipNotifications.forEach(notification => {
          chrome.runtime.sendMessage({
            type: 'tip_received',
            data: {
              amount: parseFloat(notification.textContent?.match(/\$(\d+(?:\.\d+)?)/)?.[1] || '0'),
              fanUsername: notification.textContent?.match(/(\w+) tipped/)?.[1]
            }
          });
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
};

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'get_data':
      const data = {
        profile: extractors.getProfile(),
        fans: extractors.getFans(),
        messages: extractors.getMessages(),
        earnings: extractors.getEarnings(),
        content: extractors.getVaultContent()
      };
      sendResponse(data);
      break;
      
    case 'send_message':
      // Simulate sending a message
      const messageInput = document.querySelector('[data-name="message-input"]');
      const sendButton = document.querySelector('[data-name="send-button"]');
      if (messageInput && sendButton) {
        messageInput.value = request.message;
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        sendButton.click();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Message interface not found' });
      }
      break;
  }
  return true;
});

// Initialize monitoring
setTimeout(() => {
  monitor.watchMessages();
  monitor.watchOnlineFans();
  monitor.watchTips();
  
  // Send initial data
  chrome.runtime.sendMessage({
    type: 'initial_data',
    data: {
      profile: extractors.getProfile(),
      fans: extractors.getFans(),
      messages: extractors.getMessages(),
      earnings: extractors.getEarnings()
    }
  });
}, 2000);