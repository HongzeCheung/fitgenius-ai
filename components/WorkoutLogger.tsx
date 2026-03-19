import React, { useState, useEffect, useRef } from 'react';
import { WorkoutLog, ExerciseLog, ExerciseSet } from '../types';
import { PlusIcon, CloseIcon, CheckCircleIcon } from './Icons';
import { Spinner } from './Spinner';

interface WorkoutLoggerProps {
  onAddLog: (log: WorkoutLog) => Promise<void>;
  onClose?: () => void;
  userWeight?: number;
}

const CARDIO_CATEGORIES = [
  { id: 'running', name: '跑步', icon: '🏃‍♂️', baseMET: 8.0 },
  { id: 'incline', name: '跑步机爬坡', icon: '⛰️', baseMET: 6.0 },
  { id: 'stairmaster', name: '楼梯机', icon: '🪜', baseMET: 9.0 },
  { id: 'rowing', name: '划船机', icon: '🚣', baseMET: 7.0 },
  { id: 'elliptical', name: '椭圆机', icon: '🎡', baseMET: 5.5 },
  { id: 'other', name: '其他有氧', icon: '⚡', baseMET: 5.0 }
];

// 基础生理常数
const REST_MET = 2.5; // 在健身房休息、准备、走动时的平均 MET
const STRENGTH_MET = 4.5; // 普通力量训练活跃时的平均 MET
const STRENGTH_SET_DURATION = 1.5; // 每组力量训练预估占用的活跃时间（分钟）

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onAddLog, onClose, userWeight = 75 }) => {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  
  const [exerciseType, setExerciseType] = useState<'strength' | 'cardio'>('strength');
  const [exerciseName, setExerciseName] = useState('');
  
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('');
  
  const [cardioCategory, setCardioCategory] = useState(CARDIO_CATEGORIES[0].id);
  const [cardioSpeed, setCardioSpeed] = useState('');
  const [cardioIncline, setCardioIncline] = useState('');
  const [cardioLevel, setCardioLevel] = useState('');
  const [cardioResistance, setCardioResistance] = useState('');
  const [exDuration, setExDuration] = useState('');
  
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isManualCalorieRef = useRef(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleNumericInput = (value: string, setter: (v: string) => void, allowFloat = false) => {
    const regex = allowFloat ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(value)) {
      setter(value);
    }
  };

  // 修复后的分段热量计算逻辑
  useEffect(() => {
    const totalDurationMin = parseInt(duration);
    if (!isNaN(totalDurationMin) && totalDurationMin > 0 && !isManualCalorieRef.current) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        let totalActiveCalories = 0;
        let totalActiveTime = 0;

        // 1. 计算所有已录入动作的活跃消耗
        exercises.forEach(ex => {
          if (ex.type === 'cardio') {
            const cat = CARDIO_CATEGORIES.find(c => c.id === ex.cardioCategory) || CARDIO_CATEGORIES[5];
            let met = cat.baseMET;
            const s = ex.sets[0];
            
            // 根据强度参数微调 MET
            if (ex.cardioCategory === 'running' && s.speed) met += (s.speed - 8) * 0.5;
            if (ex.cardioCategory === 'incline' && s.incline) met += s.incline * 0.4;
            if (ex.cardioCategory === 'stairmaster' && s.level) met += s.level * 0.3;
            
            const d = s.duration || 0;
            totalActiveCalories += met * userWeight * (d / 60);
            totalActiveTime += d;
          } else {
            // 力量训练：按组数估算活跃时间
            const setsCount = ex.sets.length;
            const activeTime = setsCount * STRENGTH_SET_DURATION;
            totalActiveCalories += STRENGTH_MET * userWeight * (activeTime / 60);
            totalActiveTime += activeTime;
          }
        });

        // 2. 计算剩余（休息/间歇）时间的消耗
        // 如果总时长大于已记录的动作时长，剩下的按 REST_MET 计算
        const restTime = Math.max(0, totalDurationMin - totalActiveTime);
        const restCalories = REST_MET * userWeight * (restTime / 60);

        const finalTotalCalories = Math.round(totalActiveCalories + restCalories);
        
        // 兜底逻辑：如果没有录入任何动作，整个时间段按基础训练强度 4.0 计算
        if (exercises.length === 0) {
            const defaultCalories = Math.round(4.0 * userWeight * (totalDurationMin / 60));
            setCalories(defaultCalories.toString());
        } else {
            setCalories(finalTotalCalories.toString());
        }
        
        setIsCalculating(false);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [duration, userWeight, exercises]);

  const addExercise = (e: React.MouseEvent) => {
    e.preventDefault();
    
    let newExercise: ExerciseLog;

    if (exerciseType === 'strength') {
      if (!exerciseName || !reps || !setsCount) return;
      const numericWeight = weight === '' ? 0 : parseFloat(weight);
      const sets: ExerciseSet[] = Array(parseInt(setsCount)).fill(null).map(() => ({
        weight: numericWeight,
        reps: parseInt(reps)
      }));
      newExercise = { name: exerciseName, type: 'strength', sets };
      
      // 力量训练自动增加预估总时长 (1.5min / 组)
      const currentDur = parseInt(duration) || 0;
      setDuration((currentDur + (parseInt(setsCount) * STRENGTH_SET_DURATION)).toString());
    } else {
      if (!exDuration) return;
      const cat = CARDIO_CATEGORIES.find(c => c.id === cardioCategory)!;
      const sets: ExerciseSet[] = [{
        weight: 0,
        reps: 0,
        duration: parseInt(exDuration),
        speed: cardioSpeed ? parseFloat(cardioSpeed) : undefined,
        incline: cardioIncline ? parseFloat(cardioIncline) : undefined,
        level: cardioLevel ? parseInt(cardioLevel) : undefined,
        resistance: cardioResistance ? parseInt(cardioResistance) : undefined,
      }];
      newExercise = { 
        name: exerciseName || cat.name, 
        type: 'cardio', 
        cardioCategory,
        sets 
      };
      
      const newTotalDur = (parseInt(duration) || 0) + parseInt(exDuration);
      setDuration(newTotalDur.toString());
    }

    setExercises([...exercises, newExercise]);
    setExerciseName('');
    setWeight(''); setReps(''); setSetsCount('');
    setExDuration(''); setCardioSpeed(''); setCardioIncline(''); setCardioLevel(''); setCardioResistance('');
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">日期</label>
              <input 
                type="date" 
                value={dateStr} 
                onChange={e => setDateStr(e.target.value)} 
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 h-[48px]"
              />
            </div>
            <div className="min-w-0">
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

             {exerciseType === 'cardio' ? (
               <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {CARDIO_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={(e) => { e.preventDefault(); setCardioCategory(cat.id); }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${cardioCategory === cat.id ? 'bg-white border-emerald-500 shadow-sm scale-105' : 'bg-slate-50 border-transparent text-slate-400 opacity-70'}`}
                      >
                        <span className="text-xl mb-1">{cat.icon}</span>
                        <span className="text-[9px] font-black">{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(cardioCategory === 'running' || cardioCategory === 'incline') && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">速度 (km/h)</label>
                        <input value={cardioSpeed} onChange={e=>handleNumericInput(e.target.value, setCardioSpeed, true)} placeholder="8.5" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                      </div>
                    )}
                    {cardioCategory === 'incline' && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">坡度 (%)</label>
                        <input value={cardioIncline} onChange={e=>handleNumericInput(e.target.value, setCardioIncline, true)} placeholder="3.0" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                      </div>
                    )}
                    {cardioCategory === 'stairmaster' && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">等级 (Level)</label>
                        <input value={cardioLevel} onChange={e=>handleNumericInput(e.target.value, setCardioLevel)} placeholder="8" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                      </div>
                    )}
                    {(cardioCategory === 'rowing' || cardioCategory === 'elliptical') && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">阻力 (Resistance)</label>
                        <input value={cardioResistance} onChange={e=>handleNumericInput(e.target.value, setCardioResistance)} placeholder="5" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                      </div>
                    )}
                    <div className={cardioCategory === 'incline' ? 'col-span-2' : ''}>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">持续时长 (min)</label>
                      <input value={exDuration} onChange={e=>handleNumericInput(e.target.value, setExDuration)} placeholder="分钟" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                    </div>
                  </div>
               </div>
             ) : (
               <>
                 <input 
                   placeholder="动作名称 (如: 杠铃卧推)"
                   value={exerciseName}
                   onChange={e => setExerciseName(e.target.value)}
                   className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500"
                 />
                 <div className="grid grid-cols-3 gap-3">
                   <div>
                     <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">重量(kg)</label>
                     <input placeholder="0=自重" type="text" inputMode="decimal" value={weight} onChange={e=>handleNumericInput(e.target.value, setWeight, true)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                   </div>
                   <div>
                     <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">次数</label>
                     <input placeholder="次" type="text" inputMode="numeric" value={reps} onChange={e=>handleNumericInput(e.target.value, setReps)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                   </div>
                   <div>
                     <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">组数</label>
                     <input placeholder="组" type="text" inputMode="numeric" value={setsCount} onChange={e=>handleNumericInput(e.target.value, setSetsCount)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none" />
                   </div>
                 </div>
               </>
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
                          : `${ex.sets[0].duration} min ${ex.sets[0].speed ? `| ${ex.sets[0].speed}km/h` : ''}${ex.sets[0].incline ? ` | 坡度${ex.sets[0].incline}%` : ''}`
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
              <input type="text" inputMode="numeric" value={duration} onChange={e => handleNumericInput(e.target.value, setDuration)} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 h-[48px]" required />
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
                   <div className="absolute -bottom-5 left-1 flex items-center gap-1.5 transition-all duration-300">
                      {isCalculating ? (
                        <>
                          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">AI 智能估算中...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">AI 已自动预估</span>
                        </>
                      )}
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
