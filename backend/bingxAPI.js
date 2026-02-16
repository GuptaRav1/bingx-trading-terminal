const crypto = require('crypto');
const axios = require('axios');

class BingXAPI {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://open-api.bingx.com';
  }

  // Generate signature for authenticated requests
  generateSignature(queryString) {
    return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
  }

  // Build query string and sign it
  buildSignedRequest(params) {
    const timestamp = Date.now();
    params.timestamp = timestamp;
    
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

    const queryString = Object.entries(sortedParams).map(([key, value]) => `${key}=${value}`).join('&');
    const signature = this.generateSignature(queryString);
    
    return { queryString, signature };
  }

  // Generic request method
  async makeRequest(method, endpoint, params = {}, requiresAuth = false) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'X-BX-APIKEY': this.apiKey
        }
      };

      if (requiresAuth) {
        const { queryString, signature } = this.buildSignedRequest(params);
        config.url += `?${queryString}&signature=${signature}`;
      } else if (Object.keys(params).length > 0) {
        const queryString = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&');
        config.url += `?${queryString}`;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // =========================
  // MARKET DATA ENDPOINTS
  // =========================

  // Get current market price for a symbol
  async getPrice(symbol) {
    return await this.makeRequest('GET', '/openApi/swap/v2/quote/price', { symbol });
  }

  // Get orderbook depth
  async getOrderBook(symbol, limit = 20) {
    return await this.makeRequest('GET', '/openApi/swap/v2/quote/depth', { symbol, limit });
  }

  // Get recent trades
  async getRecentTrades(symbol, limit = 100) {
    return await this.makeRequest('GET', '/openApi/swap/v2/quote/trades', { symbol, limit });
  }

  // Get kline/candlestick data
  async getKlines(symbol, interval, limit = 500) {
    // interval: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d, 3d, 1w, 1M
    return await this.makeRequest('GET', '/openApi/swap/v3/quote/klines', { symbol, interval, limit });
  }

  // Get all perpetual contracts info
  async getAllContracts() {
    return await this.makeRequest('GET', '/openApi/swap/v2/quote/contracts');
  }

  // =========================
  // ACCOUNT ENDPOINTS
  // =========================

  // Get account balance
  async getBalance() {
    return await this.makeRequest('GET', '/openApi/swap/v2/user/balance', {}, true);
  }

  // Get current positions
  async getPositions(symbol = null) {
    const params = symbol ? { symbol } : {};
    return await this.makeRequest('GET', '/openApi/swap/v2/user/positions', params, true);
  }

  // Get account info including available balance
  async getAccountInfo() {
    return await this.makeRequest('GET', '/openApi/swap/v2/user/balance', {}, true);
  }

  // =========================
  // TRADING ENDPOINTS
  // =========================

  // Place a new order
  async placeOrder(orderParams) {
    /*
    orderParams = {
      symbol: 'BTC-USDT',        // Trading pair
      side: 'BUY' or 'SELL',     // Order side
      positionSide: 'LONG' or 'SHORT', // Position direction
      type: 'MARKET' or 'LIMIT', // Order type
      quantity: 0.001,           // Order quantity
      price: 50000,              // Limit price (for LIMIT orders)
      stopPrice: 49000,          // Stop price (for stop orders)
      takeProfit: {              // Optional take profit
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: 52000
      },
      stopLoss: {                // Optional stop loss
        type: 'STOP_MARKET',
        stopPrice: 48000
      }
    }
    */
    return await this.makeRequest('POST', '/openApi/swap/v2/trade/order', orderParams, true);
  }

  // Place market order (simplified)
  async marketOrder(symbol, side, positionSide, quantity) {
    return await this.placeOrder({
      symbol,
      side,
      positionSide,
      type: 'MARKET',
      quantity: quantity.toString()
    });
  }

  // Place limit order (simplified)
  async limitOrder(symbol, side, positionSide, quantity, price) {
    return await this.placeOrder({
      symbol,
      side,
      positionSide,
      type: 'LIMIT',
      quantity: quantity.toString(),
      price: price.toString()
    });
  }

  // Cancel an order
  async cancelOrder(symbol, orderId) {
    return await this.makeRequest('DELETE', '/openApi/swap/v2/trade/order', { symbol, orderId }, true);
  }

  // Cancel all orders for a symbol
  async cancelAllOrders(symbol) {
    return await this.makeRequest('DELETE', '/openApi/swap/v2/trade/allOrders', { symbol }, true);
  }

  // Get order details
  async getOrder(symbol, orderId) {
    return await this.makeRequest('GET', '/openApi/swap/v2/trade/order', { symbol, orderId }, true);
  }

  // Get open orders
  async getOpenOrders(symbol = null) {
    const params = symbol ? { symbol } : {};
    return await this.makeRequest('GET', '/openApi/swap/v2/trade/openOrders', params, true);
  }

  // Set leverage for a symbol
  async setLeverage(symbol, leverage, side) {
    // side: 'LONG' or 'SHORT'
    return await this.makeRequest('POST', '/openApi/swap/v2/trade/leverage', { symbol, leverage, side }, true);
  }

  // Close position
  async closePosition(symbol, positionSide) {
    // This cancels all orders and closes the position at market price
    const position = await this.getPositions(symbol);
    if (!position.data || position.data.length === 0) {
      return { message: 'No position to close' };
    }

    const pos = position.data.find(p => p.positionSide === positionSide);
    if (!pos) {
      return { message: 'No position found for the specified side' };
    }

    const quantity = Math.abs(parseFloat(pos.positionAmt));
    const side = positionSide === 'LONG' ? 'SELL' : 'BUY';

    return await this.marketOrder(symbol, side, positionSide, quantity);
  }

  // =========================
  // RISK MANAGEMENT
  // =========================

  // Add stop loss and take profit to existing position
  async addStopLossTakeProfit(symbol, positionSide, stopLossPrice, takeProfitPrice) {
    const orders = [];

    if (stopLossPrice) {
      const slSide = positionSide === 'LONG' ? 'SELL' : 'BUY';
      orders.push(this.placeOrder({
        symbol,
        side: slSide,
        positionSide,
        type: 'STOP_MARKET',
        stopPrice: stopLossPrice.toString()
      }));
    }

    if (takeProfitPrice) {
      const tpSide = positionSide === 'LONG' ? 'SELL' : 'BUY';
      orders.push(this.placeOrder({
        symbol,
        side: tpSide,
        positionSide,
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: takeProfitPrice.toString()
      }));
    }

    return await Promise.all(orders);
  }
}

module.exports = BingXAPI;
