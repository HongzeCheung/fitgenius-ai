
import React, { useState } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar } from 'recharts';
import { WorkoutLog, UserProfile } from '../types';
import { ActivityIcon } from './Icons';
import { Spinner } from './Spinner';

interface DashboardProps {
  logs: WorkoutLog[];
  profile: UserProfile;
  onWeightUpdate: (weight: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, profile, onWeightUpdate }) => {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState(profile.weight.toString());
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const totalWorkouts = safeLogs.length;
  const totalMinutes = safeLogs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0);

  const generateLast7DaysData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('zh-CN', { weekday: 'short' });
      const dayLogs = safeLogs.filter(log => new Date(log.date).toDateString() === dateStr);
      const dayCalories = dayLogs.reduce((acc, log) => acc + (Number(log.calories) || 0), 0);
      const dayMinutes = dayLogs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0);
      
      data.push({
        name: dayLabel,
        calories: dayCalories,
        minutes: dayMinutes,
        fullDate: d.toLocaleDateString('zh-CN')
      });
    }
    return data;
  };

  // 1. 先对历史数据进行严格排序
  const sortedWeightHistory = [...(profile.weightHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 2. 准备图表数据（最近10次）
  const weightHistoryData = sortedWeightHistory
    .map(h => ({
      date: new Date(h.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      weight: h.weight,
      fullDate: new Date(h.date).toLocaleDateString('zh-CN')
    }))
    .slice(-10);

  const calorieGoal = 500;
  const durationGoal = 60;
  const chartData = generateLast7DaysData();
  const todayStats = chartData[chartData.length - 1];
  
  const ringsData = [
    { name: '卡路里', value: Math.min((todayStats.calories / calorieGoal) * 100, 100), fill: '#f97316' },
    { name: '时长', value: Math.min((todayStats.minutes / durationGoal) * 100, 100), fill: '#10b981' }
  ];

  // 3. 核心修复：计算总计变化
  const baselineWeight = sortedWeightHistory.length > 0 ? sortedWeightHistory[0].weight : profile.weight;
  const currentWeight = profile.weight;
  const rawChange = currentWeight - baselineWeight;
  const weightChange = rawChange.toFixed(1);
  
  const changeColor = rawChange <= 0 ? 'text-emerald-500' : 'text-rose-500';

  const handleWeightInputChange = (val: string) => {
    const filtered = val.replace(/[^\d.]/g, '');
    const parts = filtered.split('.');
    const finalVal = parts.length > 2 ? `${parts[0]}.${parts[1]}` : filtered;
    setNewWeight(finalVal);
  };

  const handleSaveWeight = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) return;
    setIsSavingWeight(true);
    try {
      await onWeightUpdate(w);
      setIsWeightModalOpen(false);
    } catch (e) {
      console.error("Update weight failed", e);
    } finally {
      setIsSavingWeight(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Weight Summary Widget */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden group">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-full text-indigo-500">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                </div>
                <span className="font-bold text-slate-700">体重追踪</span>
            </div>
            <button 
              onClick={() => {
                setNewWeight(profile.weight.toString());
                setIsWeightModalOpen(true);
              }}
              className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
               记录体重
            </button>
         </div>
         
         <div className="flex items-end gap-4">
            <div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">当前体重</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-800">{currentWeight}</span>
                  <span className="text-sm font-bold text-slate-400">kg</span>
               </div>
            </div>
            <div className="pb-1">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">总计变化</p>
               <div className={`text-sm font-black ${changeColor}`}>
                  {rawChange > 0 ? '+' : ''}{weightChange} kg
               </div>
            </div>
         </div>

         {weightHistoryData.length > 1 && (
           <div className="h-24 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistoryData}>
                  {/* 隐藏 X 轴和 Y 轴，但通过 domain 锁定数据区间 */}
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    formatter={(value: number) => [`${value}kg`, '体重']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} 
                    activeDot={{ r: 5, strokeWidth: 0 }} 
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
           <div className="flex items-center justify-between z-10">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-full text-rose-500">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                   </svg>
                </div>
                <span className="font-bold text-slate-700">今日健身</span>
             </div>
             <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{new Date().getDate()}日</span>
           </div>

           <div className="flex flex-row items-center mt-4 gap-2 sm:gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={10} data={ringsData} startAngle={90} endAngle={-270}>
                    <RadialBar
                      background={{ fill: '#f1f5f9' }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <ActivityIcon className="w-6 h-6 text-slate-300" />
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 flex-1 min-w-0">
                 <div>
                    <p className="text-xs text-slate-400 mb-0.5">活动消耗</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-lg sm:text-xl font-bold text-orange-500">{todayStats.calories}</span>
                       <span className="text-[10px] sm:text-xs text-slate-400">/ {calorieGoal}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                       <div className="h-1.5 rounded-full bg-orange-500" style={{width: `${Math.min((todayStats.calories/calorieGoal)*100, 100)}%`}}></div>
                    </div>
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 mb-0.5">锻炼时长</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-lg sm:text-xl font-bold text-emerald-500">{todayStats.minutes}</span>
                       <span className="text-[10px] sm:text-xs text-slate-400">/ {durationGoal} min</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                       <div className="h-1.5 rounded-full bg-emerald-500" style={{width: `${Math.min((todayStats.minutes/durationGoal)*100, 100)}%`}}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
           <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-start group hover:shadow-md transition-all">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                 <ActivityIcon className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">累计训练</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{totalWorkouts} <span className="text-xs sm:text-base font-normal text-slate-400">次</span></p>
           </div>
           <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-start group hover:shadow-md transition-all">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">总投入时长</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{totalMinutes} <span className="text-xs sm:text-base font-normal text-slate-400">分钟</span></p>
           </div>
        </div>
      </div>

      {/* Weight Input Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl animate-scale-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">记录当前体重</h3>
              <div className="relative mb-6">
                 <input 
                   type="text" 
                   inputMode="decimal"
                   value={newWeight}
                   onChange={e => handleWeightInputChange(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl p-4 text-2xl font-black text-center text-indigo-600 outline-none focus:border-indigo-500 transition-all"
                   autoFocus
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 pointer-events-none">kg</span>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIsWeightModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl active:scale-95 transition-all">取消</button>
                 <button 
                  onClick={handleSaveWeight} 
                  disabled={isSavingWeight}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center"
                 >
                    {isSavingWeight ? <Spinner /> : '保存'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
