import React, { useMemo } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { api } from '@/services/api';
import { authService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';

const DashboardPage: React.FC = () => {
  const { state, dispatch } = useAppStore();

  const fetchData = async () => {
    try {
      if (!authService.hasToken()) {
        Taro.redirectTo({ url: '/pages/auth/index' });
        return;
      }

      const [profile, logs] = await Promise.all([api.getUserProfile(), api.getWorkoutLogs()]);
      dispatch({ type: 'set_authenticated', payload: true });
      dispatch({ type: 'set_profile', payload: profile });
      dispatch({ type: 'set_logs', payload: logs || [] });
    } catch (error: any) {
      Taro.showToast({ title: error?.message || '加载失败', icon: 'none' });
    }
  };

  useDidShow(fetchData);
  usePullDownRefresh(async () => {
    await fetchData();
    Taro.stopPullDownRefresh();
  });

  const totalMinutes = useMemo(
    () => state.logs.reduce((sum, item) => sum + Number(item.duration || 0), 0),
    [state.logs]
  );

  return (
    <View style={{ padding: '24rpx' }}>
      <View className='card'>
        <Text style={{ fontSize: '34rpx', fontWeight: 700 }}>你好，{state.profile?.name || '运动家'}</Text>
        <View style={{ marginTop: '24rpx', color: '#64748b' }}>累计训练 {state.logs.length} 次</View>
        <View style={{ marginTop: '8rpx', color: '#64748b' }}>累计时长 {totalMinutes} 分钟</View>
      </View>

      <View className='card' style={{ marginTop: '24rpx' }}>
        <Text style={{ fontSize: '30rpx', fontWeight: 600 }}>最近记录</Text>
        {state.logs.slice(0, 5).map((log) => (
          <View key={log.id} style={{ padding: '18rpx 0', borderBottom: '1px solid #eef2ff' }}>
            <View>{log.title}</View>
            <View style={{ color: '#64748b', fontSize: '24rpx' }}>
              {new Date(log.date).toLocaleDateString()} · {log.duration} 分钟 · {log.calories} kcal
            </View>
          </View>
        ))}
        {!state.logs.length && <View style={{ marginTop: '20rpx', color: '#94a3b8' }}>暂无训练记录</View>}
      </View>

      <Button className='primary-btn' style={{ marginTop: '24rpx' }} onClick={() => Taro.navigateTo({ url: '/pages/workout-log/index' })}>
        记录训练
      </Button>
    </View>
  );
};

export default DashboardPage;
