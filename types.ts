export enum Timeframe {
  S15 = '15s',
  S30 = '30s',
  M1 = '1m'
}

export interface MarketDataPoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  type: 'CALL' | 'PUT' | 'WAIT';
  strength: number; // 0-100
  reason: string;
  timestamp: number;
  pair: string;
  indicators: {
    rsi: number;
    stochK: number;
    stochD: number;
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
  };
}

export interface PairConfig {
  id: string;
  name: string;
  volatility: number; // For simulation scaling
}

export enum BotState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SIGNAL_FOUND = 'SIGNAL_FOUND'
}