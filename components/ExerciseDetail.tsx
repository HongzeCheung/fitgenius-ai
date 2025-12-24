import React, { useState, useEffect } from 'react';
import { WorkoutLog, ExerciseInsight, ExerciseLog } from '../types';
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

  // 提取所有不重复的动作
  const allExercises = Array.from(new Set(
      (logs || []).flatMap(log => (log.exercises || []).map(e => e.name))
  ));
  
  useEffect(() => {
    if (allExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(allExercises[0]);
    }
  }, [logs]);

  useEffect(() => {
    if (!selectedExercise) return;
    const fetchInsight = async () => {
      setLoadingInsight(true);
      setError(false);
      setInsight(null);
      const data = await getExerciseInsight(selectedExercise);
      if (data) setInsight(data);
      else setError(true);
      setLoadingInsight(false);
    };
    fetchInsight();
  }, [selectedExercise]);

  if (allExercises.length === 0) {
     return <div className="text-center text-slate-400 py-20 font-bold">暂无详细动作数据</div>;
  }

  // 获取选中动作的历史数据，并判断其主导类型
  const selectedLogInstances = (logs || []).flatMap(log => 
    (log.exercises || []).filter(e => e.name === selectedExercise).map(e => ({ ...e, date: log.date }))
  );
  
  // 如果大部分记录是有氧模式，则按时长绘图
  const isMainlyCardio = selectedLogInstances.filter(e => e.type === 'cardio').length > selectedLogInstances.length / 2;

  const exerciseHistory = (logs || [])
    .filter(log => log.exercises && log.exercises.some(e => e.name === selectedExercise))
    .map(log => {
      const ex = log.exercises.find(e => e.name === selectedExercise)!;
      const sets = ex.sets || [];
      
      if (ex.type === 'cardio') {
        return {
          date: new Date(log.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          value: sets[0]?.duration || 0,
          label: '时长',
          unit: 'min'
        };
      } else {
        const maxWeight = sets.length > 0 ? Math.max(...sets.map(s => Number(s.weight) || 0)) : 0;
        return {
          date: new Date(log.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          value: maxWeight,
          label: '最大负重',
          unit: 'kg'
        };
      }
    })
    .reverse();

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${isMainlyCardio ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
           </div>
           <div className="truncate">
              <h2 className="text-lg font-bold text-slate-800 truncate">{selectedExercise}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isMainlyCardio ? '有氧/时长模式' : '无氧/负重模式'}</p>
           </div>
        </div>
        
        <select 
          value={selectedExercise} 
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-slate-50 border-none text-slate-700 font-bold text-xs rounded-xl px-3 py-2 outline-none w-32"
        >
          {allExercises.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
          进展趋势统计
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={exerciseHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                formatter={(val: any) => [`${val} ${exerciseHistory[0]?.unit}`, exerciseHistory[0]?.label]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isMainlyCardio ? '#10b981' : '#6366f1'} 
                strokeWidth={4} 
                dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4 text-sm">
             🔥 技术要点
          </h3>
          {loadingInsight ? <Spinner /> : (
            <ul className="space-y-3">
              {insight?.technicalPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-xs leading-relaxed font-medium">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                  {pt}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4 text-sm">
             🧬 生理学原理
          </h3>
          {loadingInsight ? <Spinner /> : (
            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              {insight?.physiologicalPrinciple}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
