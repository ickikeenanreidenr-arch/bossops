/**
 * 团队成员数据管理 Hook。
 * 封装成员的加载、新增、更新、删除操作，统一管理加载与错误状态。
 */

import { useState, useEffect, useCallback } from 'react';
import { Member } from '../types';
import { membersApi } from '../services/api';

export function useMembers() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await membersApi.getAll();
            setMembers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const createMember = useCallback(async (data: { name: string; avatar?: string; role: string; contact: string }) => {
        const created = await membersApi.create(data);
        setMembers(prev => [...prev, created]);
        return created;
    }, []);

    const updateMember = useCallback(async (id: string, data: Partial<Member>) => {
        const updated = await membersApi.update(id, data);
        setMembers(prev => prev.map(m => m.id === id ? updated : m));
        return updated;
    }, []);

    const deleteMember = useCallback(async (id: string) => {
        await membersApi.delete(id);
        setMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    /**
     * 允许直接设置 members 状态（兼容旧的 setMembers 回调模式）。
     * 同时同步到后端的更新由调用方负责。
     */
    const setMembersLocal = useCallback((fn: Member[] | ((prev: Member[]) => Member[])) => {
        setMembers(fn);
    }, []);

    return {
        members,
        loading,
        error,
        fetchMembers,
        createMember,
        updateMember,
        deleteMember,
        setMembers: setMembersLocal,
    };
}
