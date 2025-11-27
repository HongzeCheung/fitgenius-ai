import { UserProfile, WorkoutLog, WorkoutPlan } from '../types';

// 模拟网络延迟 (ms)
const NETWORK_DELAY = 600;

// 模拟后端数据库操作
// 在真实项目中，这里会使用 fetch() 调用您的 API 接口
export const backend = {
  
  // 获取用户资料
  async getUserProfile(): Promise<UserProfile | null> {
    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    
    const data = localStorage.getItem('fg_profile');
    return data ? JSON.parse(data) : null;
  },

  // 更新用户资料
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    
    localStorage.setItem('fg_profile', JSON.stringify(profile));
  },

  // 获取训练日志列表
  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    
    const data = localStorage.getItem('fg_logs');
    return data ? JSON.parse(data) : [];
  },

  // 保存新的训练日志
  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    
    // 获取现有数据
    const currentLogsStr = localStorage.getItem('fg_logs');
    const currentLogs: WorkoutLog[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
    
    // 插入新数据 (模拟数据库插入)
    const newLogs = [log, ...currentLogs];
    
    // 保存
    localStorage.setItem('fg_logs', JSON.stringify(newLogs));
  },

  // 获取当前正在执行的计划
  async getActivePlan(): Promise<WorkoutPlan | null> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    const data = localStorage.getItem('fg_active_plan');
    return data ? JSON.parse(data) : null;
  },

  // 保存/覆盖当前计划
  async saveActivePlan(plan: WorkoutPlan): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    localStorage.setItem('fg_active_plan', JSON.stringify(plan));
  }
};