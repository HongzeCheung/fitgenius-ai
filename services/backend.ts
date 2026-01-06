
import { UserProfile, WorkoutLog, WorkoutPlan } from '../types';

// ==========================================
// 后端配置 (Backend Configuration)
// ==========================================

// ⚠️ 重要提示：
// 1. 请下载 server.js 和 server-package.json
// 2. 在本地运行后端服务器 (node server.js)
// 3. 将下方的 USE_MOCK_BACKEND 改为 false
const USE_MOCK_BACKEND = false; 

// 你的后端 API 地址
const API_BASE_URL = 'https://fit-backend-1jpe.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('fg_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('fg_token');
    window.location.reload(); // 触发 App 重新渲染到登录页
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || '请求失败');
  }
  return response.json();
};

export const backend = {
  // Auth
  async login(username: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response);
    if (data.token) localStorage.setItem('fg_token', data.token);
    return data;
  },

  async register(username: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response);
    if (data.token) localStorage.setItem('fg_token', data.token);
    return data;
  },

  logout() {
    localStorage.removeItem('fg_token');
  },

  hasToken() {
    return !!localStorage.getItem('fg_token');
  },

  // Data
  async getUserProfile(): Promise<UserProfile | null> {
    const response = await fetch(`${API_BASE_URL}/profile`, { headers: getHeaders() });
    return handleResponse(response).catch(() => null);
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(profile),
    });
    await handleResponse(response);
  },

  // 新增：体重记录
  async addWeightLog(weight: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/weight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ weight }),
    });
    return await handleResponse(response);
  },

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    const response = await fetch(`${API_BASE_URL}/logs`, { headers: getHeaders() });
    return handleResponse(response).catch(() => []);
  },

  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(log),
    });
    await handleResponse(response);
  },

  async getActivePlan(): Promise<WorkoutPlan | null> {
    const response = await fetch(`${API_BASE_URL}/plan`, { headers: getHeaders() });
    return handleResponse(response).catch(() => null);
  },

  async saveActivePlan(plan: WorkoutPlan): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plan),
    });
    await handleResponse(response);
  }
};
