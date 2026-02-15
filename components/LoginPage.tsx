
import React, { useState, FormEvent } from 'react';
import { ShieldCheck, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
    error: string | null;
}

/**
 * 全屏登录页面 — 延续 BossOps 玻璃拟态设计风格。
 * 未登录时作为首屏展示，成功后跳转到工作区选择界面。
 */
const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !username.trim() || !password.trim()) return;

        setIsSubmitting(true);
        try {
            await onLogin(username.trim(), password.trim());
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            {/* 品牌标识 */}
            <div className="z-10 text-center mb-12 animate-in fade-in slide-in-from-top-10 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6 shadow-sm">
                    <ShieldCheck size={16} className="text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                        安全登录 · Secure Access
                    </span>
                </div>
                <h1 className="text-7xl font-boss tracking-tighter italic text-slate-900 mb-2">
                    BOSSOPS
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[11px] pl-2">
                    数字化电商战略指挥塔
                </p>
            </div>

            {/* 登录表单卡片 */}
            <div className="z-10 w-full max-w-md animate-in fade-in zoom-in duration-700 delay-300">
                <form
                    onSubmit={handleSubmit}
                    className="glass-panel rounded-[3rem] p-10 shadow-2xl space-y-6"
                >
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-black text-slate-800">欢迎回来</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Sign in to continue
                        </p>
                    </div>

                    {/* 错误提示 */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 animate-in fade-in zoom-in duration-300">
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <p className="text-sm font-bold text-red-600">{error}</p>
                        </div>
                    )}

                    {/* 用户名输入 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                            用户名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            autoComplete="username"
                            disabled={isSubmitting}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-slate-800 font-bold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all disabled:opacity-50"
                        />
                    </div>

                    {/* 密码输入 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                            密码
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="请输入密码"
                                autoComplete="current-password"
                                disabled={isSubmitting}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-slate-800 font-bold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all pr-14 disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* 登录按钮 */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !username.trim() || !password.trim()}
                        className="w-full ios-btn flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-800 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>登录中...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>登 入 系 统</span>
                            </>
                        )}
                    </button>

                    {/* 底部提示 */}
                    <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest pt-2">
                        默认账号: admin / admin123
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
