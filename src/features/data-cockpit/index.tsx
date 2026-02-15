
import React, { useState, useMemo } from 'react';
import { Product, Member } from '../../types';
import { Search, Filter, Activity, Sparkles, BarChart3, Clock, LayoutGrid } from 'lucide-react';
import EntryModal from './components/EntryModal';

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
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.productId.includes(searchQuery);
      const isPending = p.lastUpdateDate !== todayStr;
      return matchSearch && (!onlyPending || isPending);
    });
  }, [products, searchQuery, onlyPending, todayStr]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* SmartBar */}
      <div className="glass-panel p-6 rounded-[2.5rem] flex items-center gap-6 shadow-xl border-white/80">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="全站搜索产品名称或 ID..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setOnlyPending(!onlyPending)}
          className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${onlyPending ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
        >
          {onlyPending ? '查看待录入' : '显示全部资产'}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-10">
        {filteredProducts.map(p => {
          const isPending = p.lastUpdateDate !== todayStr;
          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProduct(p)}
              className={`group glass-panel rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-2 ${isPending ? 'border-rose-400/50 animate-pulse' : 'border-white/90'}`}
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-black text-slate-800 line-clamp-1">{p.name}</h3>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>ID: {p.productId}</span>
                  <span className={isPending ? 'text-rose-500' : 'text-emerald-500'}>
                    {isPending ? '待更新' : '已同步'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300">
            <LayoutGrid size={64} className="opacity-10 mb-6" />
            <p className="text-sm font-black uppercase tracking-widest opacity-40">未发现待分析资产</p>
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
