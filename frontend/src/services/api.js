import axios from 'axios';

// Base URL for your backend server
// Automatically detects if running on Codespaces or localhost
const getApiBaseUrl = () => {
  if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    // Running on GitHub Codespaces
    return window.location.origin.replace(':3000', ':3001') + '/api';
  }
  // Running locally
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================
// MARKET DATA API
// =========================

export const getPrice = async (symbol) => {
  const response = await api.get(`/market/price/${symbol}`);
  return response.data;
};

export const getOrderBook = async (symbol, limit = 20) => {
  const response = await api.get(`/market/depth/${symbol}`, { params: { limit } });
  return response.data;
};

export const getKlines = async (symbol, interval = '1m', limit = 500) => {
  const response = await api.get(`/market/klines/${symbol}`, { params: { interval, limit } });
  return response.data;
};

export const getContracts = async () => {
  const response = await api.get('/market/contracts');
  return response.data;
};

export const getRecentTrades = async (symbol, limit = 100) => {
  const response = await api.get(`/market/trades/${symbol}`, { params: { limit } });
  return response.data;
};

// =========================
// ACCOUNT API
// =========================

export const getBalance = async () => {
  const response = await api.get('/account/balance');
  return response.data;
};

export const getPositions = async (symbol = null) => {
  const params = symbol ? { symbol } : {};
  const response = await api.get('/account/positions', { params });
  return response.data;
};

// =========================
// TRADING API
// =========================

export const placeMarketOrder = async (symbol, side, positionSide, quantity) => {
  const response = await api.post('/trade/market', {
    symbol,
    side,
    positionSide,
    quantity
  });
  return response.data;
};

export const placeLimitOrder = async (symbol, side, positionSide, quantity, price) => {
  const response = await api.post('/trade/limit', {
    symbol,
    side,
    positionSide,
    quantity,
    price
  });
  return response.data;
};

export const placeOrderWithRisk = async (orderData) => {
  /*
  orderData = {
    symbol: 'BTC-USDT',
    side: 'BUY',
    positionSide: 'LONG',
    quantity: 0.001,
    orderType: 'MARKET' or 'LIMIT',
    price: 50000,  // Required for LIMIT orders
    stopLoss: 49000,  // Optional
    takeProfit: 52000  // Optional
  }
  */
  const response = await api.post('/trade/order-with-risk', orderData);
  return response.data;
};

export const cancelOrder = async (symbol, orderId) => {
  const response = await api.delete('/trade/order', {
    data: { symbol, orderId }
  });
  return response.data;
};

export const cancelAllOrders = async (symbol) => {
  const response = await api.delete(`/trade/all-orders/${symbol}`);
  return response.data;
};

export const getOpenOrders = async (symbol = null) => {
  const params = symbol ? { symbol } : {};
  const response = await api.get('/trade/orders', { params });
  return response.data;
};

export const closePosition = async (symbol, positionSide) => {
  const response = await api.post('/trade/close-position', {
    symbol,
    positionSide
  });
  return response.data;
};

export const setLeverage = async (symbol, leverage, side) => {
  const response = await api.post('/trade/leverage', {
    symbol,
    leverage,
    side
  });
  return response.data;
};

// =========================
// WEBSOCKET CONNECTION
// =========================

export class TradingWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectInterval = 3000;
  }

  connect() {
    // Determine WebSocket URL based on environment
    let wsUrl;
    if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
      // Running on GitHub Codespaces - use secure WebSocket
      wsUrl = window.location.origin.replace('https://', 'wss://').replace(':3000', ':3001');
    } else {
      // Running locally
      wsUrl = 'ws://localhost:3001';
    }
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to trading server');
      if (this.listeners.connected) {
        this.listeners.connected.forEach(callback => callback());
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;
        
        if (this.listeners[type]) {
          this.listeners[type].forEach(callback => callback(data.data || data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from trading server. Reconnecting...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(symbol, channel, interval = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbol,
        channel,
        interval
      }));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default api;
