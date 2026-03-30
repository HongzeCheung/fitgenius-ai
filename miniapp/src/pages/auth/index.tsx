import React from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';

const AuthPage: React.FC = () => {
  const { dispatch } = useAppStore();

  const handleWechatAuth = async () => {
    try {
      await authService.wechatLogin();
      dispatch({ type: 'set_authenticated', payload: true });
      Taro.redirectTo({ url: '/pages/dashboard/index' });
    } catch (error: any) {
      Taro.showToast({ title: error?.message || '微信授权失败', icon: 'none' });
    }
  };

  return (
    <View style={{ padding: '48rpx' }}>
      <View className='card' style={{ marginTop: '120rpx' }}>
        <Text style={{ fontSize: '42rpx', fontWeight: 700 }}>FitGenius 小程序</Text>
        <View style={{ marginTop: '20rpx', color: '#64748b' }}>通过微信一键登录，开启训练记录与分析。</View>
        <Button className='primary-btn' style={{ marginTop: '40rpx' }} onClick={handleWechatAuth}>
          微信授权登录
        </Button>
      </View>
    </View>
  );
};

export default AuthPage;
