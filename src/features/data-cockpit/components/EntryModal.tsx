
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Member, AIDiagnosis } from '../../../types';
import { DetailedAnalysisRecord, SKUGroupMetrics } from '../types';
import { X, Sparkles, TrendingUp, TrendingDown, Info, AlertCircle, BrainCircuit, Loader2, Save, Calendar } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import TrendCharts from './TrendCharts';

interface EntryModalProps {
  product: Product;
  onClose: () => void;
  setProducts: (fn: (prev: Product[]) => Product[]) => void;
  members: Member[];
}

const EntryModal: React.FC<EntryModalProps> = ({ product, onClose, setProducts, members }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'input' | 'trends'>('input');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIDiagnosis | null>(null);

  const initialMetrics: Record<string, SKUGroupMetrics> = {
    site: { visitors: 0, buyers: 0, amount: 0 },
    search: { visitors: 0, buyers: 0 },
    keyword: { visitors: 0, buyers: 0, adCost: 0 },
    overall: { visitors: 0, buyers: 0 },
    competitor: { visitors: 0, buyers: 0 }
  };

  const [form, setForm] = useState(initialMetrics);

  const yesterday = useMemo(() => {
    const records = (product as any).detailedRecords || [];
    return records.length > 0 ? records[records.length - 1] : null;
  }, [product]);

  const handleInputChange = (group: string, field: string, value: string) => {
    const val = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: val }
    }));
  };

  const indicators = useMemo(() => {
    const calc = (b: number, v: number) => v > 0 ? parseFloat(((b / v) * 100).toFixed(2)) : 0;
    return {
      siteCVR: calc(form.site.buyers, form.site.visitors),
      searchCVR: calc(form.search.buyers, form.search.visitors),
      keywordCVR: calc(form.keyword.buyers, form.keyword.visitors),
      overallCVR: calc(form.overall.buyers, form.overall.visitors),
      roi: (form.keyword.adCost || 0) > 0 ? parseFloat(((form.site.amount || 0) / (form.keyword.adCost || 0)).toFixed(2)) : 0
    };
  }, [form]);

  const checkDeviation = (group: string, field: string) => {
    if (!yesterday) return false;
    const current = (form as any)[group][field];
    const prev = (yesterday as any)[group]?.[field] || 0;
    if (prev === 0) return false;
    return Math.abs((current - prev) / prev) > 0.3;
  };

  const saveAndAnalyze = async () => {
    setIsAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const record: DetailedAnalysisRecord = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      date: todayStr,
      ...form,
      ...indicators as any
    };

    const prompt = `你是一位顶尖电商运营总监。分析产品 [${product.name}] 的最新维度数据：
    1. 全站: UV ${record.site.visitors}, 买家 ${record.site.buyers}, 金额 ${record.site.amount} (CVR: ${record.siteCVR}%)
    2. 搜索: UV ${record.search.visitors}, 买家 ${record.search.buyers} (CVR: ${record.searchCVR}%)
    3. 关键词: UV ${record.keyword.visitors}, 买家 ${record.keyword.buyers}, 消耗 ${record.keyword.adCost} (CVR: ${record.keywordCVR}%, ROI: ${record.roi})
    4. 整体: UV ${record.overall.visitors}, 买家 ${record.overall.buyers} (CVR: ${record.overallCVR}%)
    5. 竞品: UV ${record.competitor.visitors}, 买家 ${record.competitor.buyers}
    
    生命周期阶段: ${product.lifecycleStage || '新推期'}
    昨日对比: ${yesterday ? `昨日全站CVR ${yesterday.siteCVR}%` : '无历史数据'}

    请输出 JSON 诊断：
    {
      "score": number (0-100),
      "summary": "一句话核心评价",
      "suggestion": "战术性排查或优化建议",
      "alertLevel": "normal" | "warning" | "critical"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              alertLevel: { type: Type.STRING }
            }
          }
        }
      });
      
      const diagnosis: AIDiagnosis = JSON.parse(response.text);
      setAiResult(diagnosis);
      record.aiDiagnosis = diagnosis;

      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          const records = [...((p as any).detailedRecords || [])];
          records.push(record);
          return { ...p, lastUpdateDate: todayStr, detailedRecords: records } as any;
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white/95 w-full max-w-7xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden relative border-white border">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white/50">
          <div className="flex items-center gap-6">
            <img src={product.image} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-4 border-white" />
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">{product.name}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{product.storeName} // {product.productId}</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('input')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'input' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}>数据录入</button>
            <button onClick={() => setActiveTab('trends')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'trends' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}>趋势洞察</button>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'input' ? (
            <>
              {/* Left Wing - Context */}
              <aside className="w-80 bg-slate-50/50 p-8 border-r border-slate-100 space-y-8 overflow-y-auto">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> T-1 历史对标</h4>
                {yesterday ? (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-300 uppercase">昨日全站 CVR</p>
                      <p className="text-2xl font-black text-emerald-500 num-font">{yesterday.siteCVR}%</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-300 uppercase">昨日搜索 CVR</p>
                      <p className="text-2xl font-black text-blue-500 num-font">{yesterday.searchCVR}%</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-300 uppercase">昨日投产 ROI</p>
                      <p className="text-2xl font-black text-orange-500 num-font">{yesterday.roi}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-300 text-xs italic">暂无历史参考数据</div>
                )}
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                  <Info className="text-emerald-400 mb-3" size={20} />
                  <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase">若填报偏差 &gt; 30% 系统将触发高亮警示。</p>
                </div>
              </aside>

              {/* Right Wing - Control */}
              <main className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col space-y-10 bg-white">
                <div className="grid grid-cols-2 gap-8">
                  {/* Site metrics */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">全站核心指标 (FULL-SITE)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="全站访客" className={`input-base ${checkDeviation('site', 'visitors') ? 'pulse-alert' : ''}`} onChange={e => handleInputChange('site', 'visitors', e.target.value)} />
                      <input type="number" placeholder="全站买家" className="input-base" onChange={e => handleInputChange('site', 'buyers', e.target.value)} />
                      <input type="number" placeholder="成交金额" className="input-base col-span-2" onChange={e => handleInputChange('site', 'amount', e.target.value)} />
                    </div>
                  </div>

                  {/* Search metrics */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">搜索指标 (ORGANIC SEARCH)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="搜索访客" className="input-base" onChange={e => handleInputChange('search', 'visitors', e.target.value)} />
                      <input type="number" placeholder="搜索买家" className="input-base" onChange={e => handleInputChange('search', 'buyers', e.target.value)} />
                    </div>
                  </div>

                  {/* Keyword metrics */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">直通车/关键词 (PAID ADS)</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <input type="number" placeholder="关键词访客" className="input-base" onChange={e => handleInputChange('keyword', 'visitors', e.target.value)} />
                      <input type="number" placeholder="关键词买家" className="input-base" onChange={e => handleInputChange('keyword', 'buyers', e.target.value)} />
                      <input type="number" placeholder="广告消耗" className="input-base" onChange={e => handleInputChange('keyword', 'adCost', e.target.value)} />
                    </div>
                  </div>

                  {/* Overall & Competitor */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">商品及竞品 (MARKET)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="商品总访客" className="input-base" onChange={e => handleInputChange('overall', 'visitors', e.target.value)} />
                      <input type="number" placeholder="竞品访客" className="input-base" onChange={e => handleInputChange('competitor', 'visitors', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Indicators Bar */}
                <div className="p-8 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 shadow-inner">
                  <div className="flex gap-8">
                    <div><p className="text-[9px] font-black text-slate-400">全站 CVR</p><p className="text-xl font-black text-slate-800">{indicators.siteCVR}%</p></div>
                    <div><p className="text-[9px] font-black text-slate-400">搜索 CVR</p><p className="text-xl font-black text-slate-800">{indicators.searchCVR}%</p></div>
                    <div><p className="text-[9px] font-black text-slate-400">ROI</p><p className="text-xl font-black text-blue-600">{indicators.roi}</p></div>
                  </div>
                  <button 
                    onClick={saveAndAnalyze}
                    disabled={isAiLoading}
                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-3 shadow-xl hover:bg-emerald-600 transition-all ios-btn"
                  >
                    {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                    保存并同步 AI 诊断
                  </button>
                </div>

                {/* AI Result Area */}
                {aiResult && (
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-tech italic">{aiResult.score}</div>
                        <div><h4 className="text-lg font-black">AI 战术报告</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Strategist Diagnosis</p></div>
                      </div>
                      <Sparkles className="text-blue-400" size={32} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 italic font-bold">“{aiResult.summary}”</div>
                      <div className="p-6 bg-blue-600/20 rounded-3xl border border-blue-500/30 text-blue-100 text-sm font-bold">{aiResult.suggestion}</div>
                    </div>
                  </div>
                )}
              </main>
            </>
          ) : (
            <TrendCharts records={(product as any).detailedRecords || []} />
          )}
        </div>
      </div>
      <style>{`
        .input-base { @apply w-full p-6 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 text-xl focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-inner; }
        .pulse-alert { @apply ring-4 ring-rose-500/20 bg-rose-50 border border-rose-200 animate-pulse text-rose-900; }
        .num-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
    </div>
  );
};

export default EntryModal;
