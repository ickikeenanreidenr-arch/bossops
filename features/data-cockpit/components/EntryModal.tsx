
import React, { useState, useMemo } from 'react';
import { Product, Member, AIDiagnosis } from '../../../types.ts';
import { DetailedAnalysisRecord, AIReport } from '../types.ts';
import { X, Calendar, Target, BarChart3, Users, SearchCode, Zap, ChevronRight, Activity, Info, BrainCircuit, Loader2, Percent, Wallet, MousePointerClick, TrendingUp, TrendingDown, History, ShieldAlert, Sparkles, Layout, BarChart2, CheckCircle2, LineChart as LucideLineChart, Layers } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import TrendCharts from './TrendCharts.tsx';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface EntryModalProps {
  product: Product;
  onClose: () => void;
  setProducts: (fn: (prev: Product[]) => Product[]) => void;
  members: Member[];
}

const EntryModal: React.FC<EntryModalProps> = ({ product, onClose, setProducts, members }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends'>('dashboard');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIReport | null>(null);

  const initialForm = {
    site: { visitors: 0, buyers: 0, spend: 0, amount: 0 },
    keyword: { visitors: 0, buyers: 0, spend: 0, amount: 0 },
    product: { searchVisitors: 0, searchBuyers: 0, paidSpend: 0, amount: 0, totalBuyers: 0 },
    competitor: { siteBuyers: 0, siteCVR: 0, keywordBuyers: 0, keywordCVR: 0, overallBuyers: 0, overallCVR: 0 }
  };

  const [form, setForm] = useState(initialForm);

  const records = useMemo(() => (product as any).detailedRecords || [], [product]);
  const yesterday: DetailedAnalysisRecord | null = useMemo(() => records.length > 0 ? records[records.length - 1] : null, [records]);

  const handleInputChange = (group: keyof typeof initialForm, field: string, value: string) => {
    const val = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: val }
    }));
  };

  const indicators = useMemo(() => {
    const calcCVR = (b: number, v: number) => v > 0 ? parseFloat(((b / v) * 100).toFixed(2)) : 0;
    const calcROI = (a: number, s: number) => s > 0 ? parseFloat((a / s).toFixed(2)) : 0;
    
    return {
      siteCVR: calcCVR(form.site.buyers, form.site.visitors),
      siteROI: calcROI(form.site.amount, form.site.spend),
      keywordCVR: calcCVR(form.keyword.buyers, form.keyword.visitors),
      keywordROI: calcROI(form.keyword.amount, form.keyword.spend),
      searchCVR: calcCVR(form.product.searchBuyers, form.product.searchVisitors),
      productOverallROI: calcROI(form.product.amount, form.product.paidSpend)
    };
  }, [form]);

  const checkDeviation = (group: keyof typeof initialForm, field: string) => {
    if (!yesterday) return false;
    const prev = (yesterday as any)[group]?.[field] || 0;
    if (prev === 0) return false;
    const current = (form[group] as any)[field];
    return Math.abs((current - prev) / prev) > 0.3;
  };

  const saveAndAnalyze = async () => {
    setIsAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const record: DetailedAnalysisRecord = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      date: todayStr,
      lifecycleStage: product.lifecycleStage || 'new_arrival',
      ...form,
      ...indicators
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `分析商品数据：全站CVR ${indicators.siteCVR}%, ROI ${indicators.siteROI}。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              alertLevel: { type: Type.STRING },
              actionPriority: { type: Type.STRING }
            }
          }
        }
      });
      
      const diagnosis = JSON.parse(response.text);
      const report: AIReport = { ...diagnosis, timestamp: new Date().toISOString() };
      setAiResult(report);
      record.aiDiagnosis = report;

      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          const updatedRecords = [...((p as any).detailedRecords || []), record];
          return { ...p, lastUpdateDate: todayStr, detailedRecords: updatedRecords } as any;
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const MetricCard = ({ label, group, field, icon: Icon, colorClass = "text-white/90" }: any) => {
    const isAnomaly = checkDeviation(group, field);
    const sparkData = records.slice(-7).map((r: any) => ({ value: r[group]?.[field] || 0 }));

    return (
      <div className={`glass-metric-card group/card ${isAnomaly ? 'pulse-rose' : ''}`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Icon size={12} className="opacity-50" /> {label}
          </span>
          {sparkData.length > 1 && (
            <div className="w-10 h-3 opacity-20 group-hover/card:opacity-60 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="value" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="relative">
          <input 
            type="number" 
            placeholder="0"
            className={`w-full bg-transparent border-none outline-none text-3xl font-tech font-black transition-all placeholder:text-white/5 ${colorClass}`}
            onChange={e => handleInputChange(group, field, e.target.value)}
          />
          {isAnomaly && <ShieldAlert size={14} className="absolute top-1/2 right-0 -translate-y-1/2 text-rose-500 animate-pulse" />}
        </div>
        {yesterday && (
          <p className="text-[9px] font-bold text-white/20 mt-2 tracking-tighter uppercase">Yesterday: {(yesterday as any)[group][field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Aurora Background Effect inside Modal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px] animate-aurora-move"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] animate-aurora-move" style={{animationDelay: '-5s'}}></div>
      </div>

      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-[1400px] h-[92vh] rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative border border-white/20">
        
        {/* Header - Transparent Glass */}
        <header className="flex justify-between items-center px-12 py-8 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-8">
            <div className="relative">
              <img src={product.image} className="w-20 h-20 rounded-[2rem] object-cover shadow-2xl border-2 border-white/20" />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl border border-white/10 shadow-lg">
                <Activity size={16} className="animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-boss tracking-tight italic text-white/95 leading-none">{product.name}</h2>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-3">{product.storeName} // {product.productId}</p>
            </div>
          </div>
          
          <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('dashboard')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-xl text-slate-950 scale-105' : 'text-white/40 hover:text-white/70'}`}>极简看板</button>
            <button onClick={() => setActiveTab('trends')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'trends' ? 'bg-white shadow-xl text-slate-950 scale-105' : 'text-white/40 hover:text-white/70'}`}>趋势洞察</button>
          </div>

          <button onClick={onClose} className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/10 active:scale-95 group">
            <X size={32} className="text-white/40 group-hover:text-white"/>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-8 bg-transparent">
          
          {/* Section 1: Top Metrics (1:1:1:1 Layout) */}
          <section className="grid grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-700">
            <MetricCard label="全站访客" group="site" field="visitors" icon={Users} colorClass="text-blue-400" />
            <MetricCard label="全站成交人数" group="site" field="buyers" icon={CheckCircle2} colorClass="text-emerald-400" />
            <MetricCard label="全站花费" group="site" field="spend" icon={Wallet} colorClass="text-rose-400" />
            <MetricCard label="全站成交金额" group="site" field="amount" icon={BarChart2} colorClass="text-blue-500 font-tech" />
          </section>

          {/* Section 2: Middle Metrics (2:1 Layout) */}
          <section className="grid grid-cols-3 gap-8">
            {/* 商品整体核心指标 (flex: 2) */}
            <div className="col-span-2 glass-panel-card p-10 space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h5 className="text-xl font-boss italic text-white/90 tracking-wide flex items-center gap-3">
                  <Target size={24} className="text-emerald-400" /> 商品整体核心指标
                </h5>
                <div className="flex gap-10">
                   <div className="text-right">
                     <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">搜索转化率</p>
                     <p className="text-3xl font-tech font-black text-emerald-400">{indicators.searchCVR}%</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">产品整体 ROI</p>
                     <p className="text-3xl font-tech font-black text-blue-400">{indicators.productOverallROI}</p>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">商品搜索访客</label>
                  <input type="number" className="glass-input" onChange={e => handleInputChange('product', 'searchVisitors', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">搜索成交人数</label>
                  <input type="number" className="glass-input" onChange={e => handleInputChange('product', 'searchBuyers', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">整体付费花费</label>
                  <input type="number" className="glass-input text-rose-400" onChange={e => handleInputChange('product', 'paidSpend', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">总成交金额</label>
                  <input type="number" className="glass-input text-emerald-500 font-tech" onChange={e => handleInputChange('product', 'amount', e.target.value)} />
                </div>
              </div>
            </div>

            {/* 竞品核心指标 (flex: 1) */}
            <div className="glass-panel-card p-10 flex flex-col">
              <h5 className="text-xl font-boss italic text-white/90 tracking-wide flex items-center gap-3 mb-10">
                <Users size={24} className="text-slate-400" /> 竞品核心指标
              </h5>
              <div className="space-y-8 flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">竞品全站支付</label>
                  <input type="number" className="glass-input" onChange={e => handleInputChange('competitor', 'siteBuyers', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">整体转化率 %</label>
                  <input type="number" className="glass-input font-tech text-slate-300" onChange={e => handleInputChange('competitor', 'overallCVR', e.target.value)} />
                </div>
              </div>
              <div className="mt-8 p-5 bg-slate-900/40 rounded-3xl border border-white/5 text-[10px] font-bold text-white/40 leading-relaxed uppercase italic">
                对标竞品 CVR 是发现自身点击/转化短板的关键闭环。
              </div>
            </div>
          </section>

          {/* Section 3: Bottom Section (2:1 Layout) */}
          <section className="grid grid-cols-3 gap-8">
            {/* 历史趋势图 (flex: 2) */}
            <div className="col-span-2 glass-panel-card p-8 min-h-[400px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                   <LucideLineChart size={18} className="text-blue-400" /> 核心数据轨迹 (7D)
                 </h5>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] font-black text-white/30 uppercase">全站 CVR</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black text-white/30 uppercase">搜索 CVR</span></div>
                 </div>
               </div>
               <div className="flex-1 w-full bg-black/10 rounded-[2rem] p-4 overflow-hidden">
                 <TrendCharts records={records} />
               </div>
            </div>

            {/* AI 分析结果 (flex: 1) */}
            <div className="glass-panel-card p-10 flex flex-col justify-between group/ai">
              {!aiResult && !isAiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center text-white/10 group-hover/ai:text-blue-400/20 transition-all">
                    <BrainCircuit size={48} />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-black text-white/50 uppercase tracking-widest">等待数据输入完成</h5>
                    <p className="text-[10px] text-white/20 font-bold uppercase italic">Activate AI Strategist for Insights</p>
                  </div>
                </div>
              ) : isAiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <Loader2 size={64} className="text-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center"><Zap size={24} className="text-blue-400 animate-pulse" /></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h5 className="text-base font-black text-white uppercase tracking-widest animate-pulse">正在深度诊断资产流...</h5>
                    <p className="text-[10px] text-white/20 font-bold uppercase italic">BOSSOPS INTELLIGENCE ON-STREAM</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl font-black font-tech italic shadow-2xl ${aiResult!.score > 80 ? 'bg-emerald-500 shadow-emerald-500/20' : aiResult!.score > 60 ? 'bg-blue-600 shadow-blue-500/20' : 'bg-rose-600 shadow-rose-500/20'} text-white`}>
                      {aiResult!.score}
                    </div>
                    <div>
                      <h4 className="text-2xl font-boss italic text-white/90">AI 诊断报告</h4>
                      <div className={`inline-block px-3 py-0.5 rounded-lg text-[8px] font-black uppercase mt-1 tracking-widest ${aiResult!.alertLevel === 'critical' ? 'bg-rose-500 text-white' : 'bg-blue-500/30 text-blue-400'}`}>
                        {aiResult!.alertLevel === 'critical' ? '核心风险警示' : '业务状态稳健'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><History size={14}/> 核心诊断 (SUMMARY)</p>
                       <p className="text-base font-bold text-white/80 leading-relaxed italic border-l-4 border-blue-500/40 pl-6 pr-4">“{aiResult!.summary}”</p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={14}/> 实操建议 (ACTIONABLE)</p>
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-sm font-bold text-white/70 leading-relaxed">
                          {aiResult!.suggestion}
                       </div>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={saveAndAnalyze} 
                disabled={isAiLoading}
                className="w-full py-5 mt-8 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-4 group/btn"
              >
                {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} className="group-hover/btn:scale-110 transition-transform"/>}
                {aiResult ? '更新数据并重新诊断' : '启动 AI 资产诊断'}
              </button>
            </div>
          </section>

        </main>
      </div>

      <style>{`
        .glass-metric-card {
          @apply bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 
                 hover:translate-y-[-5px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-white/15 
                 transition-all duration-500 ease-out cursor-default;
        }
        .glass-panel-card {
          @apply bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-xl 
                 hover:shadow-[0_30px_70px_rgba(0,0,0,0.4)] transition-all duration-500 ease-out;
        }
        .glass-input {
          @apply w-full bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-white font-bold text-xl
                 focus:bg-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-white/5;
        }
        .pulse-rose {
          @apply border-rose-500/40 bg-rose-500/10;
          animation: glass-pulse-rose 2.5s infinite ease-in-out;
        }
        @keyframes glass-pulse-rose {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.3); border-color: rgba(244, 63, 94, 0.4); }
          70% { box-shadow: 0 0 30px 15px rgba(244, 63, 94, 0); border-color: rgba(244, 63, 94, 0.1); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); border-color: rgba(244, 63, 94, 0.4); }
        }
        .font-tech { font-family: 'Orbitron', sans-serif; }
        .font-boss { font-family: 'ZCOOL QingKe HuangYou', cursive; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          @apply bg-white/10 rounded-full;
        }
        @keyframes aurora-move {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15%, 15%) rotate(180deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        .animate-aurora-move {
          animation: aurora-move 20s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default EntryModal;
