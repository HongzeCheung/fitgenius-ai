import React, { useMemo } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { WorkoutLog, UserProfile } from '../types';
import { ActivityIcon } from './Icons';

interface DashboardProps {
  logs: WorkoutLog[];
  profile: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
  const totalWorkouts = safeLogs.length;
  const totalMinutes = useMemo(
    () => safeLogs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0),
    [safeLogs]
  );

  const calorieGoal = 500;
  const durationGoal = 60;
  const chartData = useMemo(() => {
    const groupedByDay = safeLogs.reduce<Record<string, { calories: number; minutes: number }>>((acc, log) => {
      const dayKey = new Date(log.date).toDateString();
      const dayEntry = acc[dayKey] || { calories: 0, minutes: 0 };
      dayEntry.calories += Number(log.calories) || 0;
      dayEntry.minutes += Number(log.duration) || 0;
      acc[dayKey] = dayEntry;
      return acc;
    }, {});

    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - index));
      const dayKey = d.toDateString();
      const dayData = groupedByDay[dayKey] || { calories: 0, minutes: 0 };

      return {
        name: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
        calories: dayData.calories,
        minutes: dayData.minutes,
        fullDate: d.toLocaleDateString('zh-CN')
      };
    });
  }, [safeLogs]);
  const todayStats = chartData[chartData.length - 1] || { calories: 0, minutes: 0 };
  
  const ringsData = [
    { name: '卡路里', value: Math.min((todayStats.calories / calorieGoal) * 100, 100), fill: '#f97316' },
    { name: '时长', value: Math.min((todayStats.minutes / durationGoal) * 100, 100), fill: '#10b981' }
  ];

  return (
    <div className="space-y-4 sm:space-y-8">

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

    </div>
  );
};
