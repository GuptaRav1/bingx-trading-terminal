require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const BingXAPI = require('./bingxAPI');
const BingXWebSocket = require('./websocket');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize BingX API
const bingxAPI = new BingXAPI(
  process.env.BINGX_API_KEY,
  process.env.BINGX_API_SECRET
);

// Initialize BingX WebSocket
const bingxWS = new BingXWebSocket();

// Store connected clients
const clients = new Set();

// WebSocket connection for frontend
wss.on('connection', (ws) => {
  console.log('Frontend client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle subscription requests from frontend
      if (data.type === 'subscribe') {
        const { symbol, channel } = data;
        
        switch (channel) {
          case 'trades':
            bingxWS.subscribeTrades(symbol);
            break;
          case 'depth':
            bingxWS.subscribeDepth(symbol);
            break;
          case 'ticker':
            bingxWS.subscribeTicker(symbol);
            break;
          case 'kline':
            bingxWS.subscribeKline(symbol, data.interval || '1m');
            break;
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Frontend client disconnected');
    clients.delete(ws);
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to trading terminal' }));
});

// Broadcast data to all connected clients
function broadcastToClients(data) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Setup BingX WebSocket event handlers
bingxWS.on('trade', (data) => {
  broadcastToClients({ type: 'trade', data });
});

bingxWS.on('depth', (data) => {
  broadcastToClients({ type: 'depth', data });
});

bingxWS.on('ticker', (data) => {
  broadcastToClients({ type: 'ticker', data });
});

bingxWS.on('kline', (data) => {
  broadcastToClients({ type: 'kline', data });
});

// Connect to BingX WebSocket
bingxWS.connect();

// =========================
// REST API ROUTES
// =========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =========================
// MARKET DATA ROUTES
// =========================

// Get current price
app.get('/api/market/price/:symbol', async (req, res) => {
  try {
    const data = await bingxAPI.getPrice(req.params.symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order book
app.get('/api/market/depth/:symbol', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const data = await bingxAPI.getOrderBook(req.params.symbol, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get klines/candlestick data
app.get('/api/market/klines/:symbol', async (req, res) => {
  try {
    const { interval, limit } = req.query;
    const data = await bingxAPI.getKlines(req.params.symbol, interval || '1m', limit || 500);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all contracts
app.get('/api/market/contracts', async (req, res) => {
  try {
    const data = await bingxAPI.getAllContracts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent trades
app.get('/api/market/trades/:symbol', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const data = await bingxAPI.getRecentTrades(req.params.symbol, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ACCOUNT ROUTES
// =========================

// Get account balance
app.get('/api/account/balance', async (req, res) => {
  try {
    const data = await bingxAPI.getBalance();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get positions
app.get('/api/account/positions', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const data = await bingxAPI.getPositions(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// TRADING ROUTES
// =========================

// Place market order
app.post('/api/trade/market', async (req, res) => {
  try {
    const { symbol, side, positionSide, quantity } = req.body;
    const data = await bingxAPI.marketOrder(symbol, side, positionSide, quantity);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place limit order
app.post('/api/trade/limit', async (req, res) => {
  try {
    const { symbol, side, positionSide, quantity, price } = req.body;
    const data = await bingxAPI.limitOrder(symbol, side, positionSide, quantity, price);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place order with stop loss and take profit
app.post('/api/trade/order-with-risk', async (req, res) => {
  try {
    const { symbol, side, positionSide, quantity, price, stopLoss, takeProfit, orderType } = req.body;
    
    // Place main order
    let mainOrder;
    if (orderType === 'MARKET') {
      mainOrder = await bingxAPI.marketOrder(symbol, side, positionSide, quantity);
    } else {
      mainOrder = await bingxAPI.limitOrder(symbol, side, positionSide, quantity, price);
    }

    // Add stop loss and take profit if provided
    if (stopLoss || takeProfit) {
      await bingxAPI.addStopLossTakeProfit(symbol, positionSide, stopLoss, takeProfit);
    }

    res.json({ mainOrder, riskManagement: { stopLoss, takeProfit } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
app.delete('/api/trade/order', async (req, res) => {
  try {
    const { symbol, orderId } = req.body;
    const data = await bingxAPI.cancelOrder(symbol, orderId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel all orders
app.delete('/api/trade/all-orders/:symbol', async (req, res) => {
  try {
    const data = await bingxAPI.cancelAllOrders(req.params.symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get open orders
app.get('/api/trade/orders', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const data = await bingxAPI.getOpenOrders(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close position
app.post('/api/trade/close-position', async (req, res) => {
  try {
    const { symbol, positionSide } = req.body;
    const data = await bingxAPI.closePosition(symbol, positionSide);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set leverage
app.post('/api/trade/leverage', async (req, res) => {
  try {
    const { symbol, leverage, side } = req.body;
    const data = await bingxAPI.setLeverage(symbol, leverage, side);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Trading Terminal Backend running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  bingxWS.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
