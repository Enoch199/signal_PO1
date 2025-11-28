import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { MarketDataPoint } from '../types';

interface ChartDisplayProps {
  data: MarketDataPoint[];
  color: string;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ data, color }) => {
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">Waiting for tick data...</div>;

  const minPrice = Math.min(...data.map(d => d.close));
  const maxPrice = Math.max(...data.map(d => d.close));
  // Use slightly larger padding (20%) to keep the live point more centered and visible
  const range = maxPrice - minPrice;
  const padding = range === 0 ? maxPrice * 0.0005 : range * 0.2; 

  const lastPoint = data[data.length - 1];

  // Custom Dot Component for the live price
  const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
    if (index === data.length - 1) {
      return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} style={{ overflow: 'visible' }}>
          <circle cx="6" cy="6" r="6" fill={color} fillOpacity="0.4">
             <animate attributeName="r" from="6" to="14" dur="1.5s" repeatCount="indefinite" />
             <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="6" cy="6" r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full bg-gray-900/50 rounded-xl border border-gray-800 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900/0 to-transparent pointer-events-none" />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="time" 
            hide={true} 
            padding={{ left: 0, right: 10 }}
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]} 
            orientation="right" 
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
            tickFormatter={(value) => value.toFixed(5)}
            width={60}
            stroke="#4b5563"
            strokeWidth={0}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [value.toFixed(5), 'Price']}
            labelStyle={{ color: '#9ca3af' }}
            animationDuration={0}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false} // Disable animation to prevent lag in real-time
            dot={<CustomDot />}
          />
          {lastPoint && (
            <ReferenceLine 
              y={lastPoint.close} 
              stroke={color} 
              strokeDasharray="3 3" 
              strokeOpacity={0.8}
            >
              <Label 
                value={lastPoint.close.toFixed(5)} 
                position="insideTopRight"
                fill={color}
                fontSize={12}
                fontWeight="bold"
                offset={10}
                className="font-mono bg-gray-900"
              />
            </ReferenceLine>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartDisplay;