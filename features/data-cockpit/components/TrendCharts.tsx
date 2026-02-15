
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DetailedAnalysisRecord } from '../types.ts';
import { TrendingUp, Activity, BarChart2, ShieldCheck, Zap } from 'lucide-react';

interface TrendChartsProps {
  records: DetailedAnalysisRecord[];
}

const TrendCharts: React.FC<TrendChartsProps> = ({ records }) => {
  const [range, setRange] = useState<7 | 14 | 30>(7);
  const [metricType, setMetricType] = useState<'CVR' | 'Buyers'>('CVR');

  const chartData = useMemo(() => {
    return records.slice(-range).map(r => ({
      date: r.date.split('-').slice(1).join('/'),
      selfCVR: r.siteCVR || 0,
      compCVR: r.competitor?.overallCVR || 0,
      selfBuyers: r.site?.buyers || 0,
      compBuyers: r.competitor?.overallBuyers || 0
    }));
  }, [records, range]);

  return (
    <div className="flex-1 p-10 flex flex-col space-y-8 bg-white overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setMetricType('CVR')} 
            className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${metricType === 'CVR' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}
          >
            转化率对比 (CVR)
          </button>
          <button 
            onClick={() => setMetricType('Buyers')} 
            className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${metricType === 'Buyers' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}
          >
            成交人数对比
          </button>
        </div>
        <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
          {[7, 14, 30].map(r => (
            <button 
              key={r} 
              onClick={() => setRange(r as any)} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${range === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
            >
              {r}天
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-[3rem] p-10 border border-slate-100 shadow-inner min-h-[450px] relative overflow-hidden flex flex-col">
        <div className="mb-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                 <Zap size={20} />
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-800 tracking-tight italic">本品 VS 竞品 数字化轨迹</h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Metric: {metricType} // Perspective: Market Benchmarking</p>
              </div>
           </div>
           <div className="flex items-center gap-8 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">本品表现</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">竞品对标</span>
              </div>
           </div>
        </div>

        <div className="flex-1 w-full pb-4">
           {chartData.length > 1 ? (
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSelf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 p-5 rounded-[2rem] shadow-2xl border border-white/10 text-white space-y-3">
                            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest border-b border-white/10 pb-2">{payload[0].payload.date}</p>
                            <div className="flex items-center justify-between gap-8">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                  <span className="text-[10px] font-black text-slate-400">本品:</span>
                               </div>
                               <span className="text-lg font-tech font-black italic text-blue-400">{payload[0].value}{metricType === 'CVR' ? '%' : ''}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                  <span className="text-[10px] font-black text-slate-400">竞品:</span>
                               </div>
                               <span className="text-lg font-tech font-black italic text-slate-400">{payload[1]?.value}{metricType === 'CVR' ? '%' : ''}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={metricType === 'CVR' ? 'selfCVR' : 'selfBuyers'} 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSelf)" 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={metricType === 'CVR' ? 'compCVR' : 'compBuyers'} 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorComp)" 
                    animationDuration={1500}
                  />
                </AreaChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <BarChart2 size={48} className="opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest">需要至少 2 天的运营数据以生成对比轨迹</p>
             </div>
           )}
        </div>

        <div className="mt-6 p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <ShieldCheck className="text-emerald-500" size={24} />
              <div className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">趋势图已自动整合竞品全站及整体表现。</div>
           </div>
           <Activity className="text-slate-100" size={32} />
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;
