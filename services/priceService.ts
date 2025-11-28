// Service to fetch real initial price data
// We use a public API to get the base rates to ensure the chart starts at the REAL market level.

interface ExchangeRates {
  rates: { [key: string]: number };
  base: string;
}

const CACHE_KEY = 'REAL_MARKET_RATES';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const fetchRealPrice = async (pairId: string): Promise<number> => {
  try {
    // Parse the pair (e.g., "AUDCHF_OTC" -> Base: AUD, Target: CHF)
    const rawPair = pairId.replace('_OTC', '');
    const base = rawPair.substring(0, 3);
    const target = rawPair.substring(3, 6);

    // Try to get cached rates first
    const cached = localStorage.getItem(CACHE_KEY);
    let rates: { [key: string]: number } | null = null;
    
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        rates = data;
      }
    }

    // Fetch if not cached
    if (!rates) {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data: ExchangeRates = await response.json();
      rates = data.rates;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: rates }));
    }

    if (rates && rates[base] && rates[target]) {
      // Cross rate calculation: (USD/Target) / (USD/Base)
      // Because API gives 1 USD = X Target, 1 USD = Y Base
      // So 1 Base = (1/Y) * USD = (1/Y) * X Target = X/Y Target
      const baseToUsd = 1 / rates[base];
      const realRate = baseToUsd * rates[target];
      return realRate;
    }

    return 1.0000; // Fallback

  } catch (error) {
    console.warn('Could not fetch real price, using fallback', error);
    // Fallback prices if API fails
    if (pairId.includes('JPY')) return 145.50;
    return 1.0800;
  }
};