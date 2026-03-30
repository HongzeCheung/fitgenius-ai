import React, { useMemo, useState } from 'react';
import { Button, Input, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { api } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { ExerciseLog, WorkoutLog } from '@/types/shared';
import { estimateCalories } from '@/utils/calorie';

const WorkoutLogPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);

  const calories = useMemo(() => {
    return estimateCalories(Number(duration || 0), state.profile?.weight || 75, exercises);
  }, [duration, state.profile?.weight, exercises]);

  const handleAddStrength = () => {
    if (!exerciseName || !sets || !reps) {
      Taro.showToast({ title: '请补全动作信息', icon: 'none' });
      return;
    }

    const setCount = Number(sets);
    const setList = Array.from({ length: setCount }, () => ({ weight: Number(weight || 0), reps: Number(reps) }));
    const next = [...exercises, { name: exerciseName, type: 'strength' as const, sets: setList }];
    setExercises(next);
    setExerciseName('');
    setSets('');
    setReps('');
    setWeight('');
  };

  const handleSubmit = async () => {
    if (!title || !duration) {
      Taro.showToast({ title: '请填写标题与时长', icon: 'none' });
      return;
    }

    const newLog: WorkoutLog = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      title,
      duration: Number(duration),
      calories,
      notes,
      exercises
    };

    try {
      await api.addWorkoutLog(newLog);
      dispatch({ type: 'set_logs', payload: [newLog, ...state.logs] });
      Taro.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch (error: any) {
      Taro.showToast({ title: error?.message || '保存失败', icon: 'none' });
    }
  };

  return (
    <View style={{ padding: '24rpx', paddingBottom: '48rpx' }}>
      <View className='card'>
        <Input value={title} onInput={(e) => setTitle(e.detail.value)} placeholder='训练标题（如：上肢日）' />
        <Input
          style={{ marginTop: '16rpx' }}
          type='number'
          value={duration}
          onInput={(e) => setDuration(e.detail.value)}
          placeholder='训练总时长（分钟）'
        />
        <Textarea style={{ marginTop: '16rpx', minHeight: '160rpx' }} value={notes} onInput={(e) => setNotes(e.detail.value)} placeholder='备注' />
      </View>

      <View className='card' style={{ marginTop: '24rpx' }}>
        <Input value={exerciseName} onInput={(e) => setExerciseName(e.detail.value)} placeholder='动作名（如：深蹲）' />
        <View style={{ display: 'flex', gap: '12rpx', marginTop: '16rpx' }}>
          <Input type='number' value={sets} onInput={(e) => setSets(e.detail.value)} placeholder='组数' />
          <Input type='number' value={reps} onInput={(e) => setReps(e.detail.value)} placeholder='次数' />
          <Input type='number' value={weight} onInput={(e) => setWeight(e.detail.value)} placeholder='重量kg' />
        </View>
        <Button style={{ marginTop: '20rpx' }} onClick={handleAddStrength}>添加动作</Button>

        <View style={{ marginTop: '20rpx', color: '#64748b' }}>已添加 {exercises.length} 个动作</View>
        <View style={{ marginTop: '8rpx', color: '#f97316', fontWeight: 700 }}>预计消耗 {calories} kcal</View>
      </View>

      <Button className='primary-btn' style={{ marginTop: '24rpx' }} onClick={handleSubmit}>提交训练记录</Button>
    </View>
  );
};

export default WorkoutLogPage;
