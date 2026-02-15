/**
 * 统一 API 客户端封装。
 * 所有后端请求通过此模块发出，方便统一错误处理和类型约束。
 * 支持 JWT token 自动附加到请求头。
 */

import { Member, Product, Target, CreditRecord } from '../types';

// 本地开发走 Vite 代理 (/api)，生产环境通过 VITE_API_BASE_URL 指向 Render 后端
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 认证 token — 由 useAuth Hook 设置
let authToken = '';

/**
 * 设置 JWT token，后续所有请求将自动携带。
 * 传入空字符串表示清除 token（登出时使用）。
 */
export function setAuthToken(token: string) {
  authToken = token;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 有 token 时自动附加 Authorization 请求头
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const fetchOptions: RequestInit = { method, headers };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${res.status}`);
  }
  return res.json();
}

// ============== Auth ==============

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  };
}

interface AuthUserResponse {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { username, password } }),
  me: () =>
    request<AuthUserResponse>('/auth/me'),
  register: (data: { username: string; password: string; displayName?: string }) =>
    request<AuthUserResponse>('/auth/register', { method: 'POST', body: data }),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', {
      method: 'PUT',
      body: { oldPassword, newPassword },
    }),
};

// ============== Members ==============

export const membersApi = {
  getAll: () => request<Member[]>('/members'),
  create: (data: { name: string; avatar?: string; role: string; contact: string; username?: string; password?: string; accountRole?: string }) =>
    request<Member>('/members', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/members/${id}`, { method: 'DELETE' }),
};

// ============== Products ==============

export const productsApi = {
  getAll: (workspace: string) =>
    request<Product[]>('/products', { params: { workspace } }),
  getById: (id: string) =>
    request<Product>(`/products/${id}`),
  create: (data: Partial<Product> & { workspace: string }) =>
    request<Product>('/products', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' }),
};

// ============== Targets ==============

export const targetsApi = {
  getAll: (workspace: string) =>
    request<Target[]>('/targets', { params: { workspace } }),
  create: (data: Partial<Target> & { workspace: string }) =>
    request<Target>('/targets', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Target>) =>
    request<Target>(`/targets/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/targets/${id}`, { method: 'DELETE' }),
};

// ============== Credits ==============

export interface TriggerCreditBody {
  userId: string;
  eventType: string;
  relatedId?: string;
  cycleKey?: string;
  data?: Record<string, unknown>;
}

export const creditsApi = {
  trigger: (body: TriggerCreditBody) =>
    request<CreditRecord | { skipped: boolean; reason: string }>('/credits/trigger', {
      method: 'POST',
      body,
    }),
};

// ============== Admin ==============

export const adminApi = {
  getStats: () =>
    request<{
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
    }>('/admin/stats'),

  getUsers: () =>
    request<{ id: string; username: string; displayName: string; role: string }[]>('/admin/users'),

  deleteUser: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}`, { method: 'DELETE' }),

  resetPassword: (userId: string, newPassword: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}/reset-password`, {
      method: 'PUT',
      body: { newPassword },
    }),

  adjustCredit: (memberId: string, change: number, reason: string) =>
    request<{ ok: boolean; newScore: number }>(`/admin/members/${memberId}/credit`, {
      method: 'PUT',
      body: { change, reason },
    }),
};
