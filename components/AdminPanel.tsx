/**
 * 管理后台 — 独立全屏页面。
 * 三大功能区：数据总览、用户管理、数据调整。
 * 设计风格与 LoginPage 一致，使用深色玻璃拟态。
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft, Users, Package, Target, TrendingUp,
    Shield, UserPlus, Trash2, KeyRound, BarChart3,
    PieChart, Crown, Award, Minus, Plus, RefreshCw,
    ChevronDown, X, Eye, EyeOff, AlertTriangle, Info
} from 'lucide-react';
import { adminApi, authApi, membersApi, productsApi, targetsApi } from '../services/api';
import { Member, Product, Target as TargetType } from '../types';
import TeamManager from './TeamManager';

interface AdminPanelProps {
    onBack: () => void;
}

// 统计数据类型
interface StatsData {
    overview: {
        totalMembers: number;
        totalProducts: number;
        totalTargets: number;
        completedTargets: number;
        targetCompletionRate: number;
        avgCredit: number;
        maxCredit: number;
        minCredit: number;
    };
    creditDistribution: Record<string, number>;
    productStatusDistribution: Record<string, number>;
    workspaceComparison: {
        tmall: { products: number; targets: number; completedTargets: number };
        taoFactory: { products: number; targets: number; completedTargets: number };
    };
    memberRanking: { id: string; name: string; role: string; creditScore: number }[];
}

interface AdminUser {
    id: string;
    username: string;
    displayName: string;
    role: string;
}

type TabType = 'overview' | 'users' | 'data';

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [stats, setStats] = useState<StatsData | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 团队管理所需数据（从 API 获取）
    const [members, setMembers] = useState<Member[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allTargets, setAllTargets] = useState<TargetType[]>([]);

    // 注册表单
    const [showRegister, setShowRegister] = useState(false);
    const [registerForm, setRegisterForm] = useState({ username: '', password: '', displayName: '' });
    const [registerLoading, setRegisterLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 积分调整
    const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string } | null>(null);
    const [adjustForm, setAdjustForm] = useState({ change: 0, reason: '' });
    const [adjustLoading, setAdjustLoading] = useState(false);

    // 重置密码
    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    // 删除确认
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

    const loadStats = useCallback(async () => {
        try {
            const data = await adminApi.getStats();
            setStats(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '加载统计数据失败');
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const data = await adminApi.getUsers();
            setUsers(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '加载用户列表失败');
        }
    }, []);

    const loadTeamData = useCallback(async () => {
        try {
            const [membersData, tmallProducts, taoProducts, tmallTargets, taoTargets] = await Promise.all([
                membersApi.getAll(),
                productsApi.getAll('Tmall'),
                productsApi.getAll('TaoFactory'),
                targetsApi.getAll('Tmall'),
                targetsApi.getAll('TaoFactory'),
            ]);
            setMembers(membersData);
            setAllProducts([...tmallProducts, ...taoProducts]);
            setAllTargets([...tmallTargets, ...taoTargets]);
        } catch (err: unknown) {
            console.error('加载团队数据失败:', err);
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        await Promise.all([loadStats(), loadUsers(), loadTeamData()]);
        setLoading(false);
    }, [loadStats, loadUsers, loadTeamData]);

    useEffect(() => { loadData(); }, [loadData]);

    // ============== 操作处理 ==============

    const handleRegister = async () => {
        if (!registerForm.username.trim() || !registerForm.password.trim()) return;
        setRegisterLoading(true);
        try {
            await authApi.register({
                username: registerForm.username,
                password: registerForm.password,
                displayName: registerForm.displayName || registerForm.username,
            });
            setShowRegister(false);
            setRegisterForm({ username: '', password: '', displayName: '' });
            await loadUsers();
        } catch (err: unknown) {
            window.alert(err instanceof Error ? err.message : '注册失败');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            await adminApi.deleteUser(deleteTarget.id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (err: unknown) {
            window.alert(err instanceof Error ? err.message : '删除失败');
        }
    };

    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword.trim()) return;
        try {
            await adminApi.resetPassword(resetTarget.id, newPassword);
            setResetTarget(null);
            setNewPassword('');
            window.alert('密码重置成功');
        } catch (err: unknown) {
            window.alert(err instanceof Error ? err.message : '重置失败');
        }
    };

    const handleAdjustCredit = async () => {
        if (!adjustTarget || adjustForm.change === 0 || !adjustForm.reason.trim()) return;
        setAdjustLoading(true);
        try {
            await adminApi.adjustCredit(adjustTarget.id, adjustForm.change, adjustForm.reason);
            setAdjustTarget(null);
            setAdjustForm({ change: 0, reason: '' });
            await loadStats();
        } catch (err: unknown) {
            window.alert(err instanceof Error ? err.message : '调整失败');
        } finally {
            setAdjustLoading(false);
        }
    };

    // ============== 子组件：Tab 导航按钮 ==============

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: '数据总览', icon: <BarChart3 size={18} /> },
        { id: 'users', label: '用户管理', icon: <Shield size={18} /> },
        { id: 'data', label: '数据调整', icon: <TrendingUp size={18} /> },
    ];

    // ============== 信用分颜色 ==============
    const getCreditBadge = (score: number) => {
        if (score >= 180) return 'bg-amber-50 text-amber-600 border-amber-200';
        if (score >= 150) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (score >= 100) return 'bg-blue-50 text-blue-600 border-blue-200';
        if (score >= 60) return 'bg-slate-50 text-slate-500 border-slate-200';
        return 'bg-red-50 text-red-600 border-red-200';
    };

    // ============== 渲染：数据总览 ==============

    const renderOverview = () => {
        if (!stats) return null;
        const { overview, creditDistribution, productStatusDistribution, workspaceComparison, memberRanking } = stats;

        // 状态名称映射
        const statusNameMap: Record<string, string> = {
            Pending: '待处理', Active: '运营中', Maintenance: '维护中',
            Paused: '已暂停', Trashed: '已删除',
        };

        const creditLabelMap: Record<string, { label: string; color: string }> = {
            legendary: { label: '传奇 ≥180', color: 'bg-amber-500' },
            excellent: { label: '优秀 150-179', color: 'bg-emerald-500' },
            good: { label: '良好 100-149', color: 'bg-blue-500' },
            normal: { label: '一般 60-99', color: 'bg-slate-400' },
            danger: { label: '危险 <60', color: 'bg-red-500' },
        };

        return (
            <div className="space-y-8">
                {/* 核心指标卡片 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: '团队成员', value: overview.totalMembers, icon: <Users size={22} />, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                        { label: '全部商品', value: overview.totalProducts, icon: <Package size={22} />, color: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/20' },
                        { label: '目标完成率', value: `${overview.targetCompletionRate}%`, icon: <Target size={22} />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', sub: `${overview.completedTargets}/${overview.totalTargets}` },
                        { label: '平均信用分', value: overview.avgCredit, icon: <Award size={22} />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20', sub: `${overview.minCredit} ~ ${overview.maxCredit}` },
                    ].map((card) => (
                        <div key={card.label} className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${card.color} p-7 text-white shadow-xl ${card.shadow}`}>
                            <div className="absolute top-5 right-5 opacity-20">{card.icon}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{card.label}</p>
                            <p className="text-4xl font-black mt-3 num-font">{card.value}</p>
                            {card.sub && <p className="text-[11px] font-bold opacity-60 mt-1">{card.sub}</p>}
                        </div>
                    ))}
                </div>

                {/* 工作区对比 + 信用分布 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 工作区对比 */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <PieChart size={18} className="text-indigo-500" /> 工作区对比
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* 天猫 */}
                            <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">天猫</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">商品数</span>
                                        <span className="text-lg font-black text-slate-800 num-font">{workspaceComparison.tmall.products}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">目标数</span>
                                        <span className="text-lg font-black text-slate-800 num-font">{workspaceComparison.tmall.targets}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">已完成</span>
                                        <span className="text-lg font-black text-emerald-600 num-font">{workspaceComparison.tmall.completedTargets}</span>
                                    </div>
                                </div>
                            </div>
                            {/* 淘工厂 */}
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">淘工厂</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">商品数</span>
                                        <span className="text-lg font-black text-slate-800 num-font">{workspaceComparison.taoFactory.products}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">目标数</span>
                                        <span className="text-lg font-black text-slate-800 num-font">{workspaceComparison.taoFactory.targets}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">已完成</span>
                                        <span className="text-lg font-black text-emerald-600 num-font">{workspaceComparison.taoFactory.completedTargets}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 信用分布 */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-amber-500" /> 信用分分布
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(creditLabelMap).map(([key, { label, color }]) => {
                                const count = creditDistribution[key] || 0;
                                const total = overview.totalMembers || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={key}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">{label}</span>
                                            <span className="text-xs font-black text-slate-700 num-font">{count} 人</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${color} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 商品状态分布 + 成员排行 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 商品状态 */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Package size={18} className="text-indigo-500" /> 商品状态分布
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(productStatusDistribution).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${status === 'Active' ? 'bg-emerald-500' :
                                            status === 'Pending' ? 'bg-amber-500' :
                                                status === 'Maintenance' ? 'bg-blue-500' :
                                                    status === 'Paused' ? 'bg-slate-400' : 'bg-red-400'
                                            }`} />
                                        <span className="text-sm font-bold text-slate-600">{statusNameMap[status] || status}</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-800 num-font">{count}</span>
                                </div>
                            ))}
                            {Object.keys(productStatusDistribution).length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">暂无商品数据</p>
                            )}
                        </div>
                    </div>

                    {/* 成员积分排行 */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Crown size={18} className="text-amber-500" /> 积分排行榜
                        </h3>
                        <div className="space-y-3">
                            {memberRanking.slice(0, 10).map((m, idx) => (
                                <div key={m.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                        idx === 1 ? 'bg-slate-300 text-white' :
                                            idx === 2 ? 'bg-amber-700 text-white' :
                                                'bg-slate-100 text-slate-400'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-700 truncate">{m.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{m.role}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${getCreditBadge(m.creditScore)}`}>
                                        {m.creditScore} BP
                                    </div>
                                </div>
                            ))}
                            {memberRanking.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">暂无成员数据</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============== 渲染：用户管理（统一由 TeamManager 处理） ==============

    const renderUsers = () => (
        <TeamManager members={members} setMembers={setMembers} products={allProducts} targets={allTargets} />
    );

    // ============== 渲染：数据调整 ==============

    const renderDataAdjust = () => {
        if (!stats) return null;
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">积分手动调整</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Manual Credit Score Adjustment</p>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6">
                        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-600 font-bold leading-relaxed">
                            选择成员后可手动增加或扣除积分，所有调整会记录到信用历史中，操作不可撤销。
                        </p>
                    </div>

                    <div className="space-y-3">
                        {stats.memberRanking.map((m) => (
                            <div key={m.id} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md">
                                    {m.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-700">{m.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{m.role}</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${getCreditBadge(m.creditScore)}`}>
                                    {m.creditScore} BP
                                </div>
                                <button
                                    onClick={() => { setAdjustTarget({ id: m.id, name: m.name }); setAdjustForm({ change: 0, reason: '' }); }}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-blue-600 transition-all shadow-md active:scale-95 opacity-70 group-hover:opacity-100"
                                >
                                    调整积分
                                </button>
                            </div>
                        ))}
                        {stats.memberRanking.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-12">暂无成员数据</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ============== 主渲染 ==============

    return (
        <div className="fixed inset-0 bg-slate-100/40 z-[100] flex flex-col overflow-hidden">
            {/* 顶部导航栏 */}
            <header className="h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">BOSSOPS 管理后台</h1>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Administration Console</p>
                    </div>
                </div>

                {/* Tab 切换 */}
                <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={loadData}
                    className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-500 transition-all active:scale-95"
                    title="刷新数据"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {/* 内容区域 */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-bold">正在加载管理数据...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p className="text-red-500 font-bold">{error}</p>
                        <button onClick={loadData} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-black">
                            重试
                        </button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'data' && renderDataAdjust()}
                    </>
                )}
            </main>

            {/* ============== 模态框：创建账号 ============== */}
            {showRegister && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800">创建管理员账号</h2>
                            <button onClick={() => setShowRegister(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名</label>
                                <input
                                    type="text" placeholder="请输入用户名"
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                                    value={registerForm.username}
                                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">密码</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'} placeholder="请设置密码"
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all pr-12"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">显示名称 <span className="text-slate-300">（可选）</span></label>
                                <input
                                    type="text" placeholder="管理员昵称"
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                                    value={registerForm.displayName}
                                    onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowRegister(false)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">
                                取消
                            </button>
                            <button
                                onClick={handleRegister}
                                disabled={registerLoading || !registerForm.username || !registerForm.password}
                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-40"
                            >
                                {registerLoading ? '创建中...' : '确认创建'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============== 模态框：重置密码 ============== */}
            {resetTarget && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800">重置密码</h2>
                            <button onClick={() => setResetTarget(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 font-bold mb-6">
                            将为 <span className="text-slate-800 font-black">{resetTarget.displayName || resetTarget.username}</span> 设置新密码
                        </p>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'} placeholder="请输入新密码"
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all pr-12"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setResetTarget(null)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">取消</button>
                            <button
                                onClick={handleResetPassword}
                                disabled={!newPassword.trim()}
                                className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-xl active:scale-95 disabled:opacity-40"
                            >
                                确认重置
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============== 模态框：删除确认 ============== */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-t-8 border-red-500">
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-red-500/10">
                                <AlertTriangle size={32} className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">确认删除账号？</h2>
                                <p className="text-sm text-slate-400 font-bold mt-2">
                                    将永久删除 <span className="text-red-500 font-black">{deleteTarget.displayName || deleteTarget.username}</span> 的账号
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <button onClick={() => setDeleteTarget(null)} className="py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">取消</button>
                                <button onClick={handleDeleteUser} className="py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl active:scale-95 transition-all">确认删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============== 模态框：积分调整 ============== */}
            {adjustTarget && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800">调整积分</h2>
                            <button onClick={() => setAdjustTarget(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 font-bold mb-6">
                            成员: <span className="text-slate-800 font-black">{adjustTarget.name}</span>
                        </p>

                        {/* 增减按钮 */}
                        <div className="flex items-center justify-center gap-6 mb-6">
                            <button
                                onClick={() => setAdjustForm({ ...adjustForm, change: adjustForm.change - 5 })}
                                className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all active:scale-90 border border-red-100"
                            >
                                <Minus size={20} />
                            </button>
                            <div className={`text-4xl font-black num-font min-w-[80px] text-center ${adjustForm.change > 0 ? 'text-emerald-600' : adjustForm.change < 0 ? 'text-red-500' : 'text-slate-300'
                                }`}>
                                {adjustForm.change > 0 ? `+${adjustForm.change}` : adjustForm.change}
                            </div>
                            <button
                                onClick={() => setAdjustForm({ ...adjustForm, change: adjustForm.change + 5 })}
                                className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition-all active:scale-90 border border-emerald-100"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* 自定义数值 */}
                        <input
                            type="number" placeholder="自定义分值"
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 text-center num-font mb-4 transition-all"
                            value={adjustForm.change || ''}
                            onChange={(e) => setAdjustForm({ ...adjustForm, change: parseInt(e.target.value) || 0 })}
                        />

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">调整原因</label>
                            <input
                                type="text" placeholder="请填写调整原因（必填）"
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                                value={adjustForm.reason}
                                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                            />
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setAdjustTarget(null)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">取消</button>
                            <button
                                onClick={handleAdjustCredit}
                                disabled={adjustLoading || adjustForm.change === 0 || !adjustForm.reason.trim()}
                                className={`flex-[2] py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-40 ${adjustForm.change > 0 ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                            >
                                {adjustLoading ? '处理中...' : adjustForm.change > 0 ? `确认加 ${adjustForm.change} 分` : `确认扣 ${Math.abs(adjustForm.change)} 分`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
