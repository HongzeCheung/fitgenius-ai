import { request } from './http';
import { UserProfile, WorkoutLog } from '@/types/shared';

export const api = {
  getUserProfile() {
    return request<UserProfile>('/profile');
  },
  getWorkoutLogs() {
    return request<WorkoutLog[]>('/logs');
  },
  addWorkoutLog(payload: WorkoutLog) {
    return request<void>('/logs', 'POST', payload);
  },
  addWeightLog(weight: number) {
    return request<{ weightHistory: { date: string; weight: number }[] }>('/weight', 'POST', { weight });
  }
};
