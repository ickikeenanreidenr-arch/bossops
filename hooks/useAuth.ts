/**
 * 认证状态管理 Hook。
 * 管理 JWT token 存储、登录/登出、用户信息获取。
 * Token 持久化到 localStorage，刷新页面后自动恢复登录态。
 */

import { useState, useEffect, useCallback } from 'react';
import { authApi, setAuthToken } from '../services/api';

export interface AuthUser {
    id: string;
    username: string;
    displayName: string;
    role: string;
}

interface UseAuthReturn {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginError: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const TOKEN_KEY = 'bossops_auth_token';

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);

    /**
     * 初始化时检查 localStorage 中是否有有效 token，
     * 有则自动恢复登录状态，避免刷新页面后需要重新登录。
     */
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) {
            setAuthToken(savedToken);
            authApi
                .me()
                .then((userData) => {
                    setUser(userData);
                })
                .catch(() => {
                    // token 无效或过期，清除本地存储
                    localStorage.removeItem(TOKEN_KEY);
                    setAuthToken('');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        setLoginError(null);
        try {
            const res = await authApi.login(username, password);
            localStorage.setItem(TOKEN_KEY, res.accessToken);
            setAuthToken(res.accessToken);
            setUser(res.user);
            return true;
        } catch (err: any) {
            setLoginError(err.message || '登录失败');
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken('');
        setUser(null);
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        loginError,
        login,
        logout,
    };
}
