
import React, { useState } from 'react';
import { Member, Product, Target, ProductStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trophy, Calendar, Zap, Users, Flame, Box, Recycle, ChevronDown, ShieldCheck, Clock, Globe, UserCheck } from 'lucide-react';

interface DashboardProps {
  members: Member[];
  products: Product[];
  targets: Target[];
}

const Dashboard: React.FC<DashboardProps> = ({ members, products, targets }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredProducts = selectedMemberId === 'all' 
    ? products 
    : products.filter(p => p.operatorId === selectedMemberId);

  const filteredTargets = selectedMemberId === 'all'
    ? targets
    : targets.filter(t => t.operatorId === selectedMemberId);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const runningCount = filteredProducts.filter(p => 
    p.status === ProductStatus.PENDING || 
    p.status === ProductStatus.ACTIVE || 
    p.status === ProductStatus.MAINTENANCE
  ).length;

  const poolCount = products.filter(p => p.status === ProductStatus.ABANDONED).length;
  const totalAssets = filteredProducts.filter(p => p.status !== ProductStatus.TRASHED).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const totalTargetsCount = filteredTargets.length;
  const totalCompletedCount = filteredTargets.filter(t => !!t.completedAt).length;
  const totalRate = totalTargetsCount > 0 ? Math.round((totalCompletedCount / totalTargetsCount) * 100) : 0;

  const monthlyTargets = filteredTargets.filter(t => {
    const d = new Date(t.deadline);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyCompleted = monthlyTargets.filter(t => !!t.completedAt).length;
  const monthlyRate = monthlyTargets.length > 0 ? Math.round((monthlyCompleted / monthlyTargets.length) * 100) : 0;

  const weeklyTargets = filteredTargets.filter(t => {
    const d = new Date(t.deadline);
    return d >= startOfWeek;
  });
  const weeklyCompleted = weeklyTargets.filter(t => !!t.completedAt).length;
  const weeklyRate = weeklyTargets.length > 0 ? Math.round((weeklyCompleted / weeklyTargets.length) * 100) : 0;

  const pieData = totalAssets > 0 ? [
    { name: '运营中', value: runningCount, color: '#3b82f6' },
    { name: '其他', value: Math.max(0, totalAssets - runningCount), color: '#e2e8f0' }
  ] : [
    { name: '无数据', value: 1, color: '#f1f5f9' }
  ];

  const sortedMembers = [...members].sort((a, b) => b.creditScore - a.creditScore);
  const avgCredit = members.length > 0 ? Math.round(members.reduce((acc, m) => acc + m.creditScore, 0) / members.length) : 0;

  const getBarColor = (score: number, memberId: string) => {
    if (selectedMemberId !== 'all' && memberId !== selectedMemberId) return '#f1f5f9';
    if (score < 60) return '#ef4444'; 
    if (score < 100) return '#f97316'; 
    if (score < 150) return '#3b82f6'; 
    if (score < 180) return '#a855f7'; 
    return '#eab308'; 
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-1000">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between relative z-[60]">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {selectedMemberId === 'all' ? '全员数据总览' : `${selectedMember?.name} · 个人看板`}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            {selectedMemberId === 'all' ? 'Real-time team performance overview' : 'Personal operation and credit tracking'}
          </p>
        </div>
        
        <div className="relative">
           <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-sm transition-all font-black text-xs ios-btn border ${isDropdownOpen ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105' : 'bg-white text-slate-600 border-slate-100 hover:shadow-lg'}`}
            >
              {selectedMemberId === 'all' ? <Globe size={16} className="text-blue-500" /> : <UserCheck size={16} className="text-emerald-500" />}
              <span>{selectedMemberId === 'all' ? '全员视角' : selectedMember?.name}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 opacity-50' : 'text-slate-300'}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 mt-3 w-64 glass-panel rounded-[2rem] shadow-2xl z-20 p-3 animate-in zoom-in-95 fade-in duration-200 origin-top-right border-white border-2">
                   <button 
                     onClick={() => { setSelectedMemberId('all'); setIsDropdownOpen(false); }}
                     className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${selectedMemberId === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                   >
                      <Globe size={14} />
                      <span className="text-xs font-black">全员视角 (Team-wide)</span>
                   </button>
                   <div className="h-px bg-slate-100 my-2 mx-4"></div>
                   <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                     {members.map(m => (
                       <button 
                         key={m.id}
                         onClick={() => { setSelectedMemberId(m.id); setIsDropdownOpen(false); }}
                         className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedMemberId === m.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                       >
                          <img src={m.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/50" alt="" />
                          <div className="text-left">
                            <p className="text-xs font-black">{m.name}</p>
                            <p className={`text-[9px] font-bold uppercase ${selectedMemberId === m.id ? 'text-blue-100' : 'text-slate-400'}`}>{m.role}</p>
                          </div>
                       </button>
                     ))}
                   </div>
                </div>
              </>
            )}
        </div>
      </div>

      {/* 1. 核心统计指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: '致富达成目标', icon: Trophy, color: 'bg-yellow-400', current: totalCompletedCount, total: totalTargetsCount, rate: totalRate, sub: selectedMemberId === 'all' ? '全员累计达成' : '个人累计达成' },
          { label: '本月核心目标', icon: Calendar, color: 'bg-sky-400', current: monthlyCompleted, total: monthlyTargets.length, rate: monthlyRate, sub: '自然月进度' },
          { label: '本周冲刺任务', icon: Zap, color: 'bg-orange-400', current: weeklyCompleted, total: weeklyTargets.length, rate: weeklyRate, sub: '本周实时冲刺' }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-8 rounded-[2.5rem] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-widest num-font">{stat.rate}% 达成</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-tech font-black text-slate-900 italic tracking-tighter num-font">{stat.current}</span>
              <span className="text-xl text-slate-300 font-bold num-font">/ {stat.total}</span>
            </div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 2. 团队资产与英雄榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-[3rem] shadow-sm p-10 flex flex-col relative overflow-hidden">
          <div className="mb-8">
             <h2 className="text-xl font-black text-slate-800">{selectedMemberId === 'all' ? '团队资产概览' : `${selectedMember?.name} 名下资产`}</h2>
             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">Asset flow and distribution</p>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-6 flex-1 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-white shadow-inner space-y-3 hover:bg-white hover:shadow-lg transition-all group">
                  <Flame size={20} className="text-orange-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">正在运营</p>
                    <p className="text-3xl font-tech font-black text-slate-800 num-font">{runningCount} <span className="text-xs not-italic ml-1 text-slate-400">款</span></p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-white shadow-inner space-y-3 hover:bg-white hover:shadow-lg transition-all group">
                  <Box size={20} className="text-amber-600" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">资产库存</p>
                    <p className="text-3xl font-tech font-black text-slate-800 num-font">{totalAssets} <span className="text-xs not-italic ml-1 text-slate-400">款</span></p>
                  </div>
                </div>
              </div>
              
              <div className="bg-rose-50/40 p-5 rounded-[1.5rem] border border-rose-100 flex items-center justify-between group hover:bg-rose-50 transition-all">
                <div>
                   <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">公共资源池 (GLOBAL POOL)</p>
                   <p className="text-xs font-black text-rose-600 mt-1 num-font">{poolCount} <span className="text-[9px] ml-1 opacity-70">款待认领资产</span></p>
                </div>
                <Recycle size={20} className="text-emerald-500 transition-transform group-hover:rotate-180" />
              </div>
            </div>

            <div className="w-60 h-60 relative shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">运营占比</p>
                  <p className="text-4xl font-tech font-black text-slate-800 num-font">{totalAssets > 0 ? Math.round((runningCount/totalAssets)*100) : 0}%</p>
               </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[3rem] shadow-sm p-10 flex flex-col border border-white/80">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                 <Trophy size={20} className="text-yellow-500" /> 团队英雄榜
              </h3>
              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 num-font uppercase">Avg: {avgCredit}</span>
           </div>

           <div className="space-y-4 flex-1">
              {sortedMembers.slice(0, 3).map((member, i) => (
                 <div key={member.id} className={`flex items-center gap-4 group p-2 rounded-2xl transition-all ${selectedMemberId === member.id ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-tech font-black text-lg italic shadow-md num-font ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-600' : 'bg-orange-400 text-white'}`}>
                       {i + 1}
                    </div>
                    <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-slate-800 truncate">{member.name}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{member.role}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-tech font-black text-slate-800 num-font italic leading-none">{member.creditScore}</p>
                       <p className="text-[8px] text-slate-300 font-black uppercase mt-1">Points</p>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">System Rating</span>
                 <ShieldCheck size={16} className="text-blue-400 animate-pulse" />
              </div>
              <p className="text-[11px] font-bold leading-relaxed opacity-80 italic">
                {selectedMemberId === 'all' 
                  ? '“保持团队平均信用分在 120 以上，将解锁更高级别的流量扶持。”'
                  : `“${selectedMember?.name}，你当前的信用等级为 ${memberLevel(selectedMember?.creditScore || 0)}，请继续保持。”`}
              </p>
           </div>
        </div>
      </div>

      {/* 3. 底部：信用对比与动态实录 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-[3rem] shadow-sm p-10 border border-white/80">
          <div className="flex justify-between items-center mb-10 ml-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">信用分可视化对比 (CREDIT ANALYTICS)</h2>
          </div>
          
          <div className="h-[300px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={members} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass-panel p-4 rounded-2xl shadow-xl border-white border-2">
                                  <p className="font-black text-slate-900 text-xs mb-1">{data.name}</p>
                                  <p className="font-tech font-black text-2xl num-font italic" style={{ color: getBarColor(data.creditScore, data.id) }}>{data.creditScore}</p>
                              </div>
                            );
                        }
                        return null;
                    }} />
                    <Bar dataKey="creditScore" radius={[12, 12, 12, 12]} barSize={40}>
                      {members.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.creditScore, entry.id)} />
                      ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>

          <div className="flex justify-center items-center flex-wrap gap-8 bg-slate-50/50 py-5 rounded-[2rem] border border-slate-100/50">
              {[
                { label: '0-59 (危)', color: 'bg-red-500' },
                { label: '60-99 (良)', color: 'bg-orange-500' },
                { label: '100-149 (优)', color: 'bg-blue-500' },
                { label: '150-179 (极)', color: 'bg-purple-500' },
                { label: '180+ (神)', color: 'bg-yellow-500' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase">{item.label}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="glass-panel rounded-[3rem] shadow-sm p-10 flex flex-col border border-white/80">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800">{selectedMemberId === 'all' ? '团队信用动态' : '个人信用流水'}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Live Credit Ledger</p>
              </div>
              <Clock size={20} className="text-slate-300" />
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[400px]">
              {members.flatMap(m => m.creditHistory.map(h => ({...h, userName: m.name, userAvatar: m.avatar, userId: m.id})))
                .filter(h => selectedMemberId === 'all' || h.userId === selectedMemberId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10).map((history) => (
                  <div key={history.id} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-white group hover:bg-white hover:shadow-lg transition-all">
                     <img src={history.userAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white shadow-sm" />
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                           <p className="text-xs font-black text-slate-800">{history.userName}</p>
                           <span className={`text-xs font-black num-font italic ${history.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {history.change > 0 ? `+${history.change}` : history.change}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{history.reason}</p>
                     </div>
                  </div>
                ))}

              {(selectedMemberId === 'all' ? members.every(m => m.creditHistory.length === 0) : selectedMember?.creditHistory.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300">
                   <ShieldCheck size={40} className="opacity-20 mb-4" />
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-40">暂无信用变动记录</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// 辅助函数：根据分数返回称号
const memberLevel = (score: number) => {
  if (score < 60) return 'DANGER (危)';
  if (score < 100) return 'NORMAL (良)';
  if (score < 150) return 'MAIN (优)';
  if (score < 180) return 'CORE (极)';
  return 'ACE (神)';
};

export default Dashboard;
