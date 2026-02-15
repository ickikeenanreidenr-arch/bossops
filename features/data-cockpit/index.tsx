
import React, { useState, useMemo } from 'react';
import { Product, Member, ProductStatus } from '../../types.ts';
import { Search, Activity, LayoutGrid, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import EntryModal from './components/EntryModal.tsx';

interface DataCockpitProps {
  products: Product[];
  setProducts: (fn: (prev: Product[]) => Product[]) => void;
  members: Member[];
}

const DataCockpit: React.FC<DataCockpitProps> = ({ products, setProducts, members }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const operator = members.find(m => m.id === p.operatorId);
      const operatorName = operator ? operator.name.toLowerCase() : '';
      const query = searchQuery.toLowerCase();
      
      const matchSearch = p.name.toLowerCase().includes(query) || 
                          p.productId.includes(query) ||
                          p.storeName.toLowerCase().includes(query) ||
                          operatorName.includes(query);
                          
      const isPending = p.lastUpdateDate !== todayStr;
      const isNotTrashed = p.status !== ProductStatus.TRASHED;
      return matchSearch && isNotTrashed && (!onlyPending || isPending);
    });
  }, [products, searchQuery, onlyPending, todayStr, members]);

  const pendingCount = useMemo(() => 
    products.filter(p => p.lastUpdateDate !== todayStr && p.status !== ProductStatus.TRASHED).length
  , [products, todayStr]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 智能搜索栏 */}
      <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-xl border-white/80">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="搜资产名称、ID、负责人或归属店铺..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setOnlyPending(!onlyPending)}
            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${onlyPending ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {onlyPending ? <AlertCircle size={16}/> : <LayoutGrid size={16}/>}
            {onlyPending ? `待更新 (${pendingCount})` : '全部资产'}
          </button>
        </div>
      </div>

      {/* 资产矩阵网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-10">
        {filteredProducts.map(p => {
          const isPending = p.lastUpdateDate !== todayStr;
          const operator = members.find(m => m.id === p.operatorId);
          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProduct(p)}
              className={`group glass-panel rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-2 ${isPending ? 'border-rose-400/30 animate-pulse ring-4 ring-rose-400/10' : 'border-emerald-400/20 ring-4 ring-emerald-400/5'}`}
            >
              <div className="aspect-square overflow-hidden bg-slate-100 relative">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                <div className="absolute top-4 right-4">
                  {isPending ? (
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                      <Activity size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}></span>
                  <h3 className="font-black text-slate-800 line-clamp-1 flex-1">{p.name}</h3>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 bg-slate-50 p-2 rounded-xl">
                  <span className="flex items-center gap-1 uppercase tracking-widest truncate">负责人: {operator?.name || '未指派'}</span>
                  <span className={`font-black uppercase tracking-widest ${isPending ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isPending ? '待更新' : '已同步'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-100">
            <TrendingUp size={64} className="opacity-10 mb-6" />
            <p className="text-sm font-black uppercase tracking-widest opacity-40 italic">未发现相关资产记录</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <EntryModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          setProducts={setProducts}
          members={members}
        />
      )}
    </div>
  );
};

export default DataCockpit;
