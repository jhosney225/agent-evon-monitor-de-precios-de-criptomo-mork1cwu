
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Store for price monitoring data
const priceMonitor = {
  watchedCryptos: new Map(),
  priceHistory: new Map(),
  alerts: new Map(),
};

// Tool definitions
const tools = [
  {
    name: "get_current_price",
    description:
      "Get the current price of a cryptocurrency in USD. Simulates real price data.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The cryptocurrency symbol (e.g., BTC, ETH, XRP)",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "set_price_alert",
    description:
      "Set a price alert for a cryptocurrency. Alert triggers when price crosses the threshold.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The cryptocurrency symbol",
        },
        threshold_price: {
          type: "number",
          description: "The price threshold for the alert",
        },
        alert_type: {
          type: "string",
          enum: ["above", "below"],
          description:
            "Alert when price goes above or below the threshold",
        },
      },
      required: ["symbol", "threshold_price", "alert_type"],
    },
  },
  {
    name: "get_price_history",
    description: "Get the price history for a cryptocurrency",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The cryptocurrency symbol",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "check_alerts",
    description:
      "Check all active alerts and see which ones have been triggered",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_watched_cryptos",
    description: "List all cryptocurrencies currently being watched",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Simulated price data for demonstration
const cryptoPrices = {
  BTC: { current: 43250, volatility: 0.02 },
  ETH: { current: 2280, volatility: 0.025 },
  XRP: { current: 2.15, volatility: 0.03 },
  ADA: { current: 0.98, volatility: 0.035 },
  DOGE: { current: 0.12, volatility: 0.04 },
};

// Tool implementation functions
function getCurrentPrice(symbol) {
  const upperSymbol = symbol.toUpperCase();
  if (!cryptoPrices[upperSymbol]) {
    return {
      error: `Cryptocurrency ${symbol} not found in database`,
      available: Object.keys(cryptoPrices),
    };
  }

  // Simulate price fluctuation
  const priceData = cryptoPrices[upperSymbol];
  const change =
    (Math.random() - 0.5) * 2 * priceData.volatility * priceData.current;
  const newPrice = priceData.current + change;
  cryptoPrices[upperSymbol].current = newPrice;

  // Store in history
  if (!priceMonitor.priceHistory.has(upperSymbol)) {
    priceMonitor.priceHistory.set(upperSymbol, []);
  }
  const history = priceMonitor.priceHistory.get(upperSymbol);
  history.push({
    price: newPrice,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 10 prices
  if (history.length > 10) {
    history.shift();
  }

  // Add to watched list
  if (!priceMonitor.watchedCryptos.has(upperSymbol)) {
    priceMonitor.watchedCryptos.set(upperSymbol, newPrice);
  }

  return {
    symbol: upperSymbol,
    price: newPrice.toFixed(2),
    timestamp: new Date().toISOString(),
  };
}

function setPriceAlert(symbol, thresholdPrice, alertType) {
  const upperSymbol = symbol.toUpperCase();

  if (!cryptoPrices[upperSymbol]) {
    return {
      error: `Cryptocurrency ${symbol} not found`,
      available: Object.keys(cryptoPrices),
    };
  }

  const alertId = `${upperSymbol}_${Date.now()}`;
  priceMonitor.alerts.set(alertId, {
    symbol: upperSymbol,
    threshold: thresholdPrice,
    type: alertType,
    created: new Date().toISOString(),
    triggered: false,
  });

  return {
    success: true,
    alertId,
    message: `Alert set for ${upperSymbol}: trigger when price goes ${alertType} $${thresholdPrice}`,
  };
}

function getPriceHistory(symbol) {
  const upperSymbol = symbol.toUpperCase();
  const history = priceMonitor.priceHistory.get(upperSymbol);

  if (!history || history.length === 0) {
    return {
      symbol: upperSymbol,
      message: "No price history available yet. Get current price first.",
      history: [],
    };
  }

  return {
    symbol: upperSymbol,
    history: history,
    count: history.length,
  };
}

function checkAlerts() {
  const triggered = [];
  const active = [];

  for (const [alertId, alert] of priceMonitor.alerts) {
    const currentPrice = cryptoPrices[alert.symbol]?.current || 0;