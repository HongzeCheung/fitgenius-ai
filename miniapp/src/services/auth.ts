import Taro from '@tarojs/taro';
import { request, tokenStorage } from './http';

interface AuthResponse {
  token: string;
}

async function getUserProfilePayload() {
  const canUseGetUserProfile = typeof Taro.getUserProfile === 'function';

  if (canUseGetUserProfile) {
    const profile = await Taro.getUserProfile({ desc: '用于完善用户资料并同步训练数据' });
    return {
      encryptedData: profile.encryptedData,
      iv: profile.iv,
      rawData: profile.rawData,
      signature: profile.signature,
      userInfo: profile.userInfo
    };
  }

  return {};
}

export const authService = {
  hasToken() {
    return Boolean(tokenStorage.get());
  },
  logout() {
    tokenStorage.clear();
  },
  async wechatLogin() {
    const loginRes = await Taro.login();

    if (!loginRes.code) {
      throw new Error('微信登录失败：未获取到 code');
    }

    const profilePayload = await getUserProfilePayload();

    let result: AuthResponse;
    try {
      result = await request<AuthResponse>('/auth/wechat', 'POST', {
        code: loginRes.code,
        ...profilePayload
      });
    } catch {
      result = await request<AuthResponse>('/auth/wechat-miniapp', 'POST', {
        code: loginRes.code,
        ...profilePayload
      });
    }

    tokenStorage.set(result.token);
    return result;
  }
};
