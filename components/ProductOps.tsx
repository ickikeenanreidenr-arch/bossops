
import React, { useState, useRef } from 'react';
import { Member, Product, ProductStatus, OperationLog, TaskProgress, WorkspaceType } from '../types';
import { 
  OPERATION_LIFECYCLE, 
  TAO_3DAY_STRATEGY, 
  TAO_7DAY_STRATEGY, 
  getCreditColor 
} from '../constants';
import { 
  Plus, Search, ExternalLink, Calendar, CheckCircle2, ChevronRight, 
  ArrowLeft, Camera, Send, FileText, Trash2, ShoppingBag, User, 
  LayoutGrid, X, CheckCircle, Clock,
  History, Eye, Loader2, Trash,
  Zap, BarChart3, Coins, Quote, ScrollText, Upload, BadgeCheck,
  Edit3, Archive, PieChart, Image as ImageIcon,
  Tag, Fingerprint, Store, Link, Users, Hash, Copy, MousePointerClick, ShieldCheck,
  Trophy, TrendingUp, ChevronDown, Activity, ChevronLeft, ToggleLeft, ToggleRight,
  UserCheck
} from 'lucide-react';

interface ProductOpsProps {
  members: Member[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  workspace?: WorkspaceType;
  triggerCreditEvent: (userId: string, eventType: string, data?: any) => void;
}

// iOS 风格自定义下拉组件
interface CustomSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; avatar?: string; subLabel?: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm group ${isOpen ? 'ring-4 ring-blue-50 bg-white' : 'hover:bg-slate-100/50'}`}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.avatar && <img src={selectedOption.avatar} className="w-6 h-6 rounded-lg object-cover border border-white/50 shadow-sm" />}
          <div className="text-left">
            <p className="text-sm font-black">{selectedOption?.label}</p>
            {selectedOption?.subLabel && <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedOption.subLabel}</p>}
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-3xl shadow-2xl z-[220] p-2 animate-in zoom-in-95 fade-in duration-200 border-white border-2 overflow-hidden">
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${value === opt.value ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {opt.avatar && <img src={opt.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/20" />}
                  <div className="text-left">
                    <p className="text-xs font-black">{opt.label}</p>
                    {opt.subLabel && <p className={`text-[9px] font-bold uppercase ${value === opt.value ? 'text-white/50' : 'text-slate-400'}`}>{opt.subLabel}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ProductOps: React.FC<ProductOpsProps> = ({ members, products, setProducts, workspace, triggerCreditEvent }) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [isUploading, setIsUploading] = useState<{day: number, idx: number} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedHistoryDay, setExpandedHistoryDay] = useState<number | null>(null);
  const [showHistorySection, setShowHistorySection] = useState(false); 
  
  const [earlyForm, setEarlyForm] = useState({
    dailyOrders: '',
    dailyProfit: '',
    reason: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null); 
  const currentUploadTarget = useRef<{day: number, idx: number} | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    productId: '',
    image: 'https://picsum.photos/seed/prod/200',
    storeName: '',
    link: '',
    profitLink: '',
    operatorId: members[0]?.id || ''
  });

  const memberOptions = members.map(m => ({
    value: m.id,
    label: m.name,
    avatar: m.avatar,
    subLabel: m.role
  }));

  const filteredProducts = products.filter(p => 
    p.operatorId === selectedOperatorId && 
    p.status !== ProductStatus.ABANDONED && 
    p.status !== ProductStatus.TRASHED
  );

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.productId) {
      window.alert('请填写产品名称和ID');
      return;
    }
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const product: Product = {
      ...newProduct,
      id: newId,
      status: ProductStatus.PENDING,
      dayCount: 1,
      history: [],
      taskProgress: {}
    };
    setProducts(prev => [...prev, product]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      productId: '',
      image: 'https://picsum.photos/seed/prod/200',
      storeName: '',
      link: '',
      profitLink: '',
      operatorId: members[0]?.id || ''
    });
  };

  const handleSetStrategy = (strategy: 'standard' | 'tao-3day' | 'tao-7day') => {
    if (!activeProduct) return;
    const updatedProduct = { ...activeProduct, strategy };
    setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
    setActiveProduct(updatedProduct);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setNewProduct(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = (day: number, taskIdx: number) => {
    currentUploadTarget.current = { day, idx: taskIdx };
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadTarget.current || !activeProduct) return;

    const { day, idx } = currentUploadTarget.current;
    setIsUploading({ day, idx });

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      
      const currentImages = activeProduct.taskProgress[day]?.[idx]?.images || [];
      const isFirstUpload = currentImages.length === 0;
      
      const updatedProgress: TaskProgress = {
        ...activeProduct.taskProgress,
        [day]: {
          ...(activeProduct.taskProgress[day] || {}),
          [idx]: { 
            images: [...currentImages, base64Image], 
            completedAt: new Date().toISOString() 
          }
        }
      };

      const updatedProduct = { ...activeProduct, taskProgress: updatedProgress };
      setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
      setActiveProduct(updatedProduct);
      setIsUploading(null);
      
      if (isFirstUpload) {
        triggerCreditEvent(activeProduct.operatorId, 'TASK_COMPLETE', { relatedId: activeProduct.id });
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    setTimeout(() => {
      reader.readAsDataURL(file);
    }, 400);
  };

  const handleDeleteImage = (day: number, taskIdx: number, imgIdx: number) => {
    if (!activeProduct) return;
    const currentImages = [...(activeProduct.taskProgress[day]?.[taskIdx]?.images || [])];
    currentImages.splice(imgIdx, 1);
    
    const updatedProgress: TaskProgress = {
      ...activeProduct.taskProgress,
      [day]: {
        ...(activeProduct.taskProgress[day] || {}),
        [taskIdx]: { 
          images: currentImages, 
          completedAt: currentImages.length > 0 ? activeProduct.taskProgress[day][taskIdx].completedAt : '' 
        }
      }
    };

    const updatedProduct = { ...activeProduct, taskProgress: updatedProgress };
    setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
    setActiveProduct(updatedProduct);
  };

  const handleDayComplete = () => {
    if (!activeProduct) return;
    
    let lifecycle = OPERATION_LIFECYCLE;
    let maxDays = 14;
    
    if (workspace === 'TaoFactory') {
      if (activeProduct.strategy === 'tao-3day') {
        lifecycle = TAO_3DAY_STRATEGY;
        maxDays = 3;
      } else if (activeProduct.strategy === 'tao-7day') {
        lifecycle = TAO_7DAY_STRATEGY;
        maxDays = 7;
      }
    }

    const currentDayTasks = lifecycle[activeProduct.dayCount] || [];
    const completedCount = Object.keys(activeProduct.taskProgress[activeProduct.dayCount] || {}).filter(k => {
      const idx = parseInt(k);
      return (activeProduct.taskProgress[activeProduct.dayCount][idx]?.images?.length || 0) > 0;
    }).length;

    if (completedCount < currentDayTasks.length) {
      window.alert(`请先上传今日所有任务 (${currentDayTasks.length}项) 的截图证明！`);
      return;
    }

    triggerCreditEvent(activeProduct.operatorId, 'DAY_COMPLETE', { 
      day: activeProduct.dayCount, 
      relatedId: activeProduct.id,
      onTime: true 
    });

    const nextDay = activeProduct.dayCount + 1;
    let status = activeProduct.status;
    if (nextDay > maxDays) {
      status = ProductStatus.MAINTENANCE;
      triggerCreditEvent(activeProduct.operatorId, 'ASSET_COMPLETE', { relatedId: activeProduct.id });
      window.alert(`${maxDays}天周期已圆满完成，现已转入“日常维护”阶段。`);
    }
    const updatedProduct = { ...activeProduct, dayCount: nextDay, status };
    setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
    setActiveProduct(updatedProduct);
  };

  const handleEarlyTransition = () => {
    if (!activeProduct || !earlyForm.dailyOrders || !earlyForm.dailyProfit) {
      window.alert('请完整填写核心业绩指标数据');
      return;
    }
    
    const note = `[提前转入维护] 达成情况: 日销 ${earlyForm.dailyOrders}单, 日利 ${earlyForm.dailyProfit}元。原因: ${earlyForm.reason || '已达预期目标'}`;
    const updatedProduct = { 
      ...activeProduct, 
      status: ProductStatus.MAINTENANCE,
      earlyTransitionNote: note,
      history: [
        ...activeProduct.history,
        {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          dayIndex: activeProduct.dayCount,
          content: note,
          images: [],
          operatorName: '系统'
        }
      ]
    };
    
    triggerCreditEvent(activeProduct.operatorId, 'EARLY_MAINTAIN', { relatedId: activeProduct.id });
    
    setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
    setActiveProduct(updatedProduct);
    setShowEarlyModal(false);
    window.alert('产品已成功提前进入日常维护阶段！');
  };

  const handleLogSubmit = () => {
    if (!activeProduct || !newLogContent.trim()) return;
    const newLog: OperationLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      dayIndex: activeProduct.dayCount,
      content: newLogContent,
      images: [],
      operatorName: members.find(m => m.id === activeProduct.operatorId)?.name || '未知',
    };
    const updatedProduct = { ...activeProduct, history: [...activeProduct.history, newLog] };
    setProducts(prev => prev.map(p => p.id === activeProduct.id ? updatedProduct : p));
    setActiveProduct(updatedProduct);
    setNewLogContent('');
  };

  const handleAbandon = () => {
    if (!activeProduct || !activeProduct.id) return;
    if (window.confirm('确定要放弃此计划吗？产品将进入【公海资源池】供他人认领。')) {
      const hasLogs = activeProduct.history.length > 0;
      triggerCreditEvent(activeProduct.operatorId, hasLogs ? 'MANUAL_ABANDON' : 'ABANDON_WITHOUT_LOG', { relatedId: activeProduct.id });
      
      setProducts(prev => prev.map(p => p.id === activeProduct.id ? { ...p, status: ProductStatus.ABANDONED, operatorId: '' } : p));
      setActiveProduct(null);
    }
  };

  const formatLink = (url: string | undefined) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  const getTaskTemplate = (taskName: string) => {
    if (activeProduct?.strategy !== 'tao-3day') return null;
    
    const taskClean = taskName.replace(/^\d、/, '');
    if (taskClean === "找小二清退预算加码") {
      return `产品编号：${activeProduct.productId}\n商品编号：[请补充]\n处理事项：加白一下清退预算加码\n供应商：${activeProduct.storeName}`;
    }
    if (taskClean === "找小二清退营销托管") {
      return `产品编号:${activeProduct.productId}\nID：[请补充]\n老大得空辛苦清退下营销托管`;
    }
    if (taskClean === "找小二穿衣") {
      return `超链id：${activeProduct.productId}（可多加点相似款）\n问题归类：需要穿衣同款销评\n淘宝同款ID：[请补充]\n问题描述：无销评，需要穿衣同款销量评价`;
    }
    return null;
  };

  if (activeProduct) {
    if (workspace === 'TaoFactory' && !activeProduct.strategy && activeProduct.status !== ProductStatus.MAINTENANCE) {
      return (
        <div className="space-y-6">
          <button onClick={() => setActiveProduct(null)} className="flex items-center gap-2 text-gray-500 font-bold ios-btn">
            <ArrowLeft size={20} /> 返回列表
          </button>
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-4xl font-boss tracking-tight italic boss-brand-signature mb-12">选择淘工厂运营打法模式</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <button 
                onClick={() => handleSetStrategy('tao-3day')}
                className="group ios-btn glass-panel p-10 rounded-[3rem] border-2 border-transparent hover:border-blue-500 transition-all flex flex-col items-center text-center shadow-lg"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">3天秒杀打法</h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">极限爆发模型<br/>快速测试市场反应与供应链优势</p>
              </button>
              <button 
                onClick={() => handleSetStrategy('tao-7day')}
                className="group ios-btn glass-panel p-10 rounded-[3rem] border-2 border-transparent hover:border-emerald-500 transition-all flex flex-col items-center text-center shadow-lg"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">7天秒杀打法</h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">稳步增长模型<br/>平衡成本与流量，打造持久收益链路</p>
              </button>
              <button 
                onClick={() => handleSetStrategy('standard')}
                className="group ios-btn glass-panel p-10 rounded-[3rem] border-2 border-transparent hover:border-slate-400 transition-all flex flex-col items-center text-center shadow-lg"
              >
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                  <MousePointerClick size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">标准打法</h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">通用14天模型<br/>适用于大部分精品化运营链路</p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isMaintenance = activeProduct.status === ProductStatus.MAINTENANCE;
    const activeMember = members.find(m => m.id === activeProduct.operatorId);
    
    let lifecycle = OPERATION_LIFECYCLE;
    if (workspace === 'TaoFactory') {
      if (activeProduct.strategy === 'tao-3day') lifecycle = TAO_3DAY_STRATEGY;
      else if (activeProduct.strategy === 'tao-7day') lifecycle = TAO_7DAY_STRATEGY;
    }

    const currentDayTasks = lifecycle[activeProduct.dayCount] || ["日常监控"];
    const dayProgress = activeProduct.taskProgress[activeProduct.dayCount] || {};
    const isAllTasksDone = Object.keys(dayProgress).filter(k => {
      const idx = parseInt(k);
      return (dayProgress[idx]?.images?.length || 0) > 0;
    }).length >= currentDayTasks.length && currentDayTasks.length > 0;

    return (
      <div className="space-y-6">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        <div className="flex justify-between items-center">
          <button 
            onClick={() => { setActiveProduct(null); setExpandedHistoryDay(null); }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-bold ios-btn"
          >
            <ArrowLeft size={20} /> 返回列表
          </button>
          <div className="flex gap-2">
            {!isMaintenance && (
              <button 
                onClick={() => setShowEarlyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-sm ios-btn border border-blue-100 shadow-sm"
              >
                <ShieldCheck size={16} /> 提前进入维护
              </button>
            )}
            <button 
              onClick={() => setShowOverview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm ios-btn"
            >
              <LayoutGrid size={16} /> 运营总览
            </button>
            <button 
              onClick={handleAbandon}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-sm ios-btn"
            >
              <Trash2 size={16} /> 放弃计划
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in duration-500">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
               {!isMaintenance ? (
                 <>
                   <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-black flex items-center gap-4 text-slate-800">
                       <span className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-2xl italic num-font">D{activeProduct.dayCount}</span>
                       今日实操清单
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border">
                         {activeProduct.strategy?.replace('tao-', '').toUpperCase() || 'STANDARD'} 模式
                       </span>
                     </h3>
                   </div>

                   <div className="space-y-6 mb-12">
                     {currentDayTasks.map((task, idx) => {
                       const images = dayProgress[idx]?.images || [];
                       const isDone = images.length > 0;
                       const template = getTaskTemplate(task);
                       
                       return (
                         <div key={idx} className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col gap-4 ${isDone ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-50'}`}>
                           <div className="flex items-center justify-between">
                             <div className="flex-1 space-y-3">
                               <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-white border-2 border-slate-200'}`}>
                                   {isDone ? <CheckCircle2 size={18} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                                 </div>
                                 <p className={`font-black text-lg ${isDone ? 'text-green-800 opacity-60' : 'text-slate-700'}`}>{task}</p>
                               </div>
                               {template && (
                                 <div className="ml-12 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative group">
                                    <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap">{template}</pre>
                                    <button 
                                      onClick={() => { navigator.clipboard.writeText(template); window.alert('模版已复制'); }}
                                      className="absolute top-4 right-4 p-2 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Copy size={12}/>
                                    </button>
                                 </div>
                               )}
                             </div>
                             <button 
                               onClick={() => triggerFileUpload(activeProduct.dayCount, idx)}
                               className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${isDone ? 'bg-white text-green-600' : 'bg-white text-blue-600 border border-blue-50'} ios-btn`}
                             >
                               <Camera size={18} className="inline mr-2" />
                               {isDone ? '增补截图' : '上传截图'}
                             </button>
                           </div>
                           {images.length > 0 && (
                             <div className="flex flex-wrap gap-3 pl-12 mt-2">
                               {images.map((img, imgIdx) => (
                                 <div key={imgIdx} className="relative group w-20 h-20 bg-white rounded-2xl overflow-hidden border border-slate-100">
                                   <img src={img} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setPreviewImage(img)} />
                                   <button onClick={() => handleDeleteImage(activeProduct.dayCount, idx, imgIdx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={10} /></button>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>

                   <button 
                     onClick={handleDayComplete} 
                     disabled={!isAllTasksDone} 
                     className={`w-full py-6 rounded-[2rem] text-xl font-black transition-all shadow-2xl ios-btn ${isAllTasksDone ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-300'}`}
                   >
                     确认今日完成 <ChevronRight className="inline ml-2" />
                   </button>
                 </>
               ) : (
                 <div className="py-12 px-4 space-y-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10 border border-emerald-100 animate-bounce">
                        <Trophy size={48} />
                      </div>
                      <h3 className="text-4xl font-boss tracking-tight italic text-slate-800">爆款日常维护模式</h3>
                      <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Mission Accomplished: Active Maintenance Phase</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-slate-50 p-8 rounded-[2rem] border border-white shadow-inner flex flex-col items-center text-center hover:bg-white transition-all hover:shadow-xl group">
                          <TrendingUp className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">维护核心工作</h4>
                          <p className="text-slate-600 font-bold leading-relaxed">每日监控搜索权重，观察竞品动向，<br/>维持核心关键词排名及详情页转化。</p>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[2rem] border border-white shadow-inner flex flex-col items-center text-center hover:bg-white transition-all hover:shadow-xl group">
                          <BarChart3 className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">流量及评价监控</h4>
                          <p className="text-slate-600 font-bold leading-relaxed">及时处理负面评价，补录高质量销评，<br/>配合付费推广进行低价引流维护。</p>
                       </div>
                    </div>

                    {activeProduct.earlyTransitionNote && (
                      <div className="mt-8 p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] relative">
                         <Quote className="absolute -top-4 -left-4 text-emerald-200" size={48} />
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">阶段性实操成果记录</p>
                         <p className="text-lg font-bold text-emerald-800 leading-relaxed italic">“{activeProduct.earlyTransitionNote}”</p>
                      </div>
                    )}

                    <div className="mt-12 pt-12 border-t border-slate-100">
                       <button 
                          onClick={() => setShowHistorySection(!showHistorySection)}
                          className={`w-full p-6 rounded-[2rem] flex items-center justify-between transition-all border ${showHistorySection ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-800 border-slate-100 hover:bg-white hover:shadow-md'}`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`p-2 rounded-xl ${showHistorySection ? 'bg-white/20' : 'bg-blue-500 text-white'}`}>
                                <History size={20} />
                             </div>
                             <div className="text-left">
                                <h4 className="text-lg font-black">起航期实操证言回顾</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${showHistorySection ? 'text-blue-100' : 'text-slate-400'}`}>
                                   {activeProduct.dayCount - 1} 天历史实操归档
                                </p>
                             </div>
                          </div>
                          {showHistorySection ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-slate-300" />}
                       </button>

                       {showHistorySection && (
                         <div className="mt-6 animate-in slide-in-from-top-4 duration-500 bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6">
                            <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                               <div className="space-y-4">
                                  {Array.from({ length: activeProduct.dayCount - 1 }, (_, i) => i + 1).map(day => {
                                     const tasks = lifecycle[day] || [];
                                     const progress = activeProduct.taskProgress[day] || {};
                                     const hasImages = Object.values(progress).some((p: any) => (p.images?.length || 0) > 0);
                                     const isExpanded = expandedHistoryDay === day;

                                     return (
                                       <div key={day} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                          <button 
                                            onClick={() => setExpandedHistoryDay(isExpanded ? null : day)}
                                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                          >
                                             <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic num-font ${hasImages ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                   D{day}
                                                </div>
                                                <span className="text-sm font-black text-slate-800">该阶段起航实操任务集</span>
                                             </div>
                                             <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                          </button>
                                          
                                          {isExpanded && (
                                            <div className="px-5 pb-5 animate-in fade-in duration-300">
                                               <div className="space-y-3 pt-3 border-t border-slate-50">
                                                  {tasks.map((task, tidx) => {
                                                     const tImages = progress[tidx]?.images || [];
                                                     return (
                                                       <div key={tidx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl">
                                                          <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                                                             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                                             {task}
                                                          </p>
                                                          {tImages.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2 pl-3">
                                                               {tImages.map((img, imgIdx) => (
                                                                 <img 
                                                                   key={imgIdx} 
                                                                   src={img} 
                                                                   className="w-12 h-12 object-cover rounded-lg border border-white cursor-zoom-in hover:scale-110 transition-transform shadow-sm" 
                                                                   onClick={() => setPreviewImage(img)}
                                                                 />
                                                               ))}
                                                            </div>
                                                          ) : (
                                                            <p className="text-[9px] text-slate-300 italic pl-3">此项无截图记录</p>
                                                          )}
                                                       </div>
                                                     );
                                                  })}
                                               </div>
                                            </div>
                                          )}
                                       </div>
                                     );
                                  })}
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6 ml-2">
                 <Edit3 className="text-slate-900" size={20} />
                 <h4 className="text-lg font-black text-slate-800">实操/维护 日志记录</h4>
              </div>
              <textarea 
                className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-medium text-lg mb-6 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                placeholder="在此输入今日运营总结或需要特别记录的事项..."
                rows={4}
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
              />
              <button onClick={handleLogSubmit} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 ml-auto ios-btn shadow-xl shadow-slate-900/10">提交日志 <Send size={20}/></button>
              
              <div className="mt-10 space-y-6">
                 <div className="flex items-center gap-3 mb-8 ml-4">
                   <Activity size={24} className="text-blue-500 animate-pulse" />
                   <div>
                      <h4 className="text-xl font-black text-slate-800">全周期运营操作轨迹</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Full Operational Trajectory & Timeline</p>
                   </div>
                 </div>
                 
                 <div className="max-h-[600px] overflow-y-auto pr-4 custom-scrollbar relative">
                    <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/20 via-indigo-500/20 to-transparent rounded-full z-0 hidden sm:block"></div>
                    
                    <div className="space-y-12 pb-10">
                      {activeProduct.history.slice().reverse().map((log, index) => {
                         const isSystemLog = log.operatorName === '系统';
                         const operator = members.find(m => m.name === log.operatorName);
                         
                         return (
                            <div key={log.id} className="relative pl-0 sm:pl-20 group animate-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="hidden sm:flex absolute left-0 top-2 w-20 flex-col items-center z-10">
                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 ${isSystemLog ? 'bg-emerald-500 border-emerald-100' : 'bg-blue-600 border-blue-100'}`}>
                                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                   </div>
                                   <span className="mt-3 text-[11px] font-black text-slate-400 num-font italic tracking-widest">DAY {log.dayIndex}</span>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group-hover:border-blue-200">
                                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                         {operator?.avatar ? (
                                            <img src={operator.avatar} className="w-6 h-6 rounded-lg object-cover shadow-sm" alt="" />
                                         ) : (
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${isSystemLog ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                               {isSystemLog ? 'S' : 'U'}
                                            </div>
                                         )}
                                         <span className="text-xs font-black text-slate-700">{log.operatorName}</span>
                                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${isSystemLog ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {isSystemLog ? '系统指令' : '人工操作'}
                                         </span>
                                      </div>
                                      
                                      <div className="flex flex-col items-end">
                                         <div className="flex items-center gap-2 text-slate-300 font-bold text-[11px] num-font">
                                            <Clock size={12} />
                                            {new Date(log.date).toLocaleDateString()}
                                         </div>
                                         <span className="text-[10px] text-slate-300 num-font mt-0.5">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                   </div>

                                   <div className="relative">
                                      <Quote size={40} className="absolute -top-4 -left-4 text-slate-50 opacity-50" />
                                      <p className="text-slate-700 font-bold text-lg leading-relaxed relative z-10 pl-2">
                                         {log.content}
                                      </p>
                                   </div>
                                </div>
                            </div>
                         );
                      })}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8 relative z-10">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-8 z-20">
                <div className="h-64 -mx-8 -mt-8 mb-8 overflow-hidden group">
                  <img src={activeProduct.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h2 className="font-black text-2xl text-slate-800 mb-6 flex items-center gap-2 leading-tight">
                  <BadgeCheck className="text-blue-500 shrink-0" />
                  {activeProduct.name}
                </h2>
                
                <div className="space-y-4 py-6 border-y border-slate-50">
                   <div className="flex justify-between items-center group">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                           <Store size={14} />
                        </div>
                        <span className="text-xs text-slate-400 font-black uppercase">归属店铺</span>
                     </div>
                     <span className="text-sm font-black text-slate-700">{activeProduct.storeName}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                           <Fingerprint size={14} />
                        </div>
                        <span className="text-xs text-slate-400 font-black uppercase">系统 ID</span>
                     </div>
                     <span className="text-sm font-black text-slate-700 num-font">#{activeProduct.productId}</span>
                   </div>
                   <div className="flex justify-between items-center group">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                           <Users size={14} />
                        </div>
                        <span className="text-xs text-slate-400 font-black uppercase">责任运营</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <img src={activeMember?.avatar} className="w-6 h-6 rounded-lg object-cover border border-slate-100 shadow-sm" />
                        <span className="text-sm font-black text-slate-700">{activeMember?.name || '未指派'}</span>
                     </div>
                   </div>
                   <div className="flex justify-between items-center group">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                           <ScrollText size={14} />
                        </div>
                        <span className="text-xs text-slate-400 font-black uppercase">实操记录条数</span>
                     </div>
                     <span className="text-sm font-black text-slate-700 num-font">{activeProduct.history.length} 条</span>
                   </div>
                </div>

                <div className="space-y-3 mt-8 relative z-30">
                  <a 
                    href={formatLink(activeProduct.link)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full block py-4 bg-slate-900 text-white rounded-2xl text-center font-black text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all ios-btn flex items-center justify-center gap-2 relative z-40"
                  >
                    <ExternalLink size={16}/> 直达详情页
                  </a>
                  {activeProduct.profitLink && (
                    <a 
                      href={formatLink(activeProduct.profitLink)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full block py-4 border-2 border-slate-100 text-slate-600 rounded-2xl text-center font-black text-sm hover:bg-slate-50 transition-all ios-btn flex items-center justify-center gap-2 relative z-40"
                    >
                       <PieChart size={16} className="text-rose-500" /> 利润核算表
                    </a>
                  )}
                </div>
             </div>
          </div>
        </div>
        
        {previewImage && (
          <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-10 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-full max-h-full rounded-3xl shadow-2xl" />
          </div>
        )}
        
        {showOverview && (
          <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-10 backdrop-blur-md">
             <div className="bg-white w-full max-w-6xl h-full rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                  <h2 className="text-3xl font-black text-slate-800">运营周期全景图</h2>
                  <button onClick={() => setShowOverview(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Object.entries(lifecycle).map(([day, tasks]) => (
                      <div key={day} className={`p-8 rounded-[2rem] border-2 transition-all ${parseInt(day) === activeProduct.dayCount ? 'border-blue-500 bg-blue-50/20' : 'border-slate-50 bg-white'}`}>
                        <h4 className="font-black text-2xl mb-4 num-font">Day {day}</h4>
                        <div className="space-y-2">
                          {tasks.map((t, tidx) => <p key={tidx} className="text-xs font-bold text-slate-400">• {t}</p>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        )}

        {showEarlyModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 animate-in fade-in zoom-in duration-300 shadow-2xl">
               <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">爆款收官/提前维护</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">记录当前核心成果并转入日常维护</p>
               <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">当前日销量</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold" placeholder="单/日" value={earlyForm.dailyOrders} onChange={e => setEarlyForm({...earlyForm, dailyOrders: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">当前日利润</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold" placeholder="元/日" value={earlyForm.dailyProfit} onChange={e => setEarlyForm({...earlyForm, dailyProfit: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">提前维护原因 (可选)</label>
                    <textarea className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold" rows={2} placeholder="例如：流量已趋于稳定，无需再补单" value={earlyForm.reason} onChange={e => setEarlyForm({...earlyForm, reason: e.target.value})} />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setShowEarlyModal(false)} className="flex-1 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">取消</button>
                    <button onClick={handleEarlyTransition} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg active:scale-95 transition-all">确认收官转维护</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!selectedOperatorId) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {members.map(member => (
          <button key={member.id} onClick={() => setSelectedOperatorId(member.id)} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all text-center group relative overflow-hidden ios-btn">
            <div className={`absolute top-0 left-0 w-full h-2 ${workspace === 'Tmall' ? 'bg-red-500' : 'bg-blue-600'}`}></div>
            <img src={member.avatar} className="w-24 h-24 rounded-3xl mx-auto mb-6 border-4 border-gray-50 object-cover" />
            <h3 className="text-xl font-black text-slate-800">{member.name}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">{member.role}</p>
            <div className={`mt-6 inline-flex items-center px-5 py-2 rounded-full text-xs font-black shadow-sm ${getCreditColor(member.creditScore)}`}>信用点: {member.creditScore} BP</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <button onClick={() => setSelectedOperatorId(null)} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 font-black ios-btn transition-all">
          <ArrowLeft size={24} /> 返回负责人列表
        </button>
        <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black shadow-2xl hover:bg-blue-600 active:scale-95 transition-all ios-btn">
          <Plus size={24} /> 启动新爆款计划
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} onClick={() => setActiveProduct(product)} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all cursor-pointer group">
            <div className="relative h-56 overflow-hidden">
              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-5 left-5 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl text-white text-[10px] font-black uppercase tracking-widest">
                {product.status === ProductStatus.MAINTENANCE ? '🔥 爆款维护中' : `🏃 D${product.dayCount} 快速起航`}
              </div>
              {product.strategy && (
                <div className="absolute top-5 right-5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-xl text-blue-600 text-[8px] font-black uppercase tracking-widest shadow-md">
                   {product.strategy.replace('tao-', '').toUpperCase() || 'STANDARD'}
                </div>
              )}
            </div>
            <div className="p-8">
              <h3 className="font-black text-xl text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{product.name}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase">{product.storeName}</p>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center mt-4">
                <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Day {product.dayCount}</span>
                <span className="text-blue-600 text-sm font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">进入面板 <ChevronRight size={18} /></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 animate-in fade-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <input type="file" ref={mainImageInputRef} className="hidden" accept="image/*" onChange={handleMainImageChange} />
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">配置新作战计划</h2>
              <button onClick={() => setShowAddModal(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors ios-btn"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div onClick={() => mainImageInputRef.current?.click()} className="group relative flex flex-col items-center p-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50 hover:border-blue-400 transition-all cursor-pointer overflow-hidden">
                   <img src={newProduct.image} className="w-40 h-40 object-cover rounded-[2rem] shadow-2xl mb-6" />
                   <div className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase"><Upload size={16} /> 点击上传产品主图</div>
                </div>
                {/* 替换为 iOS 风格下拉框 */}
                <CustomSelect 
                  label="执行人指派"
                  value={newProduct.operatorId}
                  options={memberOptions}
                  onChange={(val) => setNewProduct({...newProduct, operatorId: val})}
                  icon={<Users size={12} className="text-blue-500" />}
                />
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Tag size={12} className="text-emerald-500" /> 产品展示名称
                   </label>
                   <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold" placeholder="产品展示名称" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Fingerprint size={12} className="text-indigo-500" /> 产品 ID
                    </label>
                    <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold" placeholder="产品 ID" value={newProduct.productId} onChange={e => setNewProduct({...newProduct, productId: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Store size={12} className="text-orange-500" /> 店铺简称
                    </label>
                    <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold" placeholder="店铺简称" value={newProduct.storeName} onChange={e => setNewProduct({...newProduct, storeName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Link size={12} className="text-blue-500" /> 宝贝详情页链接
                   </label>
                   <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold" placeholder="详情页链接 URL" value={newProduct.link} onChange={e => setNewProduct({...newProduct, link: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <PieChart size={12} className="text-rose-500" /> 利润核算链接
                   </label>
                   <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold" placeholder="利润核算表链接 URL" value={newProduct.profitLink} onChange={e => setNewProduct({...newProduct, profitLink: e.target.value})} />
                </div>
                <button onClick={handleAddProduct} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all mt-4 ios-btn">立即创建计划</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOps;
