# 🚀 BingX Trading Terminal

A professional-grade trading terminal for BingX USDⓈ-M Perpetual Futures with advanced charting, one-click trading, and automated risk management.

## ✨ Features

- 📊 **TradingView-Style Charts**: Real-time candlestick charts with lightweight-charts library
- ⚡ **One-Click Trading**: Quick long/short buttons for instant market entries
- 🛡️ **Automated Risk Management**: Auto-calculated stop-loss and take-profit levels
- 📈 **Real-Time Data**: WebSocket integration for live price updates, order book, and trades
- 💼 **Position Management**: Monitor open positions with live PnL tracking
- 📱 **Responsive Design**: Works on desktop and tablet devices
- 🔒 **Secure**: API keys stored locally, never transmitted except to BingX

## 🏗️ Project Structure

```
bingx-trading-terminal/
├── backend/                 # Node.js Express server
│   ├── server.js           # Main server file
│   ├── bingxAPI.js         # BingX API wrapper
│   ├── websocket.js        # WebSocket handler
│   ├── package.json        # Backend dependencies
│   └── .env                # API credentials (you create this)
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # React components
    │   │   ├── TradingChart.js
    │   │   ├── OrderPanel.js
    │   │   ├── MarketInfo.js
    │   │   └── AccountInfo.js
    │   ├── services/
    │   │   └── api.js      # API service layer
    │   ├── styles/         # CSS files
    │   └── App.js          # Main app component
    └── package.json        # Frontend dependencies
```

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
   - OR use **GitHub Codespaces** (no installation needed!) - See [CODESPACES_GUIDE.md](CODESPACES_GUIDE.md)
