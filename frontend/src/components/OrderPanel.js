import React, { useState, useEffect } from 'react';
import { placeOrderWithRisk, getPrice, getPositions } from '../services/api';
import '../styles/OrderPanel.css';

const OrderPanel = ({ symbol }) => {
  const [orderType, setOrderType] = useState('MARKET');
  const [side, setSide] = useState('BUY');
  const [positionSide, setPositionSide] = useState('LONG');
  const [quantity, setQuantity] = useState('0.001');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Auto-calculate stop loss and take profit based on risk/reward
  const [riskPercent, setRiskPercent] = useState('2');
  const [rewardPercent, setRewardPercent] = useState('4');
  const [autoRisk, setAutoRisk] = useState(true);

  useEffect(() => {
    fetchCurrentPrice();
    fetchPositions();
    
    // Update price every 2 seconds
    const interval = setInterval(() => {
      fetchCurrentPrice();
      fetchPositions();
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    // Auto-calculate SL/TP when price or risk settings change
    if (autoRisk && currentPrice && orderType === 'MARKET') {
      calculateRiskLevels();
    }
  }, [currentPrice, riskPercent, rewardPercent, autoRisk, positionSide]);

  const fetchCurrentPrice = async () => {
    try {
      const response = await getPrice(symbol);
      if (response.data && response.data.price) {
        setCurrentPrice(parseFloat(response.data.price));
        if (!price && orderType === 'LIMIT') {
          setPrice(response.data.price);
        }
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await getPositions(symbol);
      if (response.data) {
        setPositions(response.data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const calculateRiskLevels = () => {
    if (!currentPrice) return;

    const risk = parseFloat(riskPercent) / 100;
    const reward = parseFloat(rewardPercent) / 100;

    if (positionSide === 'LONG') {
      const sl = currentPrice * (1 - risk);
      const tp = currentPrice * (1 + reward);
      setStopLoss(sl.toFixed(2));
      setTakeProfit(tp.toFixed(2));
    } else {
      const sl = currentPrice * (1 + risk);
      const tp = currentPrice * (1 - reward);
      setStopLoss(sl.toFixed(2));
      setTakeProfit(tp.toFixed(2));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const orderData = {
        symbol,
        side,
        positionSide,
        quantity: parseFloat(quantity),
        orderType,
      };

      if (orderType === 'LIMIT') {
        orderData.price = parseFloat(price);
      }

      if (stopLoss) {
        orderData.stopLoss = parseFloat(stopLoss);
      }

      if (takeProfit) {
        orderData.takeProfit = parseFloat(takeProfit);
      }

      const response = await placeOrderWithRisk(orderData);
      
      setMessage({
        text: `Order placed successfully! ${orderType} ${side} ${quantity} ${symbol}`,
        type: 'success'
      });

      // Refresh positions
      fetchPositions();

      // Clear message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);

    } catch (error) {
      setMessage({
        text: `Error: ${error.response?.data?.error || error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickBuyLong = () => {
    setSide('BUY');
    setPositionSide('LONG');
  };

  const quickSellShort = () => {
    setSide('SELL');
    setPositionSide('SHORT');
  };

  return (
    <div className="order-panel">
      <h2>Order Panel</h2>
      
      {currentPrice && (
        <div className="current-price">
          <span className="label">Current Price:</span>
          <span className="price">${currentPrice.toLocaleString()}</span>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button onClick={quickBuyLong} className="btn-long" disabled={isLoading}>
          🚀 Quick Long
        </button>
        <button onClick={quickSellShort} className="btn-short" disabled={isLoading}>
          📉 Quick Short
        </button>
      </div>

      <form onSubmit={handleSubmitOrder} className="order-form">
        {/* Order Type */}
        <div className="form-group">
          <label>Order Type</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </div>

        {/* Side and Position Side */}
        <div className="form-row">
          <div className="form-group">
            <label>Side</label>
            <select value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div className="form-group">
            <label>Position</label>
            <select value={positionSide} onChange={(e) => setPositionSide(e.target.value)}>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </div>
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label>Quantity</label>
          <input type="number" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>

        {/* Limit Price (only for LIMIT orders) */}
        {orderType === 'LIMIT' && (
          <div className="form-group">
            <label>Limit Price</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
        )}

        {/* Auto Risk Management Toggle */}
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={autoRisk} onChange={(e) => setAutoRisk(e.target.checked)} />
            Auto Calculate SL/TP
          </label>
        </div>

        {/* Risk/Reward Settings */}
        {autoRisk && (
          <div className="form-row">
            <div className="form-group">
              <label>Risk %</label>
              <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Reward %</label>
              <input type="number" step="0.1" value={rewardPercent} onChange={(e) => setRewardPercent(e.target.value)} />
            </div>
          </div>
        )}

        {/* Stop Loss */}
        <div className="form-group">
          <label>Stop Loss (Optional)</label>
          <input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Auto-calculated if enabled" />
        </div>

        {/* Take Profit */}
        <div className="form-group">
          <label>Take Profit (Optional)</label>
          <input type="number" step="0.01" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="Auto-calculated if enabled" />
        </div>

        {/* Submit Button */}
        <button type="submit" className={`btn-submit ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`} disabled={isLoading}>
          {isLoading ? 'Placing Order...' : `${side} ${positionSide}`}
        </button>
      </form>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Current Positions */}
      {positions.length > 0 && (
        <div className="positions-section">
          <h3>Open Positions</h3>
          {positions.map((pos, index) => (
            <div key={index} className={`position-item ${pos.positionSide === 'LONG' ? 'long' : 'short'}`}>
              <div className="position-header">
                <span className="position-side">{pos.positionSide}</span>
                <span className="position-symbol">{pos.symbol}</span>
              </div>
              <div className="position-details">
                <div>Size: {pos.positionAmt}</div>
                <div>Entry: ${parseFloat(pos.avgPrice).toFixed(2)}</div>
                <div className={parseFloat(pos.unrealizedProfit) >= 0 ? 'profit' : 'loss'}>
                  PnL: ${parseFloat(pos.unrealizedProfit).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPanel;
