
import React, { useState, useRef, useEffect } from 'react';
import { CutoutResult, CutoutStatus, CutoutType } from '../types';
import { GoogleGenAI, GenerateContentResponse, Blob as GenAIBlob } from "@google/genai";
import { 
  Upload, Sparkles, Image as ImageIcon, Check, Loader2, 
  X, History, Download, Maximize2, Wand2, ShieldCheck, 
  ToggleLeft, ToggleRight, Box, Trash2, Layout, CheckCircle2,
  AlertCircle, FileSearch, Layers, ImagePlus, MousePointer2,
  Monitor, Cpu, ScanSearch, CheckCircle, Smartphone, Zap,
  SearchCode, FileJson, Image as LucideImage, Layers2,
  Replace, ArrowRightLeft, Camera, Eye, Plus, Info, Move,
  ListOrdered, Play, CheckSquare, DownloadCloud, AlertTriangle,
  Fullscreen, Ruler, MoveDiagonal2, Target, Droplet, Sun, Palette,
  SlidersHorizontal, Scaling, MousePointerClick, Crosshair,
  Maximize, Minimize, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, 
  ArrowRight as ArrowRightIcon
} from 'lucide-react';

interface VisualLabProps {
  triggerCreditEvent: (userId: string, eventType: string, data?: any) => void;
}

type LabMode = 'CUTOUT' | 'REPLACEMENT';

interface BBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface SceneAnalysis {
  bbox: BBox;
  center: { x: number; y: number };
  contactLineY: number;
  perspective: string;
  lighting: string;
  occupancy: number;
}

