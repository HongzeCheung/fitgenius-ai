import React, { useState, useEffect, useRef } from 'react';
import { WorkoutLog, ExerciseLog, ExerciseSet } from '../types';
import { PlusIcon, CloseIcon, CalendarIcon } from './Icons';
import { Spinner } from './Spinner';

interface WorkoutLoggerProps {
  onAddLog: (log: WorkoutLog) => Promise<void>;
  onClose?: () => void;
  userWeight?: number;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onAddLog, onClose, userWeight = 75 }) => {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  
  // 动作录入状态
  const [exerciseType, setExerciseType] = useState<'strength' | 'cardio'>('strength');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('');
  const [exDuration, setExDuration] = useState('');
  
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isManualCalorieRef = useRef(false); // 记录用户是否手动修改过热量

  // 辅助函数：仅允许数字输入
  const handleNumericInput = (value: string, setter: (v: string) => void, allowFloat = false) => {
    const regex = allowFloat ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(value)) {
      setter(value);
    }
  };

  // 科学热量计算逻辑 (MET 算法)
  useEffect(() => {
    if (duration && !isManualCalorieRef.current) {
      const dur = parseInt(duration);
      if (!isNaN(dur) && dur > 0) {
        // 根据动作组成动态调整 MET 值
        // 力量训练平均 MET 约 4.5，有氧运动平均 MET 约 8.0
        let met = 5.0; // 默认基础值
        
        if (exercises.length > 0) {
          const cardioCount = exercises.filter(e => e.type === 'cardio').length;
          const strengthCount = exercises.filter(e => e.type === 'strength').length;
          
          if (cardioCount > 0 && strengthCount === 0) met = 8.5; // 纯有氧
          else if (strengthCount > 0 && cardioCount === 0) met = 4.5; // 纯力量
          else if (cardioCount > 0 && strengthCount > 0) met = 6.5; // 混氧训练
        } else {
          // 如果还没加动作，根据当前选择的 Tab 预估
          met = exerciseType === 'cardio' ? 8.0 : 4.5;
        }

        // 公式: 消耗 = MET * 体重(kg) * (时长/60)
        const estimatedCalories = Math.round(met * userWeight * (dur / 60));
        setCalories(estimatedCalories.toString());
      }
    }
  }, [duration, userWeight, exercises, exerciseType]);

  const addExercise = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!exerciseName) return;

    let newExercise: ExerciseLog;

    if (exerciseType === 'strength') {
      if (!reps || !setsCount) return;
      const numericWeight = weight === '' ? 0 : parseFloat(weight);
      const sets: ExerciseSet[] = Array(parseInt(setsCount)).fill(null).map(() => ({
        weight: numericWeight,
        reps: parseInt(reps)
      }));
      newExercise = { name: exerciseName, type: 'strength', sets };
    } else {
      if (!exDuration) return;
      const sets: ExerciseSet[] = [{
        weight: 0,
        reps: 0,
        duration: parseInt(exDuration)
      }];
      newExercise = { name: exerciseName, type: 'cardio', sets };
      
      // 智能累加总时长
      if (!duration) {
        setDuration(exDuration);
      } else {
        setDuration((parseInt(duration) + parseInt(exDuration)).toString());
      }
    }

    setExercises([...exercises, newExercise]);
    setExerciseName('');
    setWeight('');
    setReps('');
    setSetsCount('');
    setExDuration('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || isSubmitting) return;

    setIsSubmitting(true);
    try {
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
        if (onClose) onClose();
    } catch (error) {
        console.error("Save failed", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto overflow-hidden flex flex-col h-[90vh] shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
        <div className="flex items-center gap-2">
           <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 font-bold text-sm">记录</div>
           <h2 className="text-lg font-bold text-slate-800">训练详情</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">日期</label>
              <div className="relative group">
                <input 
                  type="date" 
                  value={dateStr} 
                  onChange={e => setDateStr(e.target.value)} 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 appearance-none h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">训练标题</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="如：今日练腿" className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 h-[48px]" required />
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
             <div className="flex p-1 bg-white rounded-xl border border-slate-200">
                <button 
                  onClick={(e) => { e.preventDefault(); setExerciseType('strength'); }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${exerciseType === 'strength' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                >
                  无氧 / 力量
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setExerciseType('cardio'); }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${exerciseType === 'cardio' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
                >
                  有氧 / 自重
                </button>
             </div>

             <input 
               placeholder={exerciseType === 'strength' ? "动作名称 (如: 杠铃卧推)" : "项目名称 (如: 跑步 / 椭圆机)"}
               value={exerciseName}
               onChange={e => setExerciseName(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500"
             />

             {exerciseType === 'strength' ? (
               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">重量(kg)</label>
                   <input 
                     placeholder="0=自重" 
                     type="text" 
                     inputMode="decimal"
                     value={weight} 
                     onChange={e=>handleNumericInput(e.target.value, setWeight, true)} 
                     className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">次数</label>
                   <input 
                     placeholder="次" 
                     type="text" 
                     inputMode="numeric"
                     value={reps} 
                     onChange={e=>handleNumericInput(e.target.value, setReps)} 
                     className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">组数</label>
                   <input 
                     placeholder="组" 
                     type="text" 
                     inputMode="numeric"
                     value={setsCount} 
                     onChange={e=>handleNumericInput(e.target.value, setSetsCount)} 
                     className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
                   />
                 </div>
               </div>
             ) : (
               <div>
                 <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">持续时长 (分钟)</label>
                 <input 
                    placeholder="请输入运动时长" 
                    type="text" 
                    inputMode="numeric"
                    value={exDuration} 
                    onChange={e=>handleNumericInput(e.target.value, setExDuration)} 
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none"
                 />
               </div>
             )}

             <button onClick={addExercise} className={`w-full py-4 rounded-2xl text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${exerciseType === 'strength' ? 'bg-slate-800 shadow-slate-200' : 'bg-emerald-600 shadow-emerald-100'}`}>
               <PlusIcon className="w-4 h-4" /> 添加该项
             </button>

             {exercises.length > 0 && (
               <div className="mt-4 space-y-2">
                 {exercises.map((ex, i) => (
                   <div key={i} className="text-xs text-slate-600 bg-white border border-slate-200 px-4 py-3 rounded-2xl flex justify-between shadow-sm items-center animate-fade-in">
                     <span className="font-bold flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${ex.type === 'strength' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                        {ex.name}
                     </span>
                     <span className="text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-lg text-[10px]">
                        {ex.type === 'strength' 
                          ? `${ex.sets.length}组 × ${ex.sets[0].reps}次 ${ex.sets[0].weight > 0 ? `@${ex.sets[0].weight}kg` : '(自重)'}`
                          : `${ex.sets[0].duration} 分钟`
                        }
                     </span>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">总时长 (min)</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={duration} 
                onChange={e => handleNumericInput(e.target.value, setDuration)} 
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 h-[48px]" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">消耗 (kcal)</label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={calories} 
                  onChange={e => {
                    isManualCalorieRef.current = true;
                    handleNumericInput(e.target.value, setCalories);
                  }} 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 h-[48px]" 
                />
                {!isManualCalorieRef.current && duration && (
                   <div className="absolute -bottom-5 left-1 flex items-center gap-1">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">AI 智能估算中</span>
                   </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pb-10 pt-2">
             <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-black py-5 px-4 rounded-3xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${
                  isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-indigo-100'
              }`}
            >
              {isSubmitting ? <Spinner /> : '确认并存入云端'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
