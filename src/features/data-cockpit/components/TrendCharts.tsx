
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DetailedAnalysisRecord } from '../types';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

interface TrendChartsProps {
  records: DetailedAnalysisRecord[];
}

const TrendCharts: React.FC<TrendChartsProps> = ({ records }) => {
  const [range, setRange] = useState<7 | 14 | 30>(7);
  const [metric, setMetric] = useState<string>('siteCVR');

  const chartData = useMemo(() => {
    return records.slice(-range).map(r => ({
      date: r.date.split('-').slice(1).join('/'),
      value: (r as any)[metric]
    }));
  }, [records, range, metric]);

  const metrics = [
    { id: 'siteCVR', label: '全站 CVR', color: '#10b981' },
    { id: 'searchCVR', label: '搜索 CVR', color: '#3b82f6' },
    { id: 'roi', label: 'ROI', color: '#f59e0b' },
    { id: 'overallCVR', label: '整体 CVR', color: '#6366f1' }
  ];

  return (
    <div className="flex-1 p-10 flex flex-col space-y-8 bg-white overflow-y-auto">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {metrics.map(m => (
            <button 
              key={m.id} 
              onClick={() => setMetric(m.id)}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${metric === m.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {[7, 14, 30].map(r => (
            <button key={r} onClick={() => setRange(r as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${range === r ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>{r}天</button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-[3rem] p-10 border border-slate-100 shadow-inner min-h-[400px]">
        <div className="mb-6 flex items-center gap-3">
           <Activity className="text-slate-300" size={24} />
           <h4 className="text-xl font-black text-slate-800 tracking-tight">指标趋势可视化分析</h4>
        </div>
        <div className="w-full h-full pb-10">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metrics.find(m => m.id === metric)?.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={metrics.find(m => m.id === metric)?.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-white/10 text-white">
                          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{payload[0].payload.date}</p>
                          <p className="text-2xl font-tech font-black italic">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metrics.find(m => m.id === metric)?.color} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;
