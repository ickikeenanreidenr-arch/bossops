
import React from 'react';
import { WorkspaceType } from '../types';
import { Power, ChevronRight, Sparkles, LayoutGrid, Zap, Package, Target, LogOut, User } from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface LayoutProps {
  workspace: WorkspaceType;
  onBack: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  user?: AuthUser | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ workspace, onBack, activeTab, setActiveTab, children, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: '总览看板', icon: <LayoutGrid size={20} className="text-blue-500" /> },
    { id: 'visualLab', label: 'AI视觉实验室', icon: <Sparkles size={20} className="text-purple-500" /> },
    { id: 'productOps', label: '运营库', icon: <Zap size={20} className="text-yellow-500" /> },
    { id: 'productLibrary', label: '产品库', icon: <Package size={20} className="text-indigo-500" /> },
    { id: 'targetManager', label: '致富目标', icon: <Target size={20} className="text-rose-500" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/40">
      <aside className="w-80 glass-panel border-r-0 rounded-r-[3rem] m-4 mr-0 flex flex-col z-30 shadow-2xl border-white/90">
        <div className="p-10 flex flex-col items-center">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-boss text-4xl shadow-2xl mb-6 ${workspace === 'Tmall' ? 'bg-red-600 text-white shadow-red-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>B</div>
          <span className="text-3xl font-boss tracking-tighter italic text-slate-900 mb-1">BOSSOPS</span>
          <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mt-2 border-2 shadow-sm ${workspace === 'Tmall' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            {workspace === 'Tmall' ? '天猫中心 v3.5' : '淘工厂中心 v3.5'}
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-3 py-6 custom-scrollbar overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-300 group ios-btn ${activeTab === item.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                }`}
            >
              <div className={`flex items-center justify-center transition-colors ${activeTab === item.id ? 'brightness-125' : ''}`}>
                {item.icon}
              </div>
              <span className="font-black text-base tracking-tight">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-slate-100/80 space-y-3">
          {/* 当前登录用户信息 */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">{user.displayName || user.username}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{user.role}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onBack} className="flex-1 ios-btn flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all font-black border border-slate-100 shadow-inner">
              <Power size={16} />
              <span className="text-[10px] uppercase tracking-widest">切换</span>
            </button>
            {onLogout && (
              <button onClick={onLogout} className="flex-1 ios-btn flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-black border border-slate-100 shadow-inner">
                <LogOut size={16} />
                <span className="text-[10px] uppercase tracking-widest">登出</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-12 shrink-0 z-20">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h1>
        </header>
        {/* 重要修改：改为 overflow-y-auto 允许滚动 */}
        <section className="flex-1 overflow-y-auto custom-scrollbar px-12 pb-12 relative">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
