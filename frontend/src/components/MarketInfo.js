import React, { useState, useEffect } from 'react';
import { getOrderBook, getRecentTrades } from '../services/api';
import '../styles/MarketInfo.css';

const MarketInfo = ({ symbol, ws }) => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [ticker, setTicker] = useState(null);

  useEffect(() => {
    fetchMarketData();

    // Subscribe to WebSocket updates
    if (ws) {
      ws.subscribe(symbol, 'depth');
      ws.subscribe(symbol, 'trades');
      ws.subscribe(symbol, 'ticker');

      ws.on('depth', handleDepthUpdate);
      ws.on('trade', handleTradeUpdate);
      ws.on('ticker', handleTickerUpdate);
    }

    return () => {
      if (ws) {
        ws.off('depth', handleDepthUpdate);
        ws.off('trade', handleTradeUpdate);
        ws.off('ticker', handleTickerUpdate);
      }
    };
  }, [symbol, ws]);

  const fetchMarketData = async () => {
    try {
      // Fetch order book
      const bookResponse = await getOrderBook(symbol, 10);
      if (bookResponse.data) {
        setOrderBook({
          bids: bookResponse.data.bids || [],
          asks: bookResponse.data.asks || []
        });
      }

      // Fetch recent trades
      const tradesResponse = await getRecentTrades(symbol, 20);
      if (tradesResponse.data) {
        setRecentTrades(tradesResponse.data.slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const handleDepthUpdate = (data) => {
    if (data && data.bids && data.asks) {
      setOrderBook({
        bids: data.bids.slice(0, 10),
        asks: data.asks.slice(0, 10)
      });
    }
  };

  const handleTradeUpdate = (data) => {
    if (data) {
      setRecentTrades(prev => {
        const newTrades = Array.isArray(data) ? data : [data];
        return [...newTrades, ...prev].slice(0, 20);
      });
    }
  };

  const handleTickerUpdate = (data) => {
    if (data) {
      setTicker(data);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatQuantity = (qty) => {
    return parseFloat(qty).toFixed(4);
  };

  return (
    <div className="market-info">
      {/* 24h Ticker Stats */}
      {ticker && (
        <div className="ticker-stats">
          <div className="stat-item">
            <span className="stat-label">24h Change</span>
            <span className={`stat-value ${parseFloat(ticker.priceChangePercent) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(ticker.priceChangePercent).toFixed(2)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h High</span>
            <span className="stat-value">${formatPrice(ticker.highPrice)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h Low</span>
            <span className="stat-value">${formatPrice(ticker.lowPrice)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h Volume</span>
            <span className="stat-value">{formatQuantity(ticker.volume)}</span>
          </div>
        </div>
      )}

      <div className="market-panels">
        {/* Order Book */}
        <div className="order-book">
          <h3>Order Book</h3>
          
          {/* Asks (Sell orders) */}
          <div className="asks">
            {orderBook.asks.slice().reverse().map((ask, index) => (
              <div key={`ask-${index}`} className="order-row ask">
                <span className="price">{formatPrice(ask[0])}</span>
                <span className="quantity">{formatQuantity(ask[1])}</span>
                <div className="depth-bar" style={{ width: `${(parseFloat(ask[1]) / Math.max(...orderBook.asks.map(a => parseFloat(a[1])))) * 100}%` }}></div>
              </div>
            ))}
          </div>

          {/* Spread */}
          {orderBook.bids.length > 0 && orderBook.asks.length > 0 && (
            <div className="spread">
              Spread: ${(parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0])).toFixed(2)}
            </div>
          )}

          {/* Bids (Buy orders) */}
          <div className="bids">
            {orderBook.bids.map((bid, index) => (
              <div key={`bid-${index}`} className="order-row bid">
                <span className="price">{formatPrice(bid[0])}</span>
                <span className="quantity">{formatQuantity(bid[1])}</span>
                <div className="depth-bar" style={{ width: `${(parseFloat(bid[1]) / Math.max(...orderBook.bids.map(b => parseFloat(b[1])))) * 100}%` }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="recent-trades">
          <h3>Recent Trades</h3>
          <div className="trades-list">
            {recentTrades.map((trade, index) => (
              <div key={index} className={`trade-row ${trade.isBuyerMaker ? 'sell' : 'buy'}`}>
                <span className="trade-price">{formatPrice(trade.price)}</span>
                <span className="trade-quantity">{formatQuantity(trade.qty)}</span>
                <span className="trade-time">
                  {new Date(trade.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInfo;
