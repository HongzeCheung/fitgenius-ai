
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
const API_BASE_URL = 'http://localhost:3000/api';

// ==========================================
// 1. 真实后端实现 (Real REST API Client)
// ==========================================
const RealBackend = {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST', // or PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to save profile');
  },

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      return [];
    }
  },

  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!response.ok) throw new Error('Failed to add log');
  },

  async getActivePlan(): Promise<WorkoutPlan | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/plan`);
      if (response.status === 404) return null; // No plan found
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch plan:", error);
      return null;
    }
  },

  async saveActivePlan(plan: WorkoutPlan): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Failed to save plan');
  }
};

// ==========================================
// 2. 模拟后端实现 (Mock / LocalStorage)
// ==========================================
const NETWORK_DELAY = 600; // ms

const MockBackend = {
  async getUserProfile(): Promise<UserProfile | null> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    const data = localStorage.getItem('fg_profile');
    return data ? JSON.parse(data) : null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    localStorage.setItem('fg_profile', JSON.stringify(profile));
  },

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    const data = localStorage.getItem('fg_logs');
    return data ? JSON.parse(data) : [];
  },

  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    const currentLogsStr = localStorage.getItem('fg_logs');
    let currentLogs: WorkoutLog[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
    
    // Check if log exists for the same day
    const newLogDate = new Date(log.date).toDateString();
    const existingIndex = currentLogs.findIndex(l => new Date(l.date).toDateString() === newLogDate);

    if (existingIndex >= 0) {
        // Merge logic
        const existing = currentLogs[existingIndex];
        const updatedLog = {
            ...existing,
            duration: existing.duration + log.duration,
            calories: existing.calories + log.calories,
            exercises: [...existing.exercises, ...log.exercises],
            notes: existing.notes + (log.notes ? ` | ${log.notes}` : '')
        };
        // Update array
        currentLogs[existingIndex] = updatedLog;
    } else {
        // Add new
        currentLogs = [log, ...currentLogs];
    }
    
    localStorage.setItem('fg_logs', JSON.stringify(currentLogs));
  },

  async getActivePlan(): Promise<WorkoutPlan | null> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    const data = localStorage.getItem('fg_active_plan');
    return data ? JSON.parse(data) : null;
  },

  async saveActivePlan(plan: WorkoutPlan): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    localStorage.setItem('fg_active_plan', JSON.stringify(plan));
  }
};

// ==========================================
// Export
// ==========================================
export const backend = USE_MOCK_BACKEND ? MockBackend : RealBackend;
