
import React, { useState, useCallback } from 'react';
import { WorkspaceType, Member, Product, Target, CreditRecord } from './types';
import { useMembers } from './hooks/useMembers';
import { useProducts } from './hooks/useProducts';
import { useTargets } from './hooks/useTargets';
import { useAuth } from './hooks/useAuth';
import { creditsApi } from './services/api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductOps from './components/ProductOps';
import ProductLibrary from './components/ProductLibrary';
import TargetManager from './components/TargetManager';
import VisualLab from './components/VisualLab';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import { ShoppingBag, Factory, ShieldCheck, Loader2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdmin, setShowAdmin] = useState(false);

  // 认证状态管理
  const { user, isAuthenticated, isLoading, loginError, login, logout } = useAuth();

  // 通过自定义 Hooks 从后端加载数据
  const { members, setMembers, fetchMembers } = useMembers();
  const { products: currentProducts, setProducts: handleSetProducts, fetchProducts } = useProducts(workspace);
  const { targets: currentTargets, setTargets: handleSetTargets, fetchTargets } = useTargets(workspace);

  /**
   * 信用事件触发器 — 调用后端 API 完成去重与积分计算。
   * 调用后自动刷新成员列表以同步最新积分。
   */
  const triggerCreditEvent = useCallback(async (userId: string, eventType: string, data: any = {}) => {
    try {
      const { relatedId, cycleKey = 'default' } = data;
      await creditsApi.trigger({
        userId,
        eventType,
        relatedId,
        cycleKey,
        data,
      });
      // 刷新成员数据以获取最新积分
      await fetchMembers();
    } catch (err) {
      console.error('信用事件触发失败:', err);
    }
  }, [fetchMembers]);

  // 加载中 — 正在验证 token
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            正在验证登录状态...
          </p>
        </div>
      </div>
    );
  }

  // 未登录 — 显示登录页面
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} error={loginError} />;
  }

  // 管理后台 — 独立全屏页面
  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  // 已登录但未选择工作区 — 显示工作区选择页
  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="z-10 text-center mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6 shadow-sm">
            <ShieldCheck size={16} className="text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">指挥中心 v3.5 正式版</span>
          </div>
          <h1 className="text-8xl font-boss tracking-tighter italic text-slate-900 mb-2">BOSSOPS</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[11px] pl-2">数字化电商战略指挥塔</p>
          {/* 显示当前登录用户 */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-600">
              {user?.displayName || user?.username} 已登录
            </span>
          </div>
        </div>

        <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl animate-in fade-in zoom-in duration-700 delay-300">
          <button onClick={() => setWorkspace('Tmall')} className="group ios-btn relative h-[420px] rounded-[3rem] glass-panel p-12 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
            <div className="mb-10 p-10 rounded-full bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-500 shadow-sm"><ShoppingBag size={64} /></div>
            <h2 className="text-5xl font-boss text-slate-900 mb-4 transition-all duration-700 group-hover:tracking-widest">天猫运营</h2>
            <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">品牌旗舰 & 流量对标</p>
          </button>
          <button onClick={() => setWorkspace('TaoFactory')} className="group ios-btn relative h-[420px] rounded-[3rem] glass-panel p-12 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
            <div className="mb-10 p-10 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm"><Factory size={64} /></div>
            <h2 className="text-5xl font-boss text-slate-900 mb-4 transition-all duration-700 group-hover:tracking-widest">淘工厂运营</h2>
            <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">极致性价比 & 爆款引擎</p>
          </button>
        </div>

        {/* 管理后台入口 — 仅管理员可见 */}
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAdmin(true)}
            className="z-10 mt-10 ios-btn flex items-center gap-3 px-8 py-4 rounded-2xl glass-panel text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 transition-all font-black text-xs uppercase tracking-widest border border-slate-100 shadow-sm animate-in fade-in duration-1000 delay-500"
          >
            <Settings size={16} /> 进入管理后台
          </button>
        )}

        {/* 右上角登出按钮 */}
        <button
          onClick={logout}
          className="fixed top-6 right-6 z-50 ios-btn px-5 py-3 rounded-2xl glass-panel text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-black text-xs uppercase tracking-widest border border-slate-100"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <Layout workspace={workspace} onBack={() => setWorkspace(null)} activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout}>
      {activeTab === 'dashboard' && <Dashboard members={members} products={currentProducts} targets={currentTargets} />}
      {activeTab === 'visualLab' && <VisualLab triggerCreditEvent={triggerCreditEvent} />}
      {activeTab === 'productOps' && <ProductOps members={members} products={currentProducts} setProducts={handleSetProducts} workspace={workspace} triggerCreditEvent={triggerCreditEvent} />}
      {activeTab === 'productLibrary' && <ProductLibrary products={currentProducts} setProducts={handleSetProducts} members={members} triggerCreditEvent={triggerCreditEvent} />}
      {activeTab === 'targetManager' && <TargetManager targets={currentTargets} setTargets={handleSetTargets} members={members} workspace={workspace} triggerCreditEvent={triggerCreditEvent} />}
    </Layout>
  );
};

export default App;
