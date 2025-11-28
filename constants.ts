import { PairConfig, Timeframe } from './types';

export const TRADING_PAIRS: PairConfig[] = [
  { id: 'AUDCHF_OTC', name: 'AUD/CHF (OTC)', volatility: 0.0004 },
  { id: 'AUDNZD_OTC', name: 'AUD/NZD (OTC)', volatility: 0.0005 },
  { id: 'CADCHF_OTC', name: 'CAD/CHF (OTC)', volatility: 0.0004 },
  { id: 'EURGBP_OTC', name: 'EUR/GBP (OTC)', volatility: 0.0003 },
  { id: 'EURNZD_OTC', name: 'EUR/NZD (OTC)', volatility: 0.0006 },
  { id: 'EURUSD_OTC', name: 'EUR/USD (OTC)', volatility: 0.0004 },
  { id: 'GBPUSD_OTC', name: 'GBP/USD (OTC)', volatility: 0.0005 },
  { id: 'USDEGP_OTC', name: 'USD/EGP (OTC)', volatility: 0.0012 },
  { id: 'USDJPY_OTC', name: 'USD/JPY (OTC)', volatility: 0.0006 },
  { id: 'CHFJPY_OTC', name: 'CHF/JPY (OTC)', volatility: 0.0006 },
  { id: 'USDCAD_OTC', name: 'USD/CAD (OTC)', volatility: 0.0005 },
  { id: 'CADJPY_OTC', name: 'CAD/JPY (OTC)', volatility: 0.0007 },
];

export const TIMEFRAMES = [
  { value: Timeframe.S15, label: '15 Seconds' },
  { value: Timeframe.S30, label: '30 Seconds' },
  { value: Timeframe.M1, label: '1 Minute' },
];

export const RSI_PERIOD = 14;
export const SMA_PERIOD = 20;

// Stochastic Constants
export const STOCH_K_PERIOD = 14;
export const STOCH_D_PERIOD = 3;

export const OVERBOUGHT_THRESHOLD = 70;
export const OVERSOLD_THRESHOLD = 30;

export const POCKET_OPTION_URL = "https://pocketoption.com/fr/cabinet/";