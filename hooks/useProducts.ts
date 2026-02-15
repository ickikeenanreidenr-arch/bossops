/**
 * 商品数据管理 Hook。
 * 按工作区加载商品，提供 CRUD 操作并自动同步后端。
 */

import { useState, useEffect, useCallback } from 'react';
import { Product, WorkspaceType } from '../types';
import { productsApi } from '../services/api';

export function useProducts(workspace: WorkspaceType | null) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        if (!workspace) return;
        try {
            setLoading(true);
            const data = await productsApi.getAll(workspace);
            setProducts(data);
        } catch (err) {
            console.error('加载商品失败:', err);
        } finally {
            setLoading(false);
        }
    }, [workspace]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    /**
     * 兼容旧组件的 setProducts 接口。
     * 接受数组或回调函数，更新本地状态。
     * 后端同步由组件通过 productsApi 单独调用。
     */
    const setProductsCompat = useCallback((newProductsOrFn: Product[] | ((prev: Product[]) => Product[])) => {
        setProducts(newProductsOrFn);
    }, []);

    return {
        products,
        loading,
        fetchProducts,
        setProducts: setProductsCompat,
    };
}
