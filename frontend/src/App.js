import React, { useState, useEffect } from 'react';
import TradingChart from './components/TradingChart';
import OrderPanel from './components/OrderPanel';
import MarketInfo from './components/MarketInfo';
import AccountInfo from './components/AccountInfo';
import { TradingWebSocket } from './services/api';
import './App.css';

function App() {
  const [symbol, setSymbol] = useState('BTC-USDT');
  const [interval, setInterval] = useState('1m');
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new TradingWebSocket();
    websocket.connect();

    websocket.on('connected', () => {
      setIsConnected(true);
      console.log('Trading terminal connected');
    });

    websocket.on('disconnected', () => {
      setIsConnected(false);
    });

    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, []);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 BingX Trading Terminal</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {/* Symbol and Interval Selector */}
        <div className="controls">
          <div className="control-group">
            <label>Symbol</label>
            <select value={symbol} onChange={handleSymbolChange} className="symbol-select">
              <option value="BTC-USDT">BTC-USDT</option>
              <option value="ETH-USDT">ETH-USDT</option>
              <option value="BNB-USDT">BNB-USDT</option>
              <option value="SOL-USDT">SOL-USDT</option>
              <option value="XRP-USDT">XRP-USDT</option>
              <option value="ADA-USDT">ADA-USDT</option>
              <option value="DOGE-USDT">DOGE-USDT</option>
              <option value="AVAX-USDT">AVAX-USDT</option>
            </select>
          </div>
          <div className="control-group">
            <label>Interval</label>
            <select value={interval} onChange={handleIntervalChange} className="interval-select">
              <option value="1m">1m</option>
              <option value="3m">3m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Chart and Market Info */}
        <div className="left-panel">
          <div className="chart-container">
            <TradingChart symbol={symbol} interval={interval} />
          </div>
          <div className="market-info-container">
            <MarketInfo symbol={symbol} ws={ws} />
          </div>
        </div>

        {/* Right Panel - Order Panel and Account Info */}
        <div className="right-panel">
          <div className="order-panel-container">
            <OrderPanel symbol={symbol} />
          </div>
          <div className="account-info-container">
            <AccountInfo symbol={symbol} onRefresh={refreshKey} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>⚠️ Trading involves significant risk. Only trade with funds you can afford to lose.</p>
        <p>This is a personal trading terminal. Use at your own risk.</p>
      </footer>
    </div>
  );
}

export default App;
