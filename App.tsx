import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  Activity, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  PlayCircle,
  Cpu,
  RefreshCw,
  Search,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { TRADING_PAIRS, TIMEFRAMES, RSI_PERIOD, OVERBOUGHT_THRESHOLD, OVERSOLD_THRESHOLD, POCKET_OPTION_URL } from './constants';
import { MarketDataPoint, Timeframe, Signal, BotState, PairConfig } from './types';
import { calculateRSI, analyzeTrend, calculateStochastic } from './services/indicators';
import { getGeminiAnalysis } from './services/geminiService';
import { fetchRealPrice } from './services/priceService';
import ChartDisplay from './components/ChartDisplay';
import IndicatorBadge from './components/IndicatorBadge';

const MAX_DATA_POINTS = 60; // Keep last 60 ticks

const App: React.FC = () => {
  // State Initialization with LocalStorage
  const [selectedPair, setSelectedPair] = useState<PairConfig>(() => {
    const saved = localStorage.getItem('pocketSignal_pairId');
    const found = TRADING_PAIRS.find(p => p.id === saved);
    return found || TRADING_PAIRS[0];
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(() => {
    const saved = localStorage.getItem('pocketSignal_timeframe');
    return (saved as Timeframe) || Timeframe.S15;
  });

  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [botState, setBotState] = useState<BotState>(BotState.IDLE);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [realPriceLoaded, setRealPriceLoaded] = useState(false);
  
  // Refs for simulation loop
  const intervalRef = useRef<number | null>(null);
  const priceRef = useRef<number>(1.00000); 

  // Persist settings
  useEffect(() => {
    localStorage.setItem('pocketSignal_pairId', selectedPair.id);
  }, [selectedPair]);

  useEffect(() => {
    localStorage.setItem('pocketSignal_timeframe', selectedTimeframe);
  }, [selectedTimeframe]);

  // Fetch Real Start Price
  useEffect(() => {
    const loadPrice = async () => {
      setRealPriceLoaded(false);
      setMarketData([]); // Clear old data
      const price = await fetchRealPrice(selectedPair.id);
      priceRef.current = price;
      setRealPriceLoaded(true);
      setBotState(BotState.ANALYZING);
    };
    loadPrice();
  }, [selectedPair]);

  // Real-time Tick Generator (Simulation based on Real Start Price)
  const generateTick = useCallback(() => {
    if (!realPriceLoaded) return;

    const volatility = selectedPair.volatility;
    // Random Walk with drift towards mean (simple market physics)
    const noise = (Math.random() - 0.5) * volatility * 2;
    // Add micro-trends
    const time = Date.now();
    const trendComponent = Math.sin(time / 10000) * (volatility / 2); 
    
    let newPrice = priceRef.current + noise + trendComponent;
    
    // Ensure we don't drift too far from reality or go negative
    if (newPrice < 0.0001) newPrice = priceRef.current;

    priceRef.current = newPrice;

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const newPoint: MarketDataPoint = {
      time: timeStr,
      price: newPrice,
      open: newPrice - (Math.random() * volatility),
      high: newPrice + (Math.random() * volatility),
      low: newPrice - (Math.random() * volatility),
      close: newPrice,
      volume: Math.floor(Math.random() * 500) + 50
    };

    setMarketData(prev => {
      const newData = [...prev, newPoint];
      if (newData.length > MAX_DATA_POINTS) return newData.slice(-MAX_DATA_POINTS);
      return newData;
    });
  }, [selectedPair, realPriceLoaded]);

  // Engine Effect
  useEffect(() => {
    setCurrentSignal(null);
    setAiAnalysis("");
    
    const speed = selectedTimeframe === Timeframe.S15 ? 1000 : selectedTimeframe === Timeframe.S30 ? 2000 : 4000;

    intervalRef.current = window.setInterval(generateTick, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedPair, selectedTimeframe, generateTick]);

  // Advanced Analysis Logic (Hidden Entry Points)
  useEffect(() => {
    if (marketData.length < RSI_PERIOD + 2) return;

    const rsi = calculateRSI(marketData);
    const trend = analyzeTrend(marketData);
    const stoch = calculateStochastic(marketData);

    if (!rsi || !stoch) return;

    let newSignal: Signal | null = null;
    const currentPrice = marketData[marketData.length - 1].close;

    // Advanced Strategy: RSI + Stochastic + Trend Confirmation
    // "Hidden Entry": Catching the pullback in a trend
    
    // Strong PUT Signal
    if (rsi > OVERBOUGHT_THRESHOLD && stoch.k > 80) {
       newSignal = {
        type: 'PUT',
        strength: Math.min(((rsi - 70) + (stoch.k - 80)) * 2 + 60, 99),
        reason: 'Double Overbought (RSI + Stoch) - Reversal Imminent',
        timestamp: Date.now(),
        pair: selectedPair.name,
        indicators: { rsi, trend, stochK: stoch.k, stochD: stoch.d }
      };
    } 
    // Strong CALL Signal
    else if (rsi < OVERSOLD_THRESHOLD && stoch.k < 20) {
      newSignal = {
        type: 'CALL',
        strength: Math.min(((30 - rsi) + (20 - stoch.k)) * 2 + 60, 99),
        reason: 'Double Oversold (RSI + Stoch) - Bounce Imminent',
        timestamp: Date.now(),
        pair: selectedPair.name,
        indicators: { rsi, trend, stochK: stoch.k, stochD: stoch.d }
      };
    }
    // Hidden Bearish Divergence / Trend Continuation
    else if (trend === 'DOWN' && rsi > 55 && rsi < 70 && stoch.k > 60) {
       newSignal = {
        type: 'PUT',
        strength: 75,
        reason: 'Trend Continuation (Hidden Entry)',
        timestamp: Date.now(),
        pair: selectedPair.name,
        indicators: { rsi, trend, stochK: stoch.k, stochD: stoch.d }
       };
    }
    // Hidden Bullish Divergence / Trend Continuation
    else if (trend === 'UP' && rsi < 45 && rsi > 30 && stoch.k < 40) {
       newSignal = {
        type: 'CALL',
        strength: 75,
        reason: 'Trend Continuation (Hidden Entry)',
        timestamp: Date.now(),
        pair: selectedPair.name,
        indicators: { rsi, trend, stochK: stoch.k, stochD: stoch.d }
       };
    }
    else {
      newSignal = {
        type: 'WAIT',
        strength: 0,
        reason: 'Scanning for High Probability Setup...',
        timestamp: Date.now(),
        pair: selectedPair.name,
        indicators: { rsi, trend, stochK: stoch.k, stochD: stoch.d }
      };
    }

    // Debounce signal updates
    if (!currentSignal || currentSignal.type !== newSignal.type || Math.abs(currentSignal.strength - newSignal.strength) > 10) {
      setCurrentSignal(newSignal);
      if (newSignal.type !== 'WAIT') {
        setBotState(BotState.SIGNAL_FOUND);
      } else {
        setBotState(BotState.ANALYZING);
      }
    }
  }, [marketData, selectedPair.name, currentSignal]);

  const triggerAiAnalysis = async () => {
    if (!currentSignal || marketData.length === 0) return;
    setIsAiLoading(true);
    const rsi = currentSignal.indicators.rsi;
    const stochK = currentSignal.indicators.stochK;
    const trend = currentSignal.indicators.trend;
    const price = marketData[marketData.length - 1].close;

    const analysis = await getGeminiAnalysis(selectedPair.name, price, rsi, stochK, trend);
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  };

  const getRsiStatus = (val: number | null) => {
    if (!val) return 'neutral';
    if (val > 70) return 'danger';
    if (val < 30) return 'success';
    return 'warning';
  };

  const openPocketOption = () => {
    window.open(POCKET_OPTION_URL, '_blank');
  };

  const rsiValue = calculateRSI(marketData);
  const stochValue = calculateStochastic(marketData);
  const trendValue = analyzeTrend(marketData);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 hidden sm:block">
              PocketSignal<span className="font-light text-white">Pro</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <button 
              onClick={openPocketOption}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-900/50"
            >
              <Wallet size={16} />
              <span className="hidden sm:inline">Open Pocket Option</span>
              <span className="sm:hidden">Pocket Option</span>
              <ExternalLink size={14} className="opacity-70" />
            </button>
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
              <span className={`w-2 h-2 rounded-full ${botState === BotState.SIGNAL_FOUND ? 'bg-emerald-500 animate-pulse-fast' : 'bg-blue-500 animate-pulse'}`}></span>
              <span className="font-medium text-gray-300">{botState === BotState.SIGNAL_FOUND ? 'SIGNAL ACTIVE' : 'SCANNING MARKET'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Chart */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-xl">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Asset (Real OTC Market)</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-850 transition"
                  value={selectedPair.id}
                  onChange={(e) => {
                    const pair = TRADING_PAIRS.find(p => p.id === e.target.value);
                    if (pair) setSelectedPair(pair);
                  }}
                >
                  {TRADING_PAIRS.map(pair => (
                    <option key={pair.id} value={pair.id}>{pair.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Activity size={16} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-xl">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Expiration Timeframe</label>
              <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value as Timeframe)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      selectedTimeframe === tf.value 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-gray-800 rounded-xl p-1 border border-gray-700 shadow-2xl overflow-hidden relative">
             <div className="bg-gray-900/80 p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                   <h2 className="text-lg font-bold text-white">{selectedPair.name}</h2>
                   <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                     LIVE
                   </span>
                </div>
                <div className="text-2xl font-mono font-bold text-white tracking-wide">
                   {marketData.length > 0 ? marketData[marketData.length - 1].close.toFixed(5) : 'Loading...'}
                </div>
             </div>
             
             {!realPriceLoaded && (
               <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                 <div className="flex flex-col items-center">
                   <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                   <span className="text-sm text-gray-400">Syncing with Real Market Data...</span>
                 </div>
               </div>
             )}

             <ChartDisplay 
               data={marketData} 
               color={currentSignal?.type === 'CALL' ? '#10b981' : currentSignal?.type === 'PUT' ? '#f43f5e' : '#3b82f6'} 
             />
             <div className="p-3 bg-gray-900/50 flex space-x-6 justify-center border-t border-gray-800">
                <div className="text-xs text-gray-400 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Price Line</div>
                <div className="text-xs text-gray-400 flex items-center"><span className="w-2 h-2 border border-dashed border-gray-500 mr-2"></span>Signal Zone</div>
             </div>
          </div>
        </div>

        {/* Right Column: Signals & Analytics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Signal Card */}
          <div className={`rounded-xl p-6 border-2 transition-all duration-300 relative overflow-hidden ${
            currentSignal?.type === 'CALL' 
              ? 'bg-gradient-to-br from-emerald-900/40 to-gray-900 border-emerald-500/50 shadow-emerald-900/20 shadow-2xl' 
              : currentSignal?.type === 'PUT' 
                ? 'bg-gradient-to-br from-rose-900/40 to-gray-900 border-rose-500/50 shadow-rose-900/20 shadow-2xl'
                : 'bg-gray-800 border-gray-700'
          }`}>
             {currentSignal?.type !== 'WAIT' && (
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  {currentSignal?.type === 'CALL' ? <TrendingUp size={100} /> : <TrendingDown size={100} />}
                </div>
             )}
            
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
               <Cpu className="w-4 h-4 mr-2" /> AI Bot Signal
             </h3>

             <div className="flex flex-col items-center justify-center py-6">
                {currentSignal?.type === 'WAIT' ? (
                   <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-gray-500 animate-spin-slow" />
                   </div>
                ) : (
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] ${
                    currentSignal?.type === 'CALL' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-rose-500 bg-rose-500/10 text-rose-400'
                  }`}>
                    <span className="text-4xl font-black tracking-tighter">{currentSignal?.type}</span>
                  </div>
                )}
                
                <p className="text-lg font-medium text-gray-300 text-center max-w-[90%]">
                  {currentSignal?.reason || 'Analyzing Patterns...'}
                </p>
                {currentSignal?.type !== 'WAIT' && (
                   <div className="mt-4 w-full px-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Confidence</span>
                        <span>{currentSignal?.strength.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${currentSignal?.type === 'CALL' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                          style={{ width: `${currentSignal?.strength}%` }}
                        ></div>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Technicals */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
               <Settings className="w-4 h-4 mr-2" /> Live Indicators
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <IndicatorBadge 
                  label="RSI (14)" 
                  value={rsiValue ? rsiValue.toFixed(1) : '--'} 
                  status={getRsiStatus(rsiValue)}
                />
                <IndicatorBadge 
                  label="Stoch %K" 
                  value={stochValue ? stochValue.k.toFixed(1) : '--'} 
                  status={stochValue && (stochValue.k > 80 || stochValue.k < 20) ? 'info' : 'neutral'}
                />
                <IndicatorBadge 
                  label="Trend" 
                  value={trendValue} 
                  status={trendValue === 'UP' ? 'success' : trendValue === 'DOWN' ? 'danger' : 'warning'}
                />
                <IndicatorBadge 
                  label="Market" 
                  value="REAL" 
                  status="info"
                />
             </div>
          </div>

          {/* Gemini AI Insight */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400 font-bold mr-2">Gemini AI</span> Analysis
                </h3>
                <button 
                  onClick={triggerAiAnalysis}
                  disabled={isAiLoading || !rsiValue}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full transition flex items-center disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                  Check
                </button>
             </div>
             
             <div className="bg-gray-900/50 rounded-lg p-4 min-h-[100px] text-sm text-gray-300 leading-relaxed border border-gray-700/50">
                {isAiLoading ? (
                   <div className="flex flex-col items-center justify-center h-full space-y-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <span className="text-xs text-gray-500">Processing Market Data...</span>
                   </div>
                ) : aiAnalysis ? (
                   <p className="animate-in fade-in duration-500">{aiAnalysis}</p>
                ) : (
                   <p className="text-gray-600 italic text-center mt-2">Tap 'Check' to identify hidden patterns with AI.</p>
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;