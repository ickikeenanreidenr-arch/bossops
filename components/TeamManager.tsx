/**
 * 团队成员管理组件。
 * 支持 CRUD 操作，创建新成员时同步创建登录账号。
 * 所有操作通过 API 与后端交互。
 */

import React, { useState, useRef } from 'react';
import { Member, Product, Target, ProductStatus } from '../types';
import {
  UserPlus, Edit2, Trash2, Phone, Mail, ShieldCheck,
  X, Camera, Upload, AlertTriangle, Info, Eye, EyeOff, Crown
} from 'lucide-react';
import { getCreditColor } from '../constants';
import { membersApi } from '../services/api';

interface TeamManagerProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  products: Product[];
  targets: Target[];
}

interface MemberFormData {
  name: string;
  role: string;
  contact: string;
  avatar: string;
  // 登录账号相关
  username: string;
  password: string;
  accountRole: 'admin' | 'user';
}

const EMPTY_FORM: MemberFormData = {
  name: '', role: '', contact: '', avatar: '',
  username: '', password: '', accountRole: 'user',
};

const TeamManager: React.FC<TeamManagerProps> = ({ members, setMembers, products, targets }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>({ ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setShowModal(false);
    setEditingMemberId(null);
    setMemberForm({ ...EMPTY_FORM });
    setShowPassword(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      role: member.role,
      contact: member.contact,
      avatar: member.avatar,
      username: '',
      password: '',
      accountRole: 'user',
    });
    setShowModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMemberForm(prev => ({ ...prev, avatar: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ============== 保存成员（创建/更新均走 API） ==============
  const handleSaveMember = async () => {
    const { name, role, contact, avatar, username, password, accountRole } = memberForm;

    if (!name.trim() || !role.trim() || !contact.trim()) {
      window.alert('请填写完整的信息（姓名、岗位及联系电话）');
      return;
    }

    // 新建时要求填写用户名和密码
    if (!editingMemberId) {
      if (!username.trim() || !password.trim()) {
        window.alert('创建新成员时必须设置登录用户名和密码');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingMemberId) {
        // 编辑现有成员
        const updated = await membersApi.update(editingMemberId, {
          name,
          role,
          contact,
          avatar: avatar || undefined,
        });
        setMembers(prev => prev.map(m => m.id === editingMemberId ? updated : m));
      } else {
        // 创建新成员（含登录账号）
        const created = await membersApi.create({
          name,
          role,
          contact,
          avatar,
          username,
          password,
          accountRole,
        } as any);
        setMembers(prev => [...prev, created]);
      }
      closeModal();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSaving(false);
    }
  };

  // ============== 删除成员 ==============
  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await membersApi.delete(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      setMemberToDelete(null);
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">团队全员管理</h2>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Team Performance & Personnel</p>
        </div>
        <button
          onClick={() => { setEditingMemberId(null); setMemberForm({ ...EMPTY_FORM }); setShowModal(true); }}
          className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-sm"
        >
          <UserPlus size={18} /> 入职新伙伴
        </button>
      </div>

      {/* 成员卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {members.map(member => {
          const memberActiveProductsCount = products.filter(p =>
            p.operatorId === member.id &&
            (p.status === ProductStatus.PENDING || p.status === ProductStatus.ACTIVE || p.status === ProductStatus.MAINTENANCE)
          ).length;

          const memberCompletedTargetsCount = targets.filter(t =>
            t.operatorId === member.id && !!t.completedAt
          ).length;

          return (
            <div key={member.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 relative">
              <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-950 relative">
                <div className="absolute -bottom-8 left-6">
                  <img src={member.avatar} className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-white object-cover" alt="" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/40 transition-all shadow-sm border border-white/10"
                    title="编辑成员信息"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setMemberToDelete(member)}
                    className="p-2 bg-red-500/80 backdrop-blur-md text-white rounded-xl hover:bg-red-600 transition-all shadow-sm border border-white/10"
                    title="移除成员"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="pt-12 p-6">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">{member.name}</h3>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 truncate">{member.role}</p>
                  </div>
                  <div className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black border shadow-sm ${getCreditColor(member.creditScore)}`}>
                    {member.creditScore} BP
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                      <Phone size={14} />
                    </div>
                    <span className="truncate num-font">{member.contact}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                      <Mail size={14} />
                    </div>
                    <span className="truncate">{member.name.toLowerCase()}@bossops.com</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">活跃产品</p>
                    <p className="text-base font-black text-slate-800 num-font">{memberActiveProductsCount}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">完成目标</p>
                    <p className="text-base font-black text-slate-800 num-font">{memberCompletedTargetsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============== 成员编辑 / 新增模态框 ============== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 animate-in fade-in zoom-in duration-300 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                {editingMemberId ? '编辑成员配置' : '伙伴正式入职'}
              </h2>
              <button
                onClick={closeModal}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all ios-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* 头像上传 */}
              <div className="flex justify-center mb-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-slate-50 flex items-center justify-center text-slate-300 overflow-hidden shadow-inner transition-all group-hover:border-blue-200">
                    {memberForm.avatar ? (
                      <img src={memberForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <UserPlus size={40} />
                    )}
                    <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                      <Camera size={20} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-widest">更新</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-blue-600 rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                    <Upload size={14} />
                  </div>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">伙伴姓名</label>
                <input
                  type="text" placeholder="请输入伙伴真实姓名"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">岗位角色</label>
                <input
                  type="text" placeholder="例如: 金牌运营、资深设计"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">联系电话</label>
                <input
                  type="text" placeholder="请输入 11 位手机号"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all num-font"
                  value={memberForm.contact}
                  onChange={(e) => setMemberForm({ ...memberForm, contact: e.target.value })}
                />
              </div>

              {/* 登录账号信息区 — 仅在新建时显示 */}
              {!editingMemberId && (
                <>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-5">
                      <ShieldCheck size={16} className="text-blue-500" />
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">登录账号设置</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">登录用户名</label>
                        <input
                          type="text" placeholder="用于系统登录的用户名"
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all"
                          value={memberForm.username}
                          onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">登录密码</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'} placeholder="设置初始密码"
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all pr-12"
                            value={memberForm.password}
                            onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                          />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* 角色选择 */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">系统权限</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setMemberForm({ ...memberForm, accountRole: 'user' })}
                            className={`p-4 rounded-2xl border-2 transition-all text-center ${memberForm.accountRole === 'user'
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${memberForm.accountRole === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                              <ShieldCheck size={20} />
                            </div>
                            <p className={`text-sm font-black ${memberForm.accountRole === 'user' ? 'text-blue-700' : 'text-slate-500'}`}>
                              普通用户
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">仅限工作台操作</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberForm({ ...memberForm, accountRole: 'admin' })}
                            className={`p-4 rounded-2xl border-2 transition-all text-center ${memberForm.accountRole === 'admin'
                              ? 'border-amber-500 bg-amber-50 shadow-md'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${memberForm.accountRole === 'admin' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                              <Crown size={20} />
                            </div>
                            <p className={`text-sm font-black ${memberForm.accountRole === 'admin' ? 'text-amber-700' : 'text-slate-500'}`}>
                              管理员
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">可进入管理后台</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={closeModal}
                className="flex-1 px-8 py-5 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveMember}
                disabled={saving}
                className="flex-[2] px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-blue-600 shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : editingMemberId ? '确认更新' : '确认入职'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== 删除确认模态框 ============== */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border-t-8 border-red-500">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-red-500/10">
                <AlertTriangle size={40} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">确认要移除该成员吗？</h2>
                <p className="text-slate-400 font-bold text-sm leading-relaxed px-4">
                  您正在尝试移除 <span className="text-red-500 font-black">{memberToDelete.name}</span>。此操作将导致其负责的资产自动转入待分配状态，历史统计数据将永久脱钩。
                </p>
              </div>
              <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-400 font-bold text-left leading-normal">
                  提示：如果只是岗位变动，建议使用"编辑"功能修改信息，而不是直接删除。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
                >
                  暂不移除
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  确定移除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
