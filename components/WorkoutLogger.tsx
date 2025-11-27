import React, { useState, useEffect } from 'react';
import { WorkoutLog, ExerciseLog } from '../types';
import { PlusIcon, CloseIcon, CalendarIcon } from './Icons';
import { Spinner } from './Spinner';

interface WorkoutLoggerProps {
  onAddLog: (log: WorkoutLog) => Promise<void>;
  onClose?: () => void;
  userWeight?: number; // 用户体重用于计算热量
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onAddLog, onClose, userWeight = 75 }) => {
  // Initialize date to local YYYY-MM-DD
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 自动计算热量
  useEffect(() => {
    if (duration) {
      const dur = parseInt(duration);
      if (!isNaN(dur) && dur > 0) {
        // 估算公式：METs * 体重(kg) * 时间(h)
        // 力量训练平均 METs 约为 5.0
        const estimatedCalories = Math.round(5.0 * userWeight * (dur / 60));
        setCalories(estimatedCalories.toString());
      }
    }
  }, [duration, userWeight]);

  const addExercise = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!exerciseName || !weight || !reps || !setsCount) return;
    
    const sets = Array(parseInt(setsCount)).fill({
      weight: parseInt(weight),
      reps: parseInt(reps)
    });

    setExercises([...exercises, { name: exerciseName, sets }]);
    setExerciseName('');
    setWeight('');
    setReps('');
    setSetsCount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || isSubmitting) return;

    setIsSubmitting(true);

    try {
        // Construct Date object from input
        const [y, m, d] = dateStr.split('-').map(Number);
        const now = new Date();
        const finalDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

        const newLog: WorkoutLog = {
          id: Date.now().toString(),
          date: finalDate.toISOString(),
          title,
          duration: parseInt(duration),
          calories: parseInt(calories) || 0,
          notes,
          exercises: exercises
        };

        await onAddLog(newLog);
        
        // Reset form
        setTitle('');
        setDuration('');
        setCalories('');
        setNotes('');
        setExercises([]);
        
        if (onClose) onClose();
    } catch (error) {
        console.error("Failed to save log", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto overflow-hidden flex flex-col h-[85vh] shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
        <div className="flex items-center gap-2">
           <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
             <PlusIcon className="w-5 h-5" />
           </div>
           <h2 className="text-lg font-bold text-slate-800">记录新训练</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> 日期
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">训练标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：周一胸肌训练"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium"
              required
              autoFocus
            />
          </div>
          
          {/* Mini Exercise Builder */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">动作组记录</label>
             <div className="space-y-3">
               <input 
                 placeholder="动作名称 (如: 杠铃卧推)"
                 value={exerciseName}
                 onChange={e => setExerciseName(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none"
               />
               <div className="grid grid-cols-3 gap-3">
                 <input placeholder="重量 (kg)" type="number" value={weight} onChange={e=>setWeight(e.target.value)} className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none"/>
                 <input placeholder="次数" type="number" value={reps} onChange={e=>setReps(e.target.value)} className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none"/>
                 <input placeholder="组数" type="number" value={setsCount} onChange={e=>setSetsCount(e.target.value)} className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none"/>
               </div>
               <button onClick={addExercise} className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-3 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm">
                 <PlusIcon className="w-4 h-4" /> 添加动作
               </button>
             </div>
             {exercises.length > 0 && (
               <div className="mt-4 space-y-2">
                 {exercises.map((ex, i) => (
                   <div key={i} className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2.5 rounded-xl flex justify-between shadow-sm">
                     <span className="font-bold">{ex.name}</span>
                     <span className="text-slate-400 font-medium">{ex.sets.length} 组 x {ex.sets[0].reps}次 @ {ex.sets[0].weight}kg</span>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">时长 (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">热量 (kcal)</label>
              <div className="relative">
                <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="自动计算"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="absolute right-3 top-3.5 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                   估算值
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 pb-6">
             <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-4 px-4 rounded-2xl shadow-lg transition-all transform text-base flex items-center justify-center gap-2 ${
                  isSubmitting 
                  ? 'bg-indigo-400 cursor-not-allowed text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-500/30'
              }`}
            >
              {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    保存中...
                  </>
              ) : (
                  '保存记录'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};