2. **BingX Account** - [Sign up here](https://bingx.com/)
3. **API Keys** from BingX

## ☁️ Run on GitHub Codespaces (Easiest!)

**No installation required!** Run everything in your browser:
- ✅ Free tier with 60 hours/month
- ✅ Works on any device (even tablets/Chromebooks)
- ✅ Pre-configured environment
- ✅ Access from anywhere

👉 **[Follow the Codespaces Guide](CODESPACES_GUIDE.md)** for step-by-step instructions!

## 🔑 Getting Your BingX API Keys

1. Log in to your BingX account
2. Go to Account → API Management
3. Click "Create API"
4. **IMPORTANT**: Enable these permissions:
   - ✅ Read (for market data and account info)
   - ✅ Trade (for placing orders)
   - ❌ Withdraw (DO NOT enable this for security)
5. Save your API Key and Secret Key securely
6. **For testing**: Use BingX's testnet if available

## 🚀 Installation Guide

### Step 1: Download the Project

Save all the files in the correct folder structure as shown above.

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd bingx-trading-terminal/backend

# Install dependencies
npm install

# Create .env file with your API credentials
# Copy .env.example to .env and fill in your keys
cp .env.example .env
```

Edit `.env` file and add your credentials:
```
BINGX_API_KEY=your_actual_api_key_here
BINGX_API_SECRET=your_actual_api_secret_here
PORT=3001
```

### Step 3: Setup Frontend

```bash
# Open a new terminal
# Navigate to frontend folder
cd bingx-trading-terminal/frontend

# Install dependencies
npm install
```

### Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

You should see:
```
Trading Terminal Backend running on port 3001
WebSocket server ready for connections
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Your browser should automatically open to `http://localhost:3000`

## 🎯 How to Use

### 1. **Chart Panel** (Top Left)
- Select trading pair (BTC-USDT, ETH-USDT, etc.)
- Choose timeframe (1m, 5m, 15m, 1h, 4h, 1d)
- View real-time candlestick chart

### 2. **Order Panel** (Top Right)

#### Quick Trading:
- Click "🚀 Quick Long" for instant long position
- Click "📉 Quick Short" for instant short position

#### Manual Trading:
1. Select Order Type (Market or Limit)
2. Choose Side (Buy/Sell) and Position (Long/Short)
3. Enter Quantity (e.g., 0.001 BTC)
4. For Limit orders, set your price
5. Enable "Auto Calculate SL/TP" for automatic risk management
6. Set Risk % (how much you're willing to lose)
7. Set Reward % (your profit target)
8. Click the submit button

### 3. **Market Info** (Bottom Left)
- View real-time order book (bids and asks)
- See recent trades
- Monitor 24h statistics

### 4. **Account Info** (Bottom Right)
- Check your balance
- Monitor open positions
- View unrealized PnL
- Close positions with one click

## 🛡️ Risk Management Features

### Auto Stop-Loss & Take-Profit
When enabled, the system automatically calculates:
- **Stop-Loss**: Based on your risk percentage (e.g., 2% = stop at -2%)
- **Take-Profit**: Based on your reward percentage (e.g., 4% = take profit at +4%)

Example:
- Current BTC price: $50,000
- Risk: 2% → Stop-Loss at $49,000
- Reward: 4% → Take-Profit at $52,000

### Position Monitoring
- Real-time PnL updates
- Liquidation price warnings
- One-click position closing

## ⚠️ Important Safety Tips

1. **Start Small**: Test with small amounts first
2. **Use Testnet**: Practice on BingX testnet before live trading
3. **Never Share API Keys**: Keep your .env file private
4. **Set Stop-Losses**: Always use stop-loss orders
5. **Monitor Positions**: Keep an eye on your open positions
6. **Understand Leverage**: Higher leverage = higher risk
7. **Don't Invest More Than You Can Afford to Lose**

## 🔧 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify your API keys in .env file
- Make sure you ran `npm install` in backend folder

### Frontend won't connect
- Ensure backend is running first
- Check browser console for errors
- Verify WebSocket connection at ws://localhost:3001

### Orders not executing
- Verify API key has "Trade" permission enabled
- Check account has sufficient balance
- Ensure you're not in rate limit
- Check backend logs for error messages

### Chart not loading
- Check internet connection
- Verify symbol is correct (e.g., BTC-USDT not BTCUSDT)
- Open browser console to see error messages

## 📝 API Endpoints

### Market Data
- `GET /api/market/price/:symbol` - Get current price
- `GET /api/market/depth/:symbol` - Get order book
- `GET /api/market/klines/:symbol` - Get candlestick data
- `GET /api/market/contracts` - Get all available contracts

### Account
- `GET /api/account/balance` - Get account balance
- `GET /api/account/positions` - Get open positions

### Trading
- `POST /api/trade/market` - Place market order
- `POST /api/trade/limit` - Place limit order
- `POST /api/trade/order-with-risk` - Place order with SL/TP
- `DELETE /api/trade/order` - Cancel order
- `POST /api/trade/close-position` - Close position

## 🔐 Security Best Practices

1. **Never commit .env file** to version control
2. **Use IP whitelist** in BingX API settings
3. **Disable withdraw permission** on API keys
4. **Regularly rotate** API keys
5. **Monitor API usage** in BingX dashboard
6. **Use HTTPS** in production environments

## 🚦 Development vs Production

### Development (Current Setup)
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- WebSocket: ws://localhost:3001

### Production Deployment
For production, you'll need to:
1. Deploy backend to a server (Heroku, DigitalOcean, AWS, etc.)
2. Update API_BASE_URL in frontend/src/services/api.js
3. Use environment variables for configuration
4. Enable HTTPS/WSS
5. Add proper error logging
6. Implement rate limiting

## 📚 Additional Resources

- [BingX API Documentation](https://bingx-api.github.io/docs/)
- [Lightweight Charts Documentation](https://tradingview.github.io/lightweight-charts/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🤝 Support

If you encounter issues:
1. Check this README first
2. Review browser console for errors
3. Check backend terminal for error messages
4. Verify your API key permissions
5. Test with small amounts first

## ⚖️ Disclaimer

This trading terminal is provided as-is for educational purposes. Trading cryptocurrency futures carries substantial risk of loss. The developers are not responsible for any financial losses incurred while using this software. Always:
- Trade responsibly
- Understand the risks
- Never trade with money you can't afford to lose
- Do your own research

## 📄 License

This project is for personal use only. Not for commercial distribution.

---

**Happy Trading! 🎉**

Remember: The best trades are the ones you don't take when uncertain. Always prioritize risk management over profits.