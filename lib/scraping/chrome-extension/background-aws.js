// Background Service Worker - AWS Production Version
console.log('Huntaze Background Service Worker (AWS) initialized');

// Configuration
const CONFIG = {
  // En dev: ws://localhost:9222
  // En prod: wss://your-api-id.execute-api.region.amazonaws.com/production
  WEBSOCKET_URL: 'WEBSOCKET_URL_PLACEHOLDER', // Sera remplacé après déploiement
  RECONNECT_INTERVAL: 5000,
  PING_INTERVAL: 30000
};

// WebSocket connection
let ws = null;
let reconnectInterval = null;
let pingInterval = null;

// Connection state
const state = {
  isConnected: false,
  activeTab: null,
  userData: null,
  extensionId: null,
  userId: null
};

// Generate unique extension ID
function getExtensionId() {
  if (!state.extensionId) {
    state.extensionId = chrome.runtime.id + '_' + Date.now();
    chrome.storage.local.set({ extensionId: state.extensionId });
  }
  return state.extensionId;
}

// Get user ID from storage or OnlyFans page
async function getUserId() {
  if (state.userId) return state.userId;
  
  // Try to get from storage
  const stored = await chrome.storage.local.get('userId');
  if (stored.userId) {
    state.userId = stored.userId;
    return state.userId;
  }
  
  // Try to get from active OnlyFans tab
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  if (tabs.length > 0) {
    const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'get_user_id' });
    if (response?.userId) {
      state.userId = response.userId;
      chrome.storage.local.set({ userId: response.userId });
      return response.userId;
    }
  }
  
  return null;
}

// Connect to AWS WebSocket
async function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  try {
    const extensionId = getExtensionId();
    const userId = await getUserId();
    
    if (!userId) {
      console.log('No user ID available, retrying...');
      setTimeout(connectWebSocket, 10000);
      return;
    }
    
    // Construct WebSocket URL with query params
    const wsUrl = `${CONFIG.WEBSOCKET_URL}?extensionId=${extensionId}&userId=${userId}`;
    
    console.log('Connecting to AWS WebSocket...');
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected to AWS');
      state.isConnected = true;
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      
      // Start ping to keep connection alive
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'ping',
            timestamp: Date.now()
          }));
        }
      }, CONFIG.PING_INTERVAL);
      
      // Send initial data
      requestInitialData();
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleAWSMessage(message);
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
      
      clearInterval(pingInterval);
      pingInterval = null;
      
      // Reconnect after delay
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectWebSocket, CONFIG.RECONNECT_INTERVAL);
      }
    };
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    
    // Retry after delay
    setTimeout(connectWebSocket, CONFIG.RECONNECT_INTERVAL);
  }
}

// Handle messages from AWS
function handleAWSMessage(message) {
  console.log('AWS message:', message.command);
  
  switch (message.command) {
    case 'request_data':
      requestDataFromTabs(message.data?.dataTypes || ['all']);
      break;
      
    case 'send_message':
      sendMessageToFan(message.data);
      break;
      
    case 'get_fan_details':
      getFanDetails(message.data.fanId);
      break;
      
    case 'trigger_action':
      triggerAction(message.data);
      break;
  }
}

// Request initial data from OnlyFans tabs
async function requestInitialData() {
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'get_data' }, (response) => {
        if (response) {
          sendToAWS('initial_data', response);
        }
      });
    });
  }
}

// Request specific data types
async function requestDataFromTabs(dataTypes) {
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'get_data',
      dataTypes 
    }, (response) => {
      if (response) {
        sendToAWS('data_response', response);
      }
    });
  });
}

// Send message to fan
async function sendMessageToFan(data) {
  const { fanId, message, price } = data;
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'send_message',
      fanId,
      message,
      price
    }, (response) => {
      sendToAWS('message_sent', {
        fanId,
        success: response?.success || false,
        error: response?.error
      });
    });
  }
}

// Get fan details
async function getFanDetails(fanId) {
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'get_fan_details',
      fanId
    }, (response) => {
      sendToAWS('fan_details', {
        fanId,
        data: response
      });
    });
  }
}

// Trigger custom action
async function triggerAction(data) {
  const { action, params } = data;
  const tabs = await chrome.tabs.query({ url: 'https://onlyfans.com/*' });
  
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'trigger_action',
      customAction: action,
      params
    }, (response) => {
      sendToAWS('action_result', {
        action,
        result: response
      });
    });
  }
}

// Send data to AWS
function sendToAWS(type, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      action: 'data',
      type,
      data,
      timestamp: Date.now(),
      extensionId: getExtensionId(),
      userId: state.userId
    }));
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message from content script:', request.type);
  
  // Forward to AWS
  sendToAWS(request.type, request.data);
  
  // Store latest data
  if (request.type === 'initial_data') {
    state.userData = request.data;
    chrome.storage.local.set({ userData: request.data });
  }
  
  // Handle real-time notifications
  switch (request.type) {
    case 'new_message':
    case 'realtime_message':
      showNotification('New Message', `${request.data.fanUsername}: ${request.data.content || request.data.text}`);
      break;
      
    case 'fan_online':
      if (request.data.totalSpent > 100 || request.data.isVIP) {
        showNotification('VIP Online!', `${request.data.username} is online ($${request.data.totalSpent} spent)`);
      }
      break;
      
    case 'tip_received':
    case 'realtime_tip':
      showNotification('Tip Received!', `${request.data.fanUsername || request.data.fromUsername} tipped $${request.data.amount}`);
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
    
    // Initialize extension ID
    getExtensionId();
    
    // Try to connect immediately
    connectWebSocket();
  }
});

// Monitor OnlyFans tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('onlyfans.com')) {
    state.activeTab = tabId;
    
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(() => {
      // Already injected
    });
    
    // Try to get user ID if we don't have it
    if (!state.userId) {
      getUserId();
    }
  }
});

// Periodic data sync (every minute)
setInterval(() => {
  if (state.activeTab && state.isConnected) {
    requestDataFromTabs(['fans', 'earnings', 'messages']);
  }
}, 60000);

// Load configuration on startup
chrome.storage.local.get(['websocketUrl', 'extensionId', 'userId'], (result) => {
  if (result.websocketUrl) {
    CONFIG.WEBSOCKET_URL = result.websocketUrl;
  }
  if (result.extensionId) {
    state.extensionId = result.extensionId;
  }
  if (result.userId) {
    state.userId = result.userId;
  }
  
  // Initialize WebSocket connection
  connectWebSocket();
});