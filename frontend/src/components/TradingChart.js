import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getKlines } from '../services/api';

const TradingChart = ({ symbol, interval = '1m' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485c7b',
      },
      timeScale: {
        borderColor: '#485c7b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candleSeriesRef.current = candleSeries;

    // Load initial data
    loadChartData();

    // Handle window resize
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Reload data when symbol or interval changes
  useEffect(() => {
    if (candleSeriesRef.current) {
      loadChartData();
    }
  }, [symbol, interval]);

  const loadChartData = async () => {
    try {
      setIsLoading(true);
      const response = await getKlines(symbol, interval, 500);
      
      if (response.data) {
        // Transform BingX kline data to TradingView format
        const chartData = response.data.map(kline => ({
          time: Math.floor(kline.time / 1000), // Convert to seconds
          open: parseFloat(kline.open),
          high: parseFloat(kline.high),
          low: parseFloat(kline.low),
          close: parseFloat(kline.close),
        }));

        // Sort by time (oldest first)
        chartData.sort((a, b) => a.time - b.time);

        candleSeriesRef.current.setData(chartData);
        chartRef.current.timeScale().fitContent();
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setIsLoading(false);
    }
  };

  // Method to update chart with new candle (called from WebSocket)
  const updateCandle = (kline) => {
    if (candleSeriesRef.current && kline) {
      const candle = {
        time: Math.floor(kline.time / 1000),
        open: parseFloat(kline.open),
        high: parseFloat(kline.high),
        low: parseFloat(kline.low),
        close: parseFloat(kline.close),
      };
      candleSeriesRef.current.update(candle);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '18px',
          zIndex: 10
        }}>
          Loading chart data...
        </div>
      )}
      <div ref={chartContainerRef} />
    </div>
  );
};

export default TradingChart;
