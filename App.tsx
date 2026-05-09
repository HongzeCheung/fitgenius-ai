import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Auth } from './components/Auth';
import { WorkoutLog, UserProfile, GoalType } from './types';
import { HomeIcon, DumbbellIcon, BrainIcon, UserIcon, PlusIcon, CloseIcon, CloudIcon, SyncIcon, CheckCircleIcon, AnalysisIcon, LogOutIcon, GithubIcon } from './components/Icons';
import { backend } from './services/backend';
import { Spinner } from './components/Spinner';
import { initMonitoring, setUser, clearUser, trackUserAction } from './services/monitoring';
import { initWebVitals } from './services/webVitals';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const WorkoutLogger = lazy(() => import('./components/WorkoutLogger').then(module => ({ default: module.WorkoutLogger })));
const AICoach = lazy(() => import('./components/AICoach').then(module => ({ default: module.AICoach })));
const AnalysisReport = lazy(() => import('./components/AnalysisReport').then(module => ({ default: module.AnalysisReport })));
const ExerciseDetail = lazy(() => import('./components/ExerciseDetail').then(module => ({ default: module.ExerciseDetail })));

const InlineLoader: React.FC<{ label: string; compact?: boolean }> = ({ label, compact = false }) => (
  <div className={`flex flex-col items-center justify-center space-y-4 ${compact ? 'py-12' : 'min-h-[320px]'}`}>
    <Spinner />
    <p className="text-slate-500 font-medium animate-pulse text-sm">{label}</p>
  </div>
);

const matrixGlyphPool = '01アイウエオカキクケコサシスセソZXCVBNM#%';

const matrixColumns = Array.from({ length: 16 }, (_, index) => ({
  left: `${index * 6.2 + 1}%`,
  delay: `${index * -0.07}s`,
  duration: `${0.9 + (index % 5) * 0.16}s`,
  content: Array.from({ length: 18 }, (_, glyphIndex) =>
    matrixGlyphPool[(index * 5 + glyphIndex * 3) % matrixGlyphPool.length]
  ).join(''),
}));

