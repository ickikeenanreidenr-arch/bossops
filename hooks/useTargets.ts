/**
 * 致富目标数据管理 Hook。
 * 按工作区加载目标，提供 CRUD 操作并自动同步后端。
 */

import { useState, useEffect, useCallback } from 'react';
import { Target, WorkspaceType } from '../types';
import { targetsApi } from '../services/api';

export function useTargets(workspace: WorkspaceType | null) {
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTargets = useCallback(async () => {
        if (!workspace) return;
        try {
            setLoading(true);
            const data = await targetsApi.getAll(workspace);
            setTargets(data);
        } catch (err) {
            console.error('加载目标失败:', err);
        } finally {
            setLoading(false);
        }
    }, [workspace]);

    useEffect(() => {
        fetchTargets();
    }, [fetchTargets]);

    /**
     * 兼容旧组件的 setTargets 接口。
     */
    const setTargetsCompat = useCallback((newTargetsOrFn: Target[] | ((prev: Target[]) => Target[])) => {
        setTargets(newTargetsOrFn);
    }, []);

    return {
        targets,
        loading,
        fetchTargets,
        setTargets: setTargetsCompat,
    };
}
