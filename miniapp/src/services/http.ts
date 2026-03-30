import Taro from '@tarojs/taro';

const BASE_URL = process.env.API_BASE_URL || 'https://fit-backend-1jpe.onrender.com/api';
const TOKEN_KEY = 'fg_token';

export const tokenStorage = {
  get() {
    return Taro.getStorageSync<string>(TOKEN_KEY) || '';
  },
  set(token: string) {
    Taro.setStorageSync(TOKEN_KEY, token);
  },
  clear() {
    Taro.removeStorageSync(TOKEN_KEY);
  }
};

export async function request<T>(url: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
  const token = tokenStorage.get();
  const response = await Taro.request<T>({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (response.statusCode === 401 || response.statusCode === 403) {
    tokenStorage.clear();
    throw new Error('登录状态失效，请重新登录');
  }

  if (response.statusCode >= 400) {
    throw new Error((response.data as any)?.message || '请求失败');
  }

  return response.data;
}
