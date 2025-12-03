
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkoutLogger } from './components/WorkoutLogger';
import { AICoach } from './components/AICoach';
import { AnalysisReport } from './components/AnalysisReport';
import { ExerciseDetail } from './components/ExerciseDetail';
import { WorkoutLog, UserProfile, GoalType } from './types';
import { HomeIcon, DumbbellIcon, BrainIcon, UserIcon, PlusIcon, CloseIcon, CloudIcon, SyncIcon, CheckCircleIcon, AnalysisIcon } from './components/Icons';
import { backend } from './services/backend';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<'dashboard' | 'coach' | 'report' | 'exercises'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '运动家',
    age: 28,
    weight: 75,
    height: 180,
    goal: GoalType.MUSCLE_GAIN,
    fitnessLevel: '中级'
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Load initial data from backend
  useEffect(() => {
    const initData = async () => {
      try {
        const [fetchedLogs, fetchedProfile] = await Promise.all([
          backend.getWorkoutLogs(),
          backend.getUserProfile()
        ]);
        
        if (fetchedLogs) setLogs(fetchedLogs);
        if (fetchedProfile) setProfile(fetchedProfile);
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setIsAppLoading(false);
      }
    };
    initData();
  }, []);

  const handleAddLog = async (newLog: WorkoutLog) => {
    setSyncStatus('syncing');
    try {
        await backend.addWorkoutLog(newLog);
        
        // Optimistic Update: Check if log for this date exists to merge locally
        setLogs(prevLogs => {
            const newLogDate = new Date(newLog.date).toDateString();
            const existingIndex = prevLogs.findIndex(l => new Date(l.date).toDateString() === newLogDate);

            if (existingIndex >= 0) {
                // Merge with existing log
                const updatedLogs = [...prevLogs];
                const existing = updatedLogs[existingIndex];
                
                updatedLogs[existingIndex] = {
                    ...existing,
                    duration: existing.duration + newLog.duration,
                    calories: existing.calories + newLog.calories,
                    exercises: [...existing.exercises, ...newLog.exercises],
                    // Optional: Append title or notes if needed, currently keeping original title
                    notes: existing.notes + (newLog.notes ? ` | ${newLog.notes}` : '')
                };
                return updatedLogs;
            } else {
                // Add new log
                return [newLog, ...prevLogs];
            }
        });

        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
        console.error(e);
        setSyncStatus('error');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus('syncing');
    try {
        await backend.saveUserProfile(profile);
        setIsProfileOpen(false);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
        setSyncStatus('error');
    }
  };

  // Simulate a week of training data
  const simulateData = async () => {
    setIsAppLoading(true);
    const exercises = [
      { name: '平板杠铃卧推', weights: [60, 62.5, 65] },
      { name: '杠铃深蹲', weights: [80, 85, 90] },
      { name: '硬拉', weights: [100, 105, 110] },
      { name: '引体向上', weights: [0, 0, 5] },
      { name: '站姿推举', weights: [40, 42.5, 45] }
    ];

    const newLogs: WorkoutLog[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayExercises = [];
      const exerciseCount = 3;
      for(let j=0; j<exerciseCount; j++) {
        const exTemplate = exercises[(i + j) % exercises.length];
        dayExercises.push({
          name: exTemplate.name,
          sets: [
            { weight: exTemplate.weights[Math.min(Math.floor(i/2), 2)], reps: 10 },
            { weight: exTemplate.weights[Math.min(Math.floor(i/2), 2)], reps: 10 },
            { weight: exTemplate.weights[Math.min(Math.floor(i/2), 2)], reps: 8 }
          ]
        });
      }

      newLogs.push({
        id: `sim-${i}-${Date.now()}`,
        date: date.toISOString(),
        title: i % 2 === 0 ? '上肢力量' : '下肢爆发',
        duration: 45 + Math.floor(Math.random() * 15),
        calories: 300 + Math.floor(Math.random() * 200),
        notes: '模拟数据',
        exercises: dayExercises
      });
    }
    
    // Save simulated data to backend
    const reversedLogs = newLogs.reverse();
    for (const log of reversedLogs) {
        await backend.addWorkoutLog(log);
    }
    
    setLogs(reversedLogs); 
    setActiveView('dashboard');
    setIsAppLoading(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in pb-20">
            <Dashboard logs={logs} />
            
            {/* Recent Logs List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      近期记录
                  </h3>
                  <button onClick={simulateData} className="text-xs text-indigo-500 font-medium bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                      生成模拟数据
                  </button>
                </div>
                <div>
                  {logs.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-sm">暂无记录，点击下方 + 号开始记录</div>
                  )}
                  {logs.slice(0, 5).map((log, idx) => (
                    <div key={log.id} className={`flex items-center justify-between p-5 hover:bg-slate-50 transition-colors ${idx !== logs.length-1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                            <DumbbellIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base mb-0.5">{log.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{new Date(log.date).toLocaleDateString('zh-CN', {month:'short', day:'numeric'})} • {log.exercises.length} 个动作</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-base font-bold text-slate-700">{log.duration} <span className="text-xs font-normal text-slate-400">min</span></p>
                          <p className="text-xs text-slate-400 font-medium">{log.calories} kcal</p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        );
      case 'coach':
        return <AICoach profile={profile} logs={logs} />;
      case 'report':
        return <AnalysisReport logs={logs} profile={profile} />;
      case 'exercises':
        return <ExerciseDetail logs={logs} />;
      default:
        return null;
    }
  };

  if (isAppLoading) {
      return (
          <div className="min-h-screen bg-[#F2F5F8] flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-slate-500 font-medium animate-pulse">正在从云端同步数据...</p>
          </div>
      )
  }

  return (
    <div className="h-screen bg-[#F2F5F8] flex flex-col overflow-hidden font-sans text-slate-800">
      
      {/* Top Navigation Bar (Fixed) */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 shrink-0 z-30 h-14 px-4 sticky top-0">
          <div className="max-w-3xl mx-auto w-full h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-200 transition overflow-hidden"
                >
                  {profile.name ? profile.name.charAt(0) : <UserIcon className="w-4 h-4"/>}
                </button>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">FitGenius</h1>
            </div>
            <div className="flex items-center gap-3">
                {/* Cloud Sync Status */}
                <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                    {syncStatus === 'syncing' ? (
                        <>
                          <SyncIcon className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          <span className="text-indigo-500">同步中</span>
                        </>
                    ) : syncStatus === 'synced' ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">已同步</span>
                        </>
                    ) : (
                        <>
                          <CloudIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400">云端</span>
                        </>
                    )}
                </div>
            </div>
          </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto w-full">
             {/* Page Title */}
             <div className="mb-6 mt-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                {activeView === 'dashboard' ? '行动' : 
                activeView === 'report' ? '洞察' :
                activeView === 'exercises' ? '动作库' :
                'AI 私教'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                {activeView === 'dashboard' ? `${new Date().toLocaleDateString('zh-CN', {weekday: 'long', month: 'long', day: 'numeric'})}` : 
                activeView === 'report' ? "深度训练分析" :
                activeView === 'exercises' ? "动作与容量追踪" :
                "智能训练建议"}
                </p>
            </div>
            {renderContent()}
        </div>
      </main>

      {/* Bottom Tab Bar (Fixed) */}
      <div className="bg-white border-t border-slate-200 shrink-0 h-[88px] pb-[20px] z-40 relative w-full">
        <div className="max-w-3xl mx-auto w-full h-full flex justify-around items-center px-2">
           <div className="max-w-3xl mx-auto w-full h-full flex justify-around items-center px-2">
            <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <HomeIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">首页</span>
            </button>
            
            <button onClick={() => setActiveView('exercises')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'exercises' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <DumbbellIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">动作</span>
            </button>

            {/* Floating Add Button in Center */}
            <div className="relative -top-5">
              <button 
                  onClick={() => setIsLoggerOpen(true)}
                  className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
              >
                  <PlusIcon className="w-7 h-7" />
              </button>
            </div>

            <button onClick={() => setActiveView('report')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'report' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <AnalysisIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">洞察</span>
            </button>

            <button onClick={() => setActiveView('coach')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'coach' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <BrainIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">私教</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isLoggerOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
           <div className="w-full max-w-lg animate-slide-up">
            <WorkoutLogger 
              onAddLog={handleAddLog} 
              onClose={() => setIsLoggerOpen(false)}
              userWeight={profile.weight}
            />
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-800">个人资料</h2>
               <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><CloseIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">昵称</label>
                <input 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">年龄</label>
                  <input type="number" 
                    value={profile.age} 
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-medium" 
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">目标</label>
                   <select 
                     value={profile.goal}
                     onChange={e => setProfile({...profile, goal: e.target.value as GoalType})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-medium"
                   >
                     {Object.values(GoalType).map(g => (
                       <option key={g} value={g}>{g}</option>
                     ))}
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">体重 (kg)</label>
                  <input type="number" 
                    value={profile.weight} 
                    onChange={e => setProfile({...profile, weight: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-medium" 
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">水平</label>
                  <select 
                     value={profile.fitnessLevel}
                     onChange={e => setProfile({...profile, fitnessLevel: e.target.value as any})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-medium"
                   >
                     <option value="初学者">初学者</option>
                     <option value="中级">中级</option>
                     <option value="高级">高级</option>
                   </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
                >
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
