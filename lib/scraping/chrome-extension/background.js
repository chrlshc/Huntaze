// Background Service Worker for Huntaze OnlyFans Manager
console.log('Huntaze Background Service Worker initialized');

// WebSocket connection to AWS
let ws = null;
let reconnectInterval = null;

// Connection state
const state = {
  isConnected: false,
  activeTab: null,
  userData: null
};

// Configuration WebSocket
const WEBSOCKET_CONFIG = {
  // En local pour développement
  local: 'ws://localhost:9222',
  // En production - AWS WebSocket URL
  production: 'wss://p6ng3p6f49.execute-api.us-west-1.amazonaws.com/production'
};

// Use production URL by default
const WEBSOCKET_URL = WEBSOCKET_CONFIG.production;

// Connect to WebSocket bridge
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  try {
    ws = new WebSocket(WEBSOCKET_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected to AWS');
      state.isConnected = true;
      clearInterval(reconnectInterval);
      
      // Send initial handshake with AWS API Gateway format
      ws.send(JSON.stringify({
        action: '$default',
        type: 'extension_connect',
        version: '2.0.0'
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleBridgeMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      state.isConnected = false;
      
      // Reconnect after 5 seconds
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectWebSocket, 5000);
      }
    };
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
  }
}

// Handle messages from bridge
function handleBridgeMessage(message) {
  switch (message.type) {
    case 'request_data':
      // Request data from content script
      chrome.tabs.query({ url: 'https://onlyfans.com/*' }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'get_data' }, (response) => {
            if (response && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                action: '$default',
                type: 'data_response',
                data: response
              }));
            }
          });
        }
      });
      break;
      
    case 'send_message':
      // Forward message request to content script
      chrome.tabs.query({ url: 'https://onlyfans.com/*' }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'send_message',
            message: message.content,
            fanId: message.fanId
          });
        }
      });
      break;
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message from content script:', request.type);
  
  // Forward to AWS WebSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      action: '$default',
      type: request.type,
      data: request.data,
      tabId: sender.tab?.id,
      timestamp: new Date().toISOString()
    }));
  }
  
  // Store latest data
  if (request.type === 'initial_data') {
    state.userData = request.data;
    chrome.storage.local.set({ userData: request.data });
  }
  
  // Handle real-time notifications
  switch (request.type) {
    case 'new_message':
      showNotification('New Message', `${request.data.fanUsername}: ${request.data.content}`);
      break;
      
    case 'fan_online':
      if (request.data.totalSpent > 100) { // VIP fan
        showNotification('VIP Online!', `${request.data.username} is online ($${request.data.totalSpent} spent)`);
      }
      break;
      
    case 'tip_received':
      showNotification('Tip Received!', `${request.data.fanUsername} tipped $${request.data.amount}`);
      break;
  }
  
  sendResponse({ received: true });
  return true;
});

// Show browser notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title,
    message,
    priority: 2
  });
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Huntaze extension installed');
    // Open onboarding page
    chrome.tabs.create({ url: 'https://app.huntaze.com/onboarding' });
  } else if (details.reason === 'update') {
    console.log('Huntaze extension updated to', details.previousVersion);
  }
});

// Monitor OnlyFans tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('onlyfans.com')) {
    state.activeTab = tabId;
    
    // Inject content script if needed (for dynamic pages)
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(err => {
      // Script already injected or page not ready
      console.log('Script injection skipped:', err.message);
    });
  }
});

// Handle tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.activeTab) {
    state.activeTab = null;
  }
});

// Periodic data sync (every 30 seconds)
setInterval(() => {
  if (state.activeTab && state.isConnected) {
    chrome.tabs.sendMessage(state.activeTab, { action: 'get_data' }, (response) => {
      if (response && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: '$default',
          type: 'periodic_update',
          data: response
        }));
      }
    });
  }
}, 30000);

// Initialize WebSocket connection
connectWebSocket();