const App: React.FC = () => {
  const hasStoredToken = backend.hasToken();

  // 初始化监控 (仅执行一次)
  useEffect(() => {
    initMonitoring();
    initWebVitals();
  }, []);

  // State
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredToken);
  const [activeView, setActiveView] = useState<'dashboard' | 'coach' | 'report' | 'exercises'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '运动家',
    age: 28,
    weight: 75,
    height: 180,
    goal: GoalType.MUSCLE_GAIN,
    fitnessLevel: '中级',
    weightHistory: []
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(hasStoredToken);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isHydratingSession, setIsHydratingSession] = useState(false);
  const [isEntryTransitionActive, setIsEntryTransitionActive] = useState(false);
  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]
  );

  const hydrateSessionData = async (surfaceSyncState = true) => {
    if (!backend.hasToken()) {
      setIsAuthenticated(false);
      setIsHydratingSession(false);
      return;
    }

    setIsHydratingSession(true);
    if (surfaceSyncState) {
      setSyncStatus('syncing');
    }

    try {
      const [logsResult, profileResult] = await Promise.allSettled([
        backend.getWorkoutLogs(),
        backend.getUserProfile(),
      ]);

      if (logsResult.status === 'fulfilled' && logsResult.value) {
        setLogs(logsResult.value);
      }
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setProfile(profileResult.value);
      }

      if (surfaceSyncState) {
        setSyncStatus('synced');
        window.setTimeout(() => {
          setSyncStatus(current => (current === 'synced' ? 'idle' : current));
        }, 1500);
      }
    } catch (e) {
      console.error('Initialization failed', e);
      if (surfaceSyncState) {
        setSyncStatus('error');
      }
    } finally {
      setIsHydratingSession(false);
    }
  };

  useEffect(() => {
    if (!backend.hasToken()) {
      setIsAppLoading(false);
      return;
    }

    const loadExistingSession = async () => {
      setIsAppLoading(true);
      setIsAuthenticated(true);
      try {
        await hydrateSessionData(false);
      } finally {
        setIsAppLoading(false);
      }
    };

    void loadExistingSession();
  }, []);

  useEffect(() => {
    if (!isEntryTransitionActive) return;

    const timeoutId = window.setTimeout(() => {
      setIsEntryTransitionActive(false);
    }, 1450);

    return () => window.clearTimeout(timeoutId);
  }, [isEntryTransitionActive]);

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    setActiveView('dashboard');
    setIsEntryTransitionActive(true);
    
    // 设置用户上下文用于监控
    const token = backend.hasToken();
    if (token) {
      setUser('user_' + Date.now(), profile.name);
    }
    
    // 追踪登录事件
    trackUserAction('user_login', { timestamp: new Date().toISOString() });
    
    void hydrateSessionData();
  };

  const handleLogout = () => {
    // 追踪登出事件
    trackUserAction('user_logout');
    
    // 清除监控用户上下文
    clearUser();
    
    backend.logout();
    setIsAuthenticated(false);
    setLogs([]);
    setActiveView('dashboard');
  };

  const handleAddLog = async (newLog: WorkoutLog) => {
    setSyncStatus('syncing');
    
    // 追踪训练记录添加
    trackUserAction('workout_log_added', {
      duration: newLog.duration,
      calories: newLog.calories,
      exerciseCount: newLog.exercises.length,
    });
    
    try {
        await backend.addWorkoutLog(newLog);
        
        setLogs(prevLogs => {
            const newLogDate = new Date(newLog.date).toDateString();
            const existingIndex = prevLogs.findIndex(l => new Date(l.date).toDateString() === newLogDate);

            if (existingIndex >= 0) {
                const updatedLogs = [...prevLogs];
                const existing = updatedLogs[existingIndex];
                if (existing) {
                    updatedLogs[existingIndex] = {
                        ...existing,
                        duration: (existing.duration || 0) + newLog.duration,
                        calories: (existing.calories || 0) + newLog.calories,
                        exercises: [...(existing.exercises || []), ...newLog.exercises],
                        notes: existing.notes + (newLog.notes ? ` | ${newLog.notes}` : '')
                    };
                }
                return updatedLogs;
            } else {
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

  // 数字校验辅助函数
  const handleNumericInput = (val: string, key: keyof UserProfile) => {
    const numeric = val.replace(/[^\d]/g, '');
    if (numeric || val === '') {
       setProfile({...profile, [key]: numeric === '' ? 0 : parseInt(numeric)});
    }
  };

  if (isAppLoading) {
      return (
          <div className="min-h-screen bg-[#F2F5F8] flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-slate-500 font-medium animate-pulse text-sm">正在载入健身时空...</p>
          </div>
      )
  }

  if (!isAuthenticated) {
      return <Auth onSuccess={handleAuthSuccess} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in pb-20">
            <Dashboard logs={sortedLogs} profile={profile} />
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      近期记录
                  </h3>
                </div>
                <div>
                  {isHydratingSession && sortedLogs.length === 0 && (
                      <div className="space-y-3 p-5">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-16 rounded-2xl border border-slate-100 bg-slate-50/80 animate-pulse"
                          />
                        ))}
                      </div>
                  )}
                  {!isHydratingSession && sortedLogs.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-sm">暂无记录，点击下方 + 号开始记录</div>
                  )}
                  {sortedLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id} className={`flex items-center justify-between p-5 hover:bg-slate-50 transition-colors ${idx !== Math.min(sortedLogs.length, 10) - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                            <DumbbellIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base mb-0.5">{log.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{new Date(log.date).toLocaleDateString('zh-CN', {month:'short', day:'numeric'})} • {log.exercises?.length || 0} 个动作</p>
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

  return (
    <div className={`app-runtime-shell h-screen bg-[#F2F5F8] flex flex-col overflow-hidden font-sans text-slate-800 ${isEntryTransitionActive ? 'app-runtime-shell-entry' : ''}`}>
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 shrink-0 z-30 h-14 px-4 sticky top-0">
          <div className="max-w-md mx-auto w-full h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-200 transition overflow-hidden"
                >
                  {profile.name ? profile.name.charAt(0) : <UserIcon className="w-4 h-4"/>}
                </button>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight text-indigo-600">FitGenius</h1>
            </div>
            <div className="flex items-center gap-3">
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
                <a 
                  href="https://github.com/HongzeCheung/fitgenius-ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all active:scale-90"
                >
                  <GithubIcon className="w-5 h-5" />
                </a>
            </div>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 custom-scrollbar relative">
        <div className="max-w-md mx-auto w-full">
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
            <Suspense fallback={<InlineLoader label="正在载入模块..." />}>
              {renderContent()}
            </Suspense>
        </div>
      </main>

      <div className="bg-white border-t border-slate-200 shrink-0 h-[88px] pb-[20px] z-40 relative w-full">
        <div className="max-w-md mx-auto w-full h-full flex justify-around items-center px-2">
            <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <HomeIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">首页</span>
            </button>
            <button onClick={() => setActiveView('exercises')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeView === 'exercises' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <DumbbellIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">动作</span>
            </button>
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

      {isLoggerOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
           <div className="w-full max-w-md animate-slide-up">
            <Suspense fallback={<div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto overflow-hidden flex items-center justify-center h-[40vh] shadow-2xl"><InlineLoader label="正在载入记录器..." compact /></div>}>
              <WorkoutLogger 
                onAddLog={handleAddLog} 
                onClose={() => setIsLoggerOpen(false)}
                userWeight={profile.weight}
              />
            </Suspense>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-800">个人资料</h2>
               <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><CloseIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">昵称</label>
                <input 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-800 outline-none font-bold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">年龄</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={profile.age || ''} 
                    onChange={e=>handleNumericInput(e.target.value, 'age')} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">体重 (kg)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={profile.weight || ''} 
                    onChange={e=>handleNumericInput(e.target.value, 'weight')} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none font-bold" 
                  />
                </div>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">健身目标</label>
                 <select value={profile.goal} onChange={e=>setProfile({...profile, goal:e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none font-bold">
                   {Object.values(GoalType).map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
              </div>
              
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">保存设置</button>
              
              <div className="pt-4 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <LogOutIcon className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEntryTransitionActive && (
        <div className="matrix-entry-overlay">
          <div className="matrix-entry-wash" />
          <div className="matrix-entry-core" />
          <div className="matrix-entry-scanline" />
          <div className="matrix-entry-grid" />
          <div className="matrix-entry-glyphs">
            {matrixColumns.map(column => (
              <span
                key={`${column.left}-${column.delay}`}
                className="matrix-entry-column"
                style={{
                  left: column.left,
                  animationDelay: column.delay,
                  animationDuration: column.duration,
                }}
              >
                {column.content}
              </span>
            ))}
          </div>
          <div className="matrix-entry-copy">
            <span>ACCESS GRANTED</span>
            <span className="matrix-entry-copy-sub">Routing consciousness to FitGenius...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
