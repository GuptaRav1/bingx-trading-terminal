import React, { useState, useEffect } from 'react';
import { getBalance, getPositions, closePosition } from '../services/api';
import '../styles/AccountInfo.css';

const AccountInfo = ({ symbol, onRefresh }) => {
  const [balance, setBalance] = useState(null);
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAccountData();

    // Refresh every 5 seconds
    const interval = setInterval(fetchAccountData, 5000);
    return () => clearInterval(interval);
  }, [symbol, onRefresh]);

  const fetchAccountData = async () => {
    try {
      // Fetch balance
      const balanceResponse = await getBalance();
      if (balanceResponse.data && balanceResponse.data.balance) {
        setBalance(balanceResponse.data.balance);
      }

      // Fetch positions
      const positionsResponse = await getPositions();
      if (positionsResponse.data) {
        // Filter out positions with 0 size
        const activePositions = positionsResponse.data.filter(
          pos => Math.abs(parseFloat(pos.positionAmt)) > 0
        );
        setPositions(activePositions);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  };

  const handleClosePosition = async (symbol, positionSide) => {
    if (window.confirm(`Are you sure you want to close your ${positionSide} position on ${symbol}?`)) {
      setIsLoading(true);
      try {
        await closePosition(symbol, positionSide);
        alert('Position closed successfully!');
        fetchAccountData();
      } catch (error) {
        alert(`Error closing position: ${error.response?.data?.error || error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const calculateTotalPnL = () => {
    return positions.reduce((total, pos) => total + parseFloat(pos.unrealizedProfit || 0), 0);
  };

  return (
    <div className="account-info">
      <div className="account-header">
        <h2>Account</h2>
        <button onClick={fetchAccountData} className="btn-refresh" disabled={isLoading}>
          🔄 Refresh
        </button>
      </div>

      {/* Balance Section */}
      {balance && (
        <div className="balance-section">
          <div className="balance-card">
            <div className="balance-label">Available Balance</div>
            <div className="balance-value">${parseFloat(balance.availableMargin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="balance-card">
            <div className="balance-label">Total Equity</div>
            <div className="balance-value">${parseFloat(balance.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="balance-card">
            <div className="balance-label">Unrealized PnL</div>
            <div className={`balance-value ${calculateTotalPnL() >= 0 ? 'profit' : 'loss'}`}>
              ${calculateTotalPnL().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Positions Section */}
      <div className="positions-section">
        <h3>Open Positions ({positions.length})</h3>
        {positions.length === 0 ? (
          <div className="no-positions">No open positions</div>
        ) : (
          <div className="positions-list">
            {positions.map((position, index) => {
              const pnl = parseFloat(position.unrealizedProfit);
              const pnlPercent = (pnl / parseFloat(position.initialMargin)) * 100;
              
              return (
                <div key={index} className={`position-card ${position.positionSide.toLowerCase()}`}>
                  <div className="position-header-row">
                    <div className="position-symbol-side">
                      <span className="position-symbol">{position.symbol}</span>
                      <span className={`position-badge ${position.positionSide.toLowerCase()}`}>
                        {position.positionSide}
                      </span>
                    </div>
                    <button onClick={() => handleClosePosition(position.symbol, position.positionSide)} className="btn-close-position" disabled={isLoading}>
                      Close
                    </button>
                  </div>

                  <div className="position-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Size</span>
                      <span className="detail-value">{Math.abs(parseFloat(position.positionAmt))}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Entry Price</span>
                      <span className="detail-value">${parseFloat(position.avgPrice).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mark Price</span>
                      <span className="detail-value">${parseFloat(position.markPrice).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Leverage</span>
                      <span className="detail-value">{position.leverage}x</span>
                    </div>
                  </div>

                  <div className="position-pnl">
                    <div className="pnl-row">
                      <span className="pnl-label">Unrealized PnL</span>
                      <span className={`pnl-value ${pnl >= 0 ? 'profit' : 'loss'}`}>
                        ${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {position.liquidationPrice && (
                    <div className="liquidation-price">
                      Liquidation: ${parseFloat(position.liquidationPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
