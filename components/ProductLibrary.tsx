
import React, { useState, useRef } from 'react';
import { Product, ProductStatus, Member } from '../types';
import { 
  Database, Search, Filter, Archive, Users, History, BookOpen, 
  ClipboardCheck, Plus, Globe, AlertCircle, Ship, X, ExternalLink, 
  PieChart, User, Trash2, RotateCcw, LogOut, Upload, Camera, Check, ChevronRight,
  Tag, Fingerprint, Store, Link, ChevronDown, UserCheck, AlertTriangle, Info, Package,
  LayoutGrid, CheckCircle2, Edit3, ShieldAlert, FolderOpen
} from 'lucide-react';

interface ProductLibraryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  members: Member[];
  triggerCreditEvent: (userId: string, eventType: string, data?: any) => void;
}

const ProductLibrary: React.FC<ProductLibraryProps> = ({ products, setProducts, members, triggerCreditEvent }) => {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Abandoned' | 'Trashed'>('All');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [claimingProductId, setClaimingProductId] = useState<string | null>(null); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [actionTarget, setActionTarget] = useState<{ id: string, type: 'abandon' | 'trash' | 'delete' } | null>(null);
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    productId: '',
    image: 'https://picsum.photos/seed/lib/200',
    storeName: '',
    link: '',
    profitLink: '',
    imagePackagePath: ''
  });

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const filtered = products.filter(p => {
    const statusMatch = 
      statusFilter === 'All' ? p.status !== ProductStatus.TRASHED :
      statusFilter === 'Active' ? (p.status === ProductStatus.ACTIVE || p.status === ProductStatus.MAINTENANCE || p.status === ProductStatus.PENDING) :
      statusFilter === 'Abandoned' ? p.status === ProductStatus.ABANDONED :
      p.status === ProductStatus.TRASHED;
    
    const operatorMatch = (selectedMemberId === 'all' || p.status === ProductStatus.ABANDONED) ? true : p.operatorId === selectedMemberId;
    
    const query = searchQuery.toLowerCase();
    const searchMatch = p.name.toLowerCase().includes(query) || 
                       p.productId.toLowerCase().includes(query) || 
                       p.storeName.toLowerCase().includes(query);

    return statusMatch && operatorMatch && searchMatch;
  });

  const handleClaimClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setClaimingProductId(id);
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      productId: product.productId,
      image: product.image,
      storeName: product.storeName,
      link: product.link,
      profitLink: product.profitLink || '',
      imagePackagePath: product.imagePackagePath || ''
    });
    setShowAddModal(true);
  };

  const executeClaim = (targetId: string, memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (member.creditScore < 60) {
      window.alert(`【权限拦截】成员 ${member.name} 信用分过低 (${member.creditScore})，禁止领用新资产。请先执行信用修复任务。`);
      return;
    }

    setProducts(prev => prev.map(p => 
      p.id === targetId ? {
        ...p,
        status: ProductStatus.ACTIVE,
        operatorId: memberId,
        dayCount: 1,
        history: [
          ...(p.history || []),
          {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            dayIndex: 1,
            content: `[系统记录] 该资产由 ${member.name} 成功认领，正式开启运营。`,
            images: [],
            operatorName: '系统'
          }
        ]
      } : p
    ));

    triggerCreditEvent(memberId, 'PUBLIC_POOL_TAKEN', { relatedId: targetId });
    setClaimingProductId(null);
    setSelectedProduct(null);
  };

  const confirmAction = () => {
    if (!actionTarget) return;
    const { id, type } = actionTarget;

    const targetProduct = products.find(p => p.id === id);
    if (targetProduct && targetProduct.operatorId) {
      if (type === 'abandon') {
        triggerCreditEvent(targetProduct.operatorId, 'MANUAL_ABANDON', { relatedId: id });
      } else if (type === 'trash') {
        triggerCreditEvent(targetProduct.operatorId, 'ENTER_TRASH', { relatedId: id });
      }
    }

    setProducts(prev => {
      if (type === 'delete') {
        return prev.filter(p => p.id !== id);
      }
      return prev.map(p => {
        if (p.id === id) {
          if (type === 'abandon') return { ...p, status: ProductStatus.ABANDONED, operatorId: '' };
          if (type === 'trash') return { ...p, status: ProductStatus.TRASHED };
        }
        return p;
      });
    });

    if (selectedProduct?.id === id) setSelectedProduct(null);
    setActionTarget(null);
  };

  const handleRestore = (id: string) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, status: ProductStatus.ABANDONED, operatorId: '' } : p
    ));
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.productId) return;

    if (editingProductId) {
      setProducts(prev => prev.map(p => 
        p.id === editingProductId ? { ...p, ...productForm } : p
      ));
    } else {
      const newId = Date.now().toString(36);
      const product: Product = {
        ...productForm,
        id: newId,
        status: ProductStatus.ABANDONED,
        operatorId: '',
        dayCount: 1,
        history: [{
          id: 'init-' + newId,
          date: new Date().toISOString(),
          dayIndex: 1,
          content: '[系统记录] 资产创建并录入公共资源池。',
          images: [],
          operatorName: '系统'
        }],
        taskProgress: {}
      };
      setProducts(prev => [...prev, product]);
    }
    closeAddModal();
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingProductId(null);
    setProductForm({ name: '', productId: '', image: 'https://picsum.photos/seed/lib/200', storeName: '', link: '', profitLink: '', imagePackagePath: '' });
  };

  return (
    <div className="flex gap-8 items-start h-full">
      <aside className="w-64 shrink-0 space-y-6 sticky top-0">
        <div className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm space-y-6">
           <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">档案库分层</h4>
              <nav className="space-y-1">
                 {[
                   { id: 'All', label: '全部档案', icon: <LayoutGrid size={16}/>, color: 'text-slate-400' },
                   { id: 'Active', label: '正在运营', icon: <CheckCircle2 size={16}/>, color: 'text-blue-500' },
                   { id: 'Abandoned', label: '公共资源池', icon: <Ship size={16}/>, color: 'text-indigo-500' },
                   { id: 'Trashed', label: '垃圾站', icon: <Trash2 size={16}/>, color: 'text-red-500' }
                 ].map((item) => (
                   <button
                     key={item.id}
                     onClick={() => setStatusFilter(item.id as any)}
                     className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ios-btn ${statusFilter === item.id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}
                   >
                     <div className="flex items-center gap-3">
                        <span className={statusFilter === item.id ? 'text-white' : item.color}>{item.icon}</span>
                        <span className="text-[13px] font-black">{item.label}</span>
                     </div>
                   </button>
                 ))}
              </nav>
           </div>

           <div className="space-y-3 pt-4 border-t border-slate-50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">权重视角</h4>
              <div className="relative">
                 <button 
                   onClick={() => setIsPerspectiveOpen(!isPerspectiveOpen)}
                   className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ios-btn ${selectedMemberId !== 'all' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                 >
                    <div className="flex items-center gap-3">
                       {selectedMemberId === 'all' ? <Globe size={16} className="text-slate-400"/> : <UserCheck size={16} className="text-blue-600"/>}
                       <span className={`text-xs font-black truncate max-w-[100px] ${selectedMemberId === 'all' ? 'text-slate-500' : 'text-blue-700'}`}>
                          {selectedMemberId === 'all' ? '全员视角' : selectedMember?.name}
                       </span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-300 transition-transform ${isPerspectiveOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {isPerspectiveOpen && (
                   <>
                     <div className="fixed inset-0 z-10" onClick={() => setIsPerspectiveOpen(false)}></div>
                     <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-3xl border border-slate-100 shadow-2xl z-20 p-2 animate-in slide-in-from-bottom-2 duration-200">
                        <button 
                          onClick={() => { setSelectedMemberId('all'); setIsPerspectiveOpen(false); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedMemberId === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                           <Globe size={14} />
                           <span className="text-xs font-black">全局模式</span>
                        </button>
                        <div className="h-px bg-slate-50 my-1 mx-2"></div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                          {members.map(m => (
                            <button 
                              key={m.id}
                              onClick={() => { setSelectedMemberId(m.id); setIsPerspectiveOpen(false); }}
                              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedMemberId === m.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                               <img src={m.avatar} className="w-6 h-6 rounded-lg object-cover" />
                               <span className="text-xs font-black">{m.name}</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   </>
                 )}
              </div>
           </div>
        </div>
      </aside>

      <div className="flex-1 space-y-6 h-full flex flex-col">
        <div className="flex items-center gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="搜索资产、ID或店铺..." 
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-600 shadow-sm focus:ring-4 focus:ring-blue-50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button 
             onClick={() => { setEditingProductId(null); setShowAddModal(true); }}
             className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] flex items-center gap-3 font-black text-sm hover:bg-blue-600 transition-all shadow-xl active:scale-95 ios-btn"
           >
              <Plus size={20} /> 录入新资产
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto pb-10">
          {filtered.length > 0 ? (
            filtered.map(product => {
              const isAbandoned = product.status === ProductStatus.ABANDONED;
              const isTrashed = product.status === ProductStatus.TRASHED;
              const isActive = !isAbandoned && !isTrashed;
              const operator = members.find(m => m.id === product.operatorId);

              return (
                <div key={product.id} className={`bg-white rounded-3xl border transition-all flex flex-col overflow-hidden group ${isAbandoned ? 'border-indigo-100 hover:shadow-indigo-900/5' : isTrashed ? 'border-red-100' : 'border-slate-100'} hover:shadow-2xl hover:-translate-y-1`}>
                  <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {isAbandoned && <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[2px] flex items-center justify-center"><Ship size={32} className="text-white drop-shadow-lg"/></div>}
                    {isTrashed && <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[2px] flex items-center justify-center"><Trash2 size={32} className="text-white drop-shadow-lg"/></div>}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase num-font shadow-sm ${isAbandoned ? 'bg-indigo-600 text-white' : isTrashed ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                      {isAbandoned ? '公海' : isTrashed ? '垃圾站' : '运营中'}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <h3 className="font-black text-sm text-slate-800 line-clamp-2 h-10">{product.name}</h3>
                    <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                       <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                          <div className="flex items-center gap-2">
                             <img src={operator?.avatar || 'https://picsum.photos/seed/u/20'} className="w-5 h-5 rounded-md object-cover opacity-60" />
                             <span>{operator?.name || '待认领'}</span>
                          </div>
                          <span className="num-font">D{product.dayCount}</span>
                       </div>
                       <div className="flex flex-col gap-2 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setSelectedProduct(product)} className="py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black hover:bg-slate-900 hover:text-white transition-all ios-btn">详情</button>
                             {!isTrashed && <button onClick={(e) => handleEditClick(e, product)} className="py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all ios-btn">编辑</button>}
                          </div>
                          
                          {isAbandoned && <button onClick={(e) => handleClaimClick(e, product.id)} className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 shadow-md ios-btn">认领资产</button>}
                          
                          {isActive && (
                            <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setActionTarget({ id: product.id, type: 'abandon' })} className="py-2 bg-orange-50 text-orange-600 rounded-xl text-[9px] font-black hover:bg-orange-600 hover:text-white transition-all ios-btn">放弃</button>
                               <button onClick={() => setActionTarget({ id: product.id, type: 'trash' })} className="py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black hover:bg-red-600 hover:text-white transition-all ios-btn">删除</button>
                            </div>
                          )}

                          {isTrashed && (
                            <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => handleRestore(product.id)} className="py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black hover:bg-blue-600 hover:text-white transition-all ios-btn">还原</button>
                               <button onClick={() => setActionTarget({ id: product.id, type: 'delete' })} className="py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black hover:bg-red-600 transition-all ios-btn">清除</button>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
               <Package size={48} className="mb-4 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest">暂无相关资产记录</p>
            </div>
          )}
        </div>
      </div>

      {actionTarget && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setActionTarget(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border-t-8 border-orange-500" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center">
                    <AlertTriangle size={32} />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800">确认执行该操作？</h2>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                       {actionTarget.type === 'abandon' ? '资产将回到公共资源池供全员认领，同时会扣除您的信用分。' : 
                        actionTarget.type === 'trash' ? '资产将移至垃圾站，会显著影响您的信用评级。' : 
                        '此操作将永久抹除该资产所有历史数据，不可恢复！'}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full pt-2">
                    <button onClick={() => setActionTarget(null)} className="px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 text-xs">取消</button>
                    <button onClick={confirmAction} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl text-xs">确认执行</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {claimingProductId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setClaimingProductId(null)}>
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 animate-in zoom-in fade-in duration-300 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-slate-800">指派认领人</h2>
                 <button onClick={() => setClaimingProductId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                 {members.map(member => (
                   <button 
                     key={member.id}
                     onClick={() => executeClaim(claimingProductId, member.id)}
                     className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-white border border-slate-50 hover:border-blue-100 rounded-2xl transition-all ios-btn group"
                   >
                     <img src={member.avatar} className="w-10 h-10 rounded-xl border border-white shadow-sm" />
                     <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                           <p className="font-black text-slate-800 text-sm">{member.name}</p>
                           {member.creditScore < 60 && <ShieldAlert size={14} className="text-red-500" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role} | 信用: {member.creditScore}</p>
                     </div>
                     <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-500"/>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-center justify-center p-6" onClick={() => setSelectedProduct(null)}>
           <div className="bg-white w-full max-w-4xl rounded-[3rem] p-8 shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex gap-6 mb-8 items-center border-b border-slate-50 pb-8">
                 <img src={selectedProduct.image} className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-white" />
                 <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{selectedProduct.name}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{selectedProduct.storeName} | ID: {selectedProduct.productId}</p>
                 </div>
                 <button onClick={() => setSelectedProduct(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:text-red-500 transition-all"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-2 gap-10 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">实操决策区</h4>
                    <div className="grid grid-cols-1 gap-4">
                       <a href={selectedProduct.link} target="_blank" className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm"><ExternalLink size={18}/> 详情页</a>
                       {selectedProduct.profitLink && <a href={selectedProduct.profitLink} target="_blank" className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"><PieChart size={18}/> 利润表</a>}
                       {selectedProduct.imagePackagePath && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FolderOpen size={12}/> 商品图包路径</h5>
                           <p className="text-xs font-bold text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-100 shadow-inner select-all">{selectedProduct.imagePackagePath}</p>
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">操作轨迹</h4>
                    <div className="space-y-3 relative pl-4 border-l-2 border-slate-100">
                       {selectedProduct.history.slice().reverse().map(log => (
                          <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-white">
                             <div className="flex justify-between text-[10px] font-black text-slate-300 mb-1">
                                <span>DAY {log.dayIndex}</span>
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed">{log.content}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[160] flex items-center justify-center p-6" onClick={closeAddModal}>
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in zoom-in fade-in duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{editingProductId ? '编辑资产信息' : '录入公海资源资产'}</h2>
                <button onClick={closeAddModal} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 <div onClick={() => addImageInputRef.current?.click()} className="relative group h-48 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden shadow-inner">
                    <input type="file" ref={addImageInputRef} className="hidden" accept="image/*" onChange={(e) => {
                       const f = e.target.files?.[0];
                       if (f) {
                          const r = new FileReader();
                          r.onload = x => setProductForm({...productForm, image: x.target?.result as string});
                          r.readAsDataURL(f);
                       }
                    }} />
                    {productForm.image ? (
                      <>
                        <img src={productForm.image} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                           <Camera size={32} />
                           <span className="text-xs font-black mt-2 uppercase tracking-widest">更换图片</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="text-slate-300 mb-2" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">点击上传资产主图</span>
                      </>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Tag size={12} className="text-blue-500" /> 资产名称
                       </label>
                       <input 
                         type="text" 
                         className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                         placeholder="输入资产全称" 
                         value={productForm.name} 
                         onChange={e => setProductForm({...productForm, name: e.target.value})} 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Fingerprint size={12} className="text-indigo-500" /> 资产 ID
                          </label>
                          <input 
                            type="text" 
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 num-font focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="产品 ID" 
                            value={productForm.productId} 
                            onChange={e => setProductForm({...productForm, productId: e.target.value})} 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Store size={12} className="text-orange-500" /> 店铺名
                          </label>
                          <input 
                            type="text" 
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="归属店铺" 
                            value={productForm.storeName} 
                            onChange={e => setProductForm({...productForm, storeName: e.target.value})} 
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Link size={12} className="text-emerald-500" /> 商品链接
                       </label>
                       <input 
                         type="text" 
                         className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                         placeholder="详情页 URL" 
                         value={productForm.link} 
                         onChange={e => setProductForm({...productForm, link: e.target.value})} 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <PieChart size={12} className="text-rose-500" /> 利润核算
                          </label>
                          <input 
                            type="text" 
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="核算表 URL (可选)" 
                            value={productForm.profitLink} 
                            onChange={e => setProductForm({...productForm, profitLink: e.target.value})} 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <FolderOpen size={12} className="text-blue-500" /> 商品图包路径
                          </label>
                          <input 
                            type="text" 
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="NAS/云端存放路径" 
                            value={productForm.imagePackagePath} 
                            onChange={e => setProductForm({...productForm, imagePackagePath: e.target.value})} 
                          />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <button onClick={closeAddModal} className="py-5 border-2 border-slate-100 text-slate-400 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all ios-btn">取消</button>
                    <button onClick={handleSaveProduct} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-blue-600 transition-all ios-btn">
                       {editingProductId ? '保存修改' : '录入系统'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductLibrary;
