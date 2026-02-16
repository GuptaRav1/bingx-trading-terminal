const WebSocket = require('ws');
const EventEmitter = require('events');

class BingXWebSocket extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;
    this.subscriptions = new Set();
    this.isConnected = false;
    this.baseURL = 'wss://open-api-swap.bingx.com/swap-market';
  }

  // Connect to WebSocket
  connect() {
    try {
      this.ws = new WebSocket(this.baseURL);

      this.ws.on('open', () => {
        console.log('WebSocket connected to BingX');
        this.isConnected = true;
        this.emit('connected');
        
        // Resubscribe to previous subscriptions
        this.subscriptions.forEach(sub => {
          this.ws.send(sub);
        });
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      });

      // Send ping every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ ping: Date.now() }));
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    // Handle pong response
    if (message.pong) {
      return;
    }

    // Handle subscription confirmation
    if (message.code === 0 && message.msg === 'success') {
      console.log('Subscription confirmed');
      return;
    }

    // Handle different data types
    if (message.dataType) {
      switch (message.dataType) {
        case 'BTC-USDT@trade':
          this.emit('trade', message.data);
          break;
        case 'BTC-USDT@depth':
          this.emit('depth', message.data);
          break;
        case 'BTC-USDT@ticker':
          this.emit('ticker', message.data);
          break;
        case 'BTC-USDT@kline':
          this.emit('kline', message.data);
          break;
        default:
          // Emit generic message event
          this.emit('message', message);
      }
    }
  }

  // Subscribe to trades
  subscribeTrades(symbol) {
    const sub = JSON.stringify({
      id: `${symbol}_trades`,
      dataType: `${symbol}@trade`
    });
    
    this.subscriptions.add(sub);
    if (this.isConnected) {
      this.ws.send(sub);
    }
  }

  // Subscribe to order book depth
  subscribeDepth(symbol, level = 20) {
    const sub = JSON.stringify({
      id: `${symbol}_depth`,
      dataType: `${symbol}@depth${level}`
    });
    
    this.subscriptions.add(sub);
    if (this.isConnected) {
      this.ws.send(sub);
    }
  }

  // Subscribe to ticker (24hr stats)
  subscribeTicker(symbol) {
    const sub = JSON.stringify({
      id: `${symbol}_ticker`,
      dataType: `${symbol}@ticker`
    });
    
    this.subscriptions.add(sub);
    if (this.isConnected) {
      this.ws.send(sub);
    }
  }

  // Subscribe to klines/candlesticks
  subscribeKline(symbol, interval) {
    // interval: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d, 3d, 1w, 1M
    const sub = JSON.stringify({
      id: `${symbol}_kline_${interval}`,
      dataType: `${symbol}@kline_${interval}`
    });
    
    this.subscriptions.add(sub);
    if (this.isConnected) {
      this.ws.send(sub);
    }
  }

  // Unsubscribe from a data stream
  unsubscribe(dataType) {
    const unsub = JSON.stringify({
      id: 'unsub',
      dataType: dataType
    });
    
    if (this.isConnected) {
      this.ws.send(unsub);
    }
    
    // Remove from subscriptions set
    this.subscriptions.forEach(sub => {
      if (sub.includes(dataType)) {
        this.subscriptions.delete(sub);
      }
    });
  }

  // Schedule reconnection
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, this.reconnectInterval);
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.subscriptions.clear();
    this.isConnected = false;
  }
}

module.exports = BingXWebSocket;