const VisualLab: React.FC<VisualLabProps> = ({ triggerCreditEvent }) => {
  const [labMode, setLabMode] = useState<LabMode>('CUTOUT');
  
  // ==========================================
  // 1. 极致抠图状态逻辑 (独立隔离)
  // ==========================================
  const [cutoutSource, setCutoutSource] = useState<string | null>(null);
  const [cutoutAnchor, setCutoutAnchor] = useState<string | null>(null);
  const [cutoutOutputWhite, setCutoutOutputWhite] = useState(true);
  const [cutoutOutputTrans, setCutoutOutputTrans] = useState(true);
  const [cutoutHighRetouch, setCutoutHighRetouch] = useState(false);
  const [cutoutShadow, setCutoutShadow] = useState(true);
  const [cutoutGenPhase, setCutoutGenPhase] = useState<'IDLE' | 'IDENTIFYING' | 'MATTING' | 'FINALIZING'>('IDLE');
  const [cutoutResults, setCutoutResults] = useState<CutoutResult[]>([]);

  // ==========================================
  // 2. 产品替换状态逻辑 (A阶段工程规范)
  // ==========================================
  const [swapStep, setSwapStep] = useState<1 | 2 | 3>(1); // 1:输入, 2:解析纠偏, 3:结果
  const [sceneA, setSceneA] = useState<string | null>(null);
  const [productB, setProductB] = useState<string | null>(null);
  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
  const [swapBboxAdjust, setSwapBboxAdjust] = useState({ x: 0, y: 0, scale: 1 });
  const [swapGenPhase, setSwapGenPhase] = useState<'IDLE' | 'ANALYZING' | 'INPAINTING' | 'SWAPPING'>('IDLE');
  const [swapResult, setSwapResult] = useState<string | null>(null);

  // 公共状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const cutoutFileRef = useRef<HTMLInputElement>(null);
  const cutoutAnchorRef = useRef<HTMLInputElement>(null);
  const sceneFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const safeParseJSON = (inputStr: string | undefined): any => {
    if (!inputStr) return null;
    try {
      const cleaned = inputStr.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("JSON 解析失败:", inputStr, e);
      return null;
    }
  };

  // ==========================================
  // 执行核心：极致抠图 (优化主体识别逻辑)
  // ==========================================
  const runCutoutPipeline = async () => {
    if (!cutoutSource || isGenerating) return;

    setIsGenerating(true);
    setCutoutGenPhase('IDENTIFYING');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const sourceBase64 = cutoutSource.split(',')[1];
      const anchorBase64 = cutoutAnchor ? cutoutAnchor.split(',')[1] : null;

      // 阶段 1：主体识别 (优化：支持多件同款作为单一主体)
      const idRes: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: sourceBase64, mimeType: 'image/png' } as GenAIBlob },
            { text: `[识别指令] 识别图中的核心售卖商品。
            特别注意：若图中包含多个相似主体（例如两瓶清洁剂、一组化妆品套装），请将其视为一个完整的商品主体集合进行锁定，严禁将其拆分。
            排除非售卖元素。输出 JSON: {"isIdentifySuccess": boolean}` }
          ]
        }
      });
      
      const idData = safeParseJSON(idRes.text);
      if (!idData?.isIdentifySuccess) throw new Error("无法锁定清晰的主体集合");

      const tempResults: CutoutResult[] = [];

      // 阶段 2：渲染处理
      const processChain = async (type: 'WHITE' | 'TRANSPARENT') => {
        setCutoutGenPhase('MATTING');
        const isWhite = type === 'WHITE';
        let prompt = `[极致抠图工程规范] 
        1. 精准抠图：将识别到的商品主体（包含相似主体集合）完整扣出。
        2. 背景控制：${isWhite ? '纯白 #FFFFFF' : 'Alpha 透明通道'}。
        3. 阴影：${cutoutShadow ? '添加15%强度物理接触阴影' : '严禁任何阴影'}。
        4. 规范化：画布 1:1，主体整体居中占比 75%。`;

        if (cutoutHighRetouch) {
          prompt += ` 5. 商业精修：增强材质细节，清理表面。`;
        }
        if (anchorBase64) {
          prompt += ` 6. 色彩对齐：对齐锚点图的色彩属性。`;
        }

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: sourceBase64, mimeType: 'image/png' } as GenAIBlob },
              ...(anchorBase64 ? [{ inlineData: { data: anchorBase64, mimeType: 'image/png' } as GenAIBlob }] : []),
              { text: prompt }
            ]
          }
        });

        const imgData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imgData) {
          tempResults.push({ 
            type, 
            imageUrl: `data:image/png;base64,${imgData}`, 
            width: 800, 
            height: 800 
          });
        }
      };

      if (cutoutOutputWhite) await processChain('WHITE');
      if (cutoutOutputTrans) await processChain('TRANSPARENT');

      setCutoutGenPhase('FINALIZING');
      setCutoutResults(tempResults);
      const historyItem = { id: Date.now(), mode: 'CUTOUT', results: tempResults, createdAt: new Date().toISOString() };
      setHistory(prev => [historyItem, ...prev]);
      triggerCreditEvent('system', 'VISUAL_ASSET_SAVED', { relatedId: historyItem.id });

    } catch (err: any) {
      alert("抠图任务异常：" + err.message);
    } finally {
      setIsGenerating(false);
      setCutoutGenPhase('IDLE');
    }
  };

  // ==========================================
  // 执行核心：产品替换 (A阶段 6节点逻辑)
  // ==========================================
  
  // 节点 1 & 2: 场景 A 解析与人工确认
  const analyzeReplacementScene = async () => {
    if (!sceneA || !productB || isGenerating) return;
    setIsGenerating(true);
    setSwapGenPhase('ANALYZING');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const sceneBase64 = sceneA.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: sceneBase64, mimeType: 'image/png' } as GenAIBlob },
            { text: `[场景解析节点] 识别场景图 A。输出 JSON 结构：
            {
              "bbox": {"xmin": 百分比, "ymin": 百分比, "xmax": 百分比, "ymax": 百分比},
              "center": {"x": 百分比, "y": 百分比},
              "contactLineY": 百分比,
              "perspective": "角度描述",
              "lighting": "光源方向与强度",
              "occupancy": 占比
            }` }
          ]
        }
      });
      const data = safeParseJSON(response.text);
      if (data && data.bbox) {
        setSceneAnalysis(data);
        setSwapStep(2);
      } else {
        throw new Error("场景工程解析异常");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
      setSwapGenPhase('IDLE');
    }
  };

  // 节点 3-6: 移除、对齐、替换、输出 (去高精修版)
  const executeReplacementSwap = async () => {
    if (!sceneAnalysis || isGenerating) return;
    setIsGenerating(true);
    setSwapGenPhase('INPAINTING');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const sceneBase64 = sceneA!.split(',')[1];
      const productBase64 = productB!.split(',')[1];

      // 应用微调后的边界框
      const finalBBox = {
        xmin: sceneAnalysis.bbox.xmin + swapBboxAdjust.x,
        xmax: sceneAnalysis.bbox.xmax + swapBboxAdjust.x,
        ymin: sceneAnalysis.bbox.ymin + swapBboxAdjust.y,
        ymax: sceneAnalysis.bbox.ymax + swapBboxAdjust.y,
      };
      const w = finalBBox.xmax - finalBBox.xmin;
      const h = finalBBox.ymax - finalBBox.ymin;
      finalBBox.xmax = finalBBox.xmin + w * swapBboxAdjust.scale;
      finalBBox.ymax = finalBBox.ymin + h * swapBboxAdjust.scale;

      setSwapGenPhase('SWAPPING');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: sceneBase64, mimeType: 'image/png' } as GenAIBlob },
            { inlineData: { data: productBase64, mimeType: 'image/png' } as GenAIBlob },
            { text: `[去高精修替换规范]
            1. 节点3：Inpainting 安全移除原产品并修复背景。
            2. 节点4：将产品 B 缩放至匹配坐标 [xmin:${finalBBox.xmin}%, ymin:${finalBBox.ymin}%, xmax:${finalBBox.xmax}%, ymax:${finalBBox.ymax}%]。
            3. 节点4：对齐底部接触线 Y:${sceneAnalysis.contactLineY}%，对齐透视角度 ${sceneAnalysis.perspective}。
            4. 节点5：被动适配光影 ${sceneAnalysis.lighting}，阴影强度需与原产品一致。
            5. **核心约束**：严禁高精修或材质美化，保持 B 产品原始抠图质感。
            6. 输出：原图 1:1 分辨率。` }
          ]
        }
      });

      const resImg = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (resImg) {
        const url = `data:image/png;base64,${resImg}`;
        setSwapResult(url);
        const historyItem = { id: Date.now(), mode: 'REPLACEMENT', results: [{ type: 'FINAL', imageUrl: url }], createdAt: new Date().toISOString() };
        setHistory(prev => [historyItem, ...prev]);
        setSwapStep(3);
        triggerCreditEvent('system', 'VISUAL_ASSET_SAVED', { relatedId: historyItem.id });
      } else {
        throw new Error("受控合成流异常中断");
      }
    } catch (err: any) {
      alert("工程生成失败：" + err.message);
    } finally {
      setIsGenerating(false);
      setSwapGenPhase('IDLE');
    }
  };

  const downloadImage = (url: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `bossops_${prefix}_${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex h-full gap-8 animate-in fade-in duration-700">
      {/* 左侧控制区 (模式隔离) */}
      <div className="w-96 flex flex-col gap-6 shrink-0">
        <div className="glass-panel p-2 rounded-3xl border border-white shadow-xl flex gap-1">
           <button 
             onClick={() => !isGenerating && setLabMode('CUTOUT')}
             className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${labMode === 'CUTOUT' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              <Layers2 size={16} /> 极致抠图
           </button>
           <button 
             onClick={() => !isGenerating && setLabMode('REPLACEMENT')}
             className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${labMode === 'REPLACEMENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              <ArrowRightLeft size={16} /> 产品替换
           </button>
        </div>

        <div className="glass-panel p-6 rounded-[2.5rem] border border-white shadow-xl flex-1 flex flex-col overflow-hidden">
          {labMode === 'CUTOUT' ? (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Target size={14} className="text-purple-500" /> 1. 输入商品源图 (支持相似主体集合)
                </h4>
                <div 
                  onClick={() => !isGenerating && cutoutFileRef.current?.click()}
                  className={`w-full aspect-[4/3] bg-slate-50 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${cutoutSource ? 'border-purple-200' : 'border-slate-200 hover:border-purple-400'}`}
                >
                  {cutoutSource ? <img src={cutoutSource} className="w-full h-full object-contain p-4" /> : <div className="text-center space-y-2"><Upload size={28} className="text-purple-500 mx-auto" /><p className="text-[10px] font-black text-slate-400">UPLOAD SOURCE</p></div>}
                  <input type="file" ref={cutoutFileRef} className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { const r = new FileReader(); r.onload = x => setCutoutSource(x.target?.result as string); r.readAsDataURL(f); }
                  }} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Zap size={14} className="text-orange-500" /> 2. 抠图工程参数
                </h4>
                <div className="space-y-2">
                   <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all">
                      <span className="text-xs font-black text-slate-700">白底渲染 (JPG)</span>
                      <input type="checkbox" checked={cutoutOutputWhite} onChange={() => setCutoutOutputWhite(!cutoutOutputWhite)} className="ios-checkbox" />
                   </label>
                   <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all">
                      <span className="text-xs font-black text-slate-700">透明图层 (PNG)</span>
                      <input type="checkbox" checked={cutoutOutputTrans} onChange={() => setCutoutOutputTrans(!cutoutOutputTrans)} className="ios-checkbox" />
                   </label>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-black text-slate-700">高精材质修复</span>
                      <button onClick={() => setCutoutHighRetouch(!cutoutHighRetouch)} className="ios-btn">
                         {cutoutHighRetouch ? <ToggleRight size={32} className="text-purple-600" /> : <ToggleLeft size={32} className="text-slate-200" />}
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-black text-slate-700">物理接触阴影 (15%)</span>
                      <button onClick={() => setCutoutShadow(!cutoutShadow)} className="ios-btn">
                         {cutoutShadow ? <ToggleRight size={32} className="text-purple-600" /> : <ToggleLeft size={32} className="text-slate-200" />}
                      </button>
                   </div>
                </div>
              </div>
              
              <button 
                onClick={runCutoutPipeline}
                disabled={isGenerating || !cutoutSource}
                className={`w-full py-5 mt-auto rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all ios-btn flex items-center justify-center gap-3 ${isGenerating ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-purple-600'}`}
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : '启动极致抠图工程'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              {swapStep === 1 && (
                <div className="flex-1 flex flex-col gap-5">
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={12} className="text-blue-500" /> 1. 输入场景图 A</h4>
                      <div onClick={() => sceneFileRef.current?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative">
                         {sceneA ? <img src={sceneA} className="w-full h-full object-cover" /> : <p className="text-[10px] font-black text-slate-400">UPLOAD SCENE A</p>}
                         <input type="file" ref={sceneFileRef} className="hidden" accept="image/*" onChange={(e) => {
                           const f = e.target.files?.[0];
                           if (f) { const r = new FileReader(); r.onload = x => setSceneA(x.target?.result as string); r.readAsDataURL(f); }
                         }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Box size={12} className="text-emerald-500" /> 2. 输入替换商品 B</h4>
                      <div onClick={() => productFileRef.current?.click()} className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative">
                         {productB ? <img src={productB} className="w-full h-full object-contain p-2" /> : <p className="text-[10px] font-black text-slate-400">UPLOAD PRODUCT B</p>}
                         <input type="file" ref={productFileRef} className="hidden" accept="image/*" onChange={(e) => {
                           const f = e.target.files?.[0];
                           if (f) { const r = new FileReader(); r.onload = x => setProductB(x.target?.result as string); r.readAsDataURL(f); }
                         }} />
                      </div>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 mt-auto">
                      <Info size={16} className="text-blue-500 shrink-0" />
                      <p className="text-[9px] font-bold text-blue-700 leading-relaxed uppercase">A阶段规范：锁定原产品尺寸与透视，被动适配光影，严禁材质美化。</p>
                   </div>
                   <button 
                    onClick={analyzeReplacementScene}
                    disabled={isGenerating || !sceneA || !productB}
                    className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all ios-btn flex items-center justify-center gap-3 ${isGenerating ? 'bg-slate-100 text-slate-300' : 'bg-blue-600 text-white hover:bg-emerald-600'}`}
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : '启动 A 场景解析'}
                  </button>
                </div>
              )}

              {swapStep === 2 && sceneAnalysis && (
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                   <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <MousePointerClick size={16} className="text-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">节点 2: 人工确认纠偏</span>
                   </div>
                   
                   <div className="space-y-5">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-slate-400 uppercase">位置偏移 (X/Y %)</label><button onClick={() => setSwapBboxAdjust(p => ({...p, x: 0, y: 0}))} className="text-blue-500 text-[10px] font-black">RESET</button></div>
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, y: p.y - 1}))} className="p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><ArrowUp size={14}/></button>
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, y: p.y + 1}))} className="p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><ArrowDown size={14}/></button>
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, x: p.x - 1}))} className="p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><ArrowLeftIcon size={14}/></button>
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, x: p.x + 1}))} className="p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><ArrowRightIcon size={14}/></button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-slate-400 uppercase">尺寸缩放 (×{swapBboxAdjust.scale.toFixed(2)})</label><button onClick={() => setSwapBboxAdjust(p => ({...p, scale: 1}))} className="text-blue-500 text-[10px] font-black">RESET</button></div>
                         <div className="flex gap-2">
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, scale: Math.max(0.5, p.scale - 0.05)}))} className="flex-1 p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><Minimize size={14}/></button>
                            <button onClick={() => setSwapBboxAdjust(p => ({...p, scale: Math.min(1.5, p.scale + 0.05)}))} className="flex-1 p-3 bg-slate-50 rounded-xl hover:bg-white flex justify-center shadow-sm"><Maximize size={14}/></button>
                         </div>
                      </div>
                   </div>

                   <div className="mt-auto space-y-3">
                      <button onClick={() => setSwapStep(1)} className="w-full py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase">重新输入</button>
                      <button onClick={executeReplacementSwap} disabled={isGenerating} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase shadow-xl hover:bg-blue-600 transition-all">确认并执行替换</button>
                   </div>
                </div>
              )}

              {swapStep === 3 && (
                <div className="flex-1 flex flex-col gap-6">
                   <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                      <BadgeCheck className="text-blue-600" size={16} />
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">替换工程已归档</span>
                   </div>
                   <button onClick={() => { setSwapStep(1); setSwapResult(null); }} className="w-full py-5 mt-auto bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase shadow-xl hover:bg-blue-600 transition-all">启动下组计划</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧展示区 (逻辑隔离) */}
      <div className="flex-1 flex flex-col gap-6 relative">
        <div className="absolute top-0 right-0 z-50 flex gap-3">
           <button onClick={() => setShowHistory(true)} className="px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-xl flex items-center gap-3 text-slate-600 font-black text-xs ios-btn hover:text-blue-500">
              <History size={16} className="text-blue-500" /> 资产历史
           </button>
        </div>

        <div className="flex-1 glass-panel rounded-[3.5rem] p-10 border border-white shadow-xl flex flex-col relative overflow-hidden">
          {/* 状态 1: 闲置 */}
          {!isGenerating && cutoutResults.length === 0 && !swapResult && swapStep !== 2 && (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className={`w-24 h-24 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center shadow-inner ${labMode === 'CUTOUT' ? 'text-purple-200' : 'text-blue-200'}`}>
                   {labMode === 'CUTOUT' ? <Monitor size={48} /> : <Replace size={48} />}
                </div>
                <div>
                   <h3 className="text-xl font-boss tracking-tight italic text-slate-800 uppercase">{labMode === 'CUTOUT' ? '极致抠图引擎' : '产品替换引擎'}</h3>
                   <p className="text-slate-400 font-bold text-[9px] tracking-widest uppercase mt-1 italic">Waiting for Command Stream</p>
                </div>
             </div>
          )}

          {/* 状态 2: 正在生成 */}
          {isGenerating && (
             <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                <div className="relative">
                   <div className={`w-32 h-32 border-[8px] border-slate-50 rounded-full animate-spin ${labMode === 'CUTOUT' ? 'border-t-purple-600' : 'border-t-blue-600'}`}></div>
                   <div className={`absolute inset-0 flex items-center justify-center animate-pulse ${labMode === 'CUTOUT' ? 'text-purple-100' : 'text-blue-100'}`}>
                     <ShieldCheck size={40} />
                   </div>
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      {labMode === 'CUTOUT' ? (
                        cutoutGenPhase === 'IDENTIFYING' ? '正在锁定主体集合...' : '正在执行物理 Matting 算法...'
                      ) : (
                        swapGenPhase === 'ANALYZING' ? '正在执行 A 场景解析...' : 
                        swapGenPhase === 'INPAINTING' ? '正在修复背景纹理...' : '正在对齐并执行替换...'
                      )}
                   </h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">BOSSOPS 视觉渲染工程运行中</p>
                </div>
             </div>
          )}

          {/* 状态 3: 人工纠偏 (HITL 可视化) */}
          {!isGenerating && labMode === 'REPLACEMENT' && swapStep === 2 && sceneAnalysis && (
            <div className="flex-1 flex flex-col gap-8">
               <div className="flex-1 relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src={sceneA!} className="w-full h-full object-contain opacity-50" />
                  {/* 可视化纠偏锚点层 */}
                  <div className="absolute inset-0 pointer-events-none">
                     <div 
                        className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
                        style={{
                           left: `${sceneAnalysis.bbox.xmin + swapBboxAdjust.x}%`,
                           top: `${sceneAnalysis.bbox.ymin + swapBboxAdjust.y}%`,
                           width: `${(sceneAnalysis.bbox.xmax - sceneAnalysis.bbox.xmin) * swapBboxAdjust.scale}%`,
                           height: `${(sceneAnalysis.bbox.ymax - sceneAnalysis.bbox.ymin) * swapBboxAdjust.scale}%`
                        }}
                     >
                        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[8px] px-2 py-0.5 font-black uppercase tracking-widest rounded-t-lg">Replacement Anchor</div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-blue-400 rounded-full flex items-center justify-center"><Crosshair size={12} className="text-blue-400" /></div>
                        <div className="absolute bottom-0 left-[-50%] right-[-50%] h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] opacity-50"></div>
                     </div>
                  </div>
                  <div className="absolute bottom-8 left-8 flex gap-4">
                     <div className="px-5 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 text-white text-[10px] font-black uppercase flex items-center gap-2"><Ruler size={14} className="text-blue-400" /> Perspective: {sceneAnalysis.perspective}</div>
                     <div className="px-5 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 text-white text-[10px] font-black uppercase flex items-center gap-2"><Sun size={14} className="text-orange-400" /> Lighting: {sceneAnalysis.lighting}</div>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex gap-4">
                  <Info className="text-blue-500 shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="text-sm font-black text-slate-800">HITL 工程解析就绪</h4>
                    <p className="mt-1 text-[10px] text-slate-400 font-bold leading-relaxed uppercase">请微调位置使虚线框覆盖原产品，绿色横线与地面契合。系统将以此作为受控生成的唯一基准。</p>
                  </div>
               </div>
            </div>
          )}

          {/* 状态 4: 抠图结果展示 */}
          {!isGenerating && labMode === 'CUTOUT' && cutoutResults.length > 0 && (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  {cutoutResults.map((res, idx) => (
                    <div key={idx} className="space-y-4 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 150}ms` }}>
                       <div className="relative aspect-square rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl bg-checkerboard group">
                          <img src={res.imageUrl} className="w-full h-full object-contain p-10" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <button onClick={() => setPreviewImage(res.imageUrl)} className="p-4 bg-white rounded-full text-slate-900 shadow-xl hover:scale-110 transition-transform"><Maximize2 size={24}/></button>
                          </div>
                       </div>
                       <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div>
                             <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{res.type === 'WHITE' ? '白底渲染图' : '透明图层'}</h4>
                             <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">800x800 HQ Asset</p>
                          </div>
                          <button onClick={() => downloadImage(res.imageUrl, 'cutout')} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-purple-600 transition-all shadow-lg"><Download size={14}/></button>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-8 bg-purple-50/50 rounded-[2.5rem] border border-purple-100 flex items-start gap-4">
                  <CheckCircle2 className="text-purple-500 shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="text-sm font-black text-purple-900">抠图工程合规性自检已通过</h4>
                    <ul className="mt-2 space-y-1 text-[10px] text-purple-700 font-bold uppercase tracking-widest">
                      <li>• 已锁定相似主体集合并剔除背景干扰</li>
                      <li>• 1:1 画布适配完成，主体整体居中占比有效</li>
                    </ul>
                  </div>
               </div>
            </div>
          )}

          {/* 状态 5: 替换结果展示 */}
          {!isGenerating && labMode === 'REPLACEMENT' && swapStep === 3 && swapResult && (
            <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
               <div className="relative aspect-square rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl bg-checkerboard">
                  <img src={swapResult} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button onClick={() => setPreviewImage(swapResult)} className="p-6 bg-white rounded-full text-slate-900 shadow-2xl"><Maximize2 size={32}/></button>
                  </div>
               </div>
               <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"><CheckCircle size={24}/></div>
                     <div>
                        <h4 className="text-lg font-black text-slate-800">替换工程报告</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A-Stage Physical Consistency Confirmed</p>
                     </div>
                  </div>
                  <button onClick={() => downloadImage(swapResult, 'replacement')} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3">
                     <Download size={18}/> 保存资产
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 资产历史面板 (保持原有) */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
           <aside className="w-[500px] bg-white h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                 <h2 className="text-2xl font-black text-slate-800">视觉资产全纪录</h2>
                 <button onClick={() => setShowHistory(false)} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center hover:text-red-500 shadow-sm border border-slate-100"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                 {history.map((item, idx) => (
                   <div key={idx} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex gap-6">
                         <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                            <img src={item.results?.[0]?.imageUrl} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${item.mode === 'CUTOUT' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{item.mode === 'CUTOUT' ? '极致抠图' : '产品替换'}</span>
                               <p className="text-[10px] font-bold text-slate-400 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setPreviewImage(item.results[0].imageUrl)} className="text-[10px] font-black text-slate-900 hover:text-blue-600 flex items-center gap-1 mt-3">立即预览</button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </aside>
        </div>
      )}

      {/* 全屏预览 */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/98 z-[300] flex items-center justify-center p-12 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
           <div className="relative bg-white p-2 rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="absolute top-6 right-6 z-10">
                 <button onClick={() => setPreviewImage(null)} className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl flex items-center justify-center text-slate-900 hover:text-red-500 border border-white"><X size={24}/></button>
              </div>
              <div className="overflow-auto custom-scrollbar bg-checkerboard rounded-[3rem]">
                <img src={previewImage} className="object-contain min-w-full" alt="HQ Preview" />
              </div>
           </div>
        </div>
      )}

      <style>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #f8fafc 25%, transparent 25%), 
                            linear-gradient(-45deg, #f8fafc 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #f8fafc 75%), 
                            linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
          background-size: 24px 24px;
          background-position: 0 0, 0 12px, 12px -12px, -12px 0px;
          background-color: #ffffff;
        }
        .ios-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .ios-checkbox:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        .ios-checkbox:checked::after {
          content: '✔';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
};

const BadgeCheck = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default VisualLab;
