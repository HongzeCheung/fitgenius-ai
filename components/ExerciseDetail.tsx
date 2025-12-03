import React, { useState, useEffect } from 'react';
import { WorkoutLog, ExerciseInsight } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getExerciseInsight } from '../services/geminiService';
import { Spinner } from './Spinner';

interface ExerciseDetailProps {
  logs: WorkoutLog[];
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ logs }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [insight, setInsight] = useState<ExerciseInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [error, setError] = useState(false);

  // Extract all unique exercises safely
  const allExercises = Array.from(new Set(
      (logs || []).flatMap(log => (log.exercises || []).map(e => e.name))
  ));
  
  // Initial selection
  useEffect(() => {
    if (allExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(allExercises[0]);
    }
  }, [logs]);

  // Fetch Insight when exercise changes
  useEffect(() => {
    if (!selectedExercise) return;
    const fetchInsight = async () => {
      setLoadingInsight(true);
      setError(false);
      setInsight(null);
      
      const data = await getExerciseInsight(selectedExercise);
      
      if (data) {
        setInsight(data);
      } else {
        setError(true);
      }
      setLoadingInsight(false);
    };
    fetchInsight();
  }, [selectedExercise]);

  if (allExercises.length === 0) {
     return (
       <div className="text-center text-slate-400 py-20">
         暂无详细动作数据。请先记录含有动作的训练日志。
       </div>
     );
  }

  // Prepare chart data
  const exerciseHistory = (logs || [])
    .filter(log => log.exercises && log.exercises.some(e => e.name === selectedExercise))
    .map(log => {
      const exerciseLog = log.exercises.find(e => e.name === selectedExercise);
      
      // Protect against empty sets or undefined logs to prevent -Infinity
      const maxWeight = exerciseLog && exerciseLog.sets && exerciseLog.sets.length > 0 
        ? Math.max(...exerciseLog.sets.map(s => Number(s.weight) || 0)) 
        : 0;
        
      const totalVolume = exerciseLog && exerciseLog.sets
        ? exerciseLog.sets.reduce((acc, s) => acc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0) 
        : 0;
        
      const totalReps = exerciseLog && exerciseLog.sets
        ? exerciseLog.sets.reduce((acc, s) => acc + (Number(s.reps) || 0), 0) 
        : 0;
        
      const totalSets = exerciseLog && exerciseLog.sets ? exerciseLog.sets.length : 0;

      return {
        date: new Date(log.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        fullDate: new Date(log.date).toLocaleDateString('zh-CN'),
        weight: maxWeight,
        volume: totalVolume,
        reps: totalReps,
        sets: totalSets
      };
    })
    .reverse(); // Oldest first for charts

  const currentStats = exerciseHistory[exerciseHistory.length - 1] || { weight: 0, volume: 0, reps: 0, sets: 0 };

  const renderInsightContent = () => {
    if (loadingInsight) {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <Spinner />
          <p className="text-slate-400 text-xs mt-3">AI 正在分析生物力学...</p>
        </div>
      );
    }
    
    if (error || !insight) {
      return (
         <div className="py-6 text-center">
            <p className="text-slate-400 text-sm mb-2">无法获取分析结果</p>
            <p className="text-xs text-slate-300">请检查网络或稍后重试</p>
         </div>
      );
    }

    return (
       <ul className="space-y-4">
         {insight.technicalPoints.map((pt, i) => (
           <li key={i} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
             <span className="mt-1.5 w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 shadow-sm"></span>
             {pt}
           </li>
         ))}
       </ul>
    );
  };

  const renderPhysiologyContent = () => {
    if (loadingInsight) {
      return (
        <div className="flex flex-col items-center justify-center py-6 relative z-10">
          <Spinner />
        </div>
      );
    }

    if (error || !insight) {
       return (
         <div className="py-6 text-center relative z-10">
            <p className="text-slate-400 text-sm">无法获取数据</p>
         </div>
       );
    }

    return (
      <div className="relative z-10">
        <p className="text-slate-600 text-sm leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100">
          {insight.physiologicalPrinciple}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedExercise}</h2>
              <p className="text-sm text-slate-500">{exerciseHistory.length} 次历史记录</p>
           </div>
        </div>
        
        <select 
          value={selectedExercise} 
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 shadow-sm hover:bg-slate-50 transition-colors max-w-[150px]"
        >
          {allExercises.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {/* Main Charts Card - Forced Single Column */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col justify-between items-start mb-8 gap-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">动作进展追踪</h3>
             <div className="flex flex-wrap gap-2">
               {insight?.targetMuscles.map(m => (
                 <span key={m} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200">{m}</span>
               ))}
             </div>
           </div>
           <div className="flex gap-3 text-xs font-medium bg-slate-50 p-2 rounded-lg">
               <div className="flex items-center gap-1.5 px-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 最大重量</div>
               <div className="flex items-center gap-1.5 px-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> 训练容量</div>
           </div>
        </div>

        {/* Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={exerciseHistory} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickMargin={10} 
                axisLine={false} 
                tickLine={false} 
              />
              {/* Left Axis: Weight */}
              <YAxis 
                yAxisId="left" 
                stroke="#10b981" 
                fontSize={11} 
                axisLine={false} 
                tickLine={false} 
                width={35}
                domain={['auto', 'auto']} // Auto scale to show progression clearly
              />
              {/* Right Axis: Volume */}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#a855f7" 
                fontSize={11} 
                axisLine={false} 
                tickLine={false} 
                width={35}
              />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#1e293b' }}
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '12px' }}
              />
              
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="weight" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{r:4, fill:'#fff', stroke:'#10b981', strokeWidth:2}} 
                name="最大重量 (kg)" 
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="volume" 
                stroke="#a855f7" 
                strokeDasharray="5 5" 
                strokeWidth={2} 
                dot={false} 
                name="训练容量 (kg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-8">
           {[
             { label: '最大重量', val: currentStats.weight, unit: 'kg', color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: '每组次数', val: currentStats.reps, unit: '次', color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: '总组数', val: currentStats.sets, unit: '组', color: 'text-orange-600', bg: 'bg-orange-50' },
             { label: '总容量', val: currentStats.volume, unit: 'kg', color: 'text-purple-600', bg: 'bg-purple-50' },
           ].map((stat, i) => (
             <div key={i} className={`${stat.bg} p-3 sm:p-4 rounded-2xl text-center border border-transparent hover:border-black/5 transition-colors`}>
                <div className={`${stat.color} font-extrabold text-lg sm:text-2xl mb-1 truncate`}>{stat.val}<span className="text-xs sm:text-sm font-medium opacity-70 ml-1">{stat.unit}</span></div>
                <div className="text-slate-500 text-[10px] sm:text-xs font-medium truncate">{stat.label}</div>
             </div>
           ))}
        </div>
      </div>

      {/* AI Insights Section - Forced Single Column */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-6 text-lg">
             <span className="p-1.5 bg-yellow-100 rounded-lg text-yellow-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </span>
             技术要点
          </h3>
          {renderInsightContent()}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl z-0"></div>
          <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-6 text-lg relative z-10">
             <span className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             </span>
             生理学原理
          </h3>
          {renderPhysiologyContent()}
        </div>
      </div>
    </div>
  );
};