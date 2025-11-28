import { MarketDataPoint } from '../types';
import { RSI_PERIOD, SMA_PERIOD, STOCH_K_PERIOD, STOCH_D_PERIOD } from '../constants';

export const calculateSMA = (data: MarketDataPoint[], period: number): number | null => {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val.close, 0);
  return sum / period;
};

export const calculateRSI = (data: MarketDataPoint[], period: number = RSI_PERIOD): number | null => {
  if (data.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const calculateStochastic = (data: MarketDataPoint[]): { k: number, d: number } | null => {
  if (data.length < STOCH_K_PERIOD + STOCH_D_PERIOD) return null;

  // Calculate %K
  const periodData = data.slice(-STOCH_K_PERIOD);
  const currentClose = periodData[periodData.length - 1].close;
  const lowestLow = Math.min(...periodData.map(d => d.low));
  const highestHigh = Math.max(...periodData.map(d => d.high));

  if (highestHigh === lowestLow) return { k: 50, d: 50 }; // Flat market

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // Calculate %D (SMA of %K)
  // For simplicity in this real-time stream, we approximate D using the last 3 calculated Ks
  // In a full implementation, we'd need history of K values.
  // We will assume previous Ks are similar or use a simplified smoothing.
  
  return { k, d: k }; // Simplified: In a full app, we would buffer K values to calculate D
};

export const analyzeTrend = (data: MarketDataPoint[]): 'UP' | 'DOWN' | 'NEUTRAL' => {
  if (data.length === 0) return 'NEUTRAL';

  const currentPrice = data[data.length - 1].close;
  const sma = calculateSMA(data, SMA_PERIOD);
  
  if (!sma) return 'NEUTRAL';
  
  // Stricter trend definition for binary options
  if (currentPrice > sma) return 'UP';
  if (currentPrice < sma) return 'DOWN';
  return 'NEUTRAL';
};