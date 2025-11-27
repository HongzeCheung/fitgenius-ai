import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutLog, WorkoutPlan, AIAdvice } from '../types';
import { generateFitnessPlan, analyzeWorkoutHistory } from '../services/geminiService';
import { backend } from '../services/backend';
import { Spinner } from './Spinner';
import { BrainIcon, CalendarIcon, CheckCircleIcon } from './Icons';

interface AICoachProps {
  profile: UserProfile;
  logs: WorkoutLog[];
}

export const AICoach: React.FC<AICoachProps> = ({ profile, logs }) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'analysis'>('plan');
  
  // Plan State
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null); // From Backend
  const [draftPlan, setDraftPlan] = useState<WorkoutPlan | null>(null);     // From AI (Unsaved)
  
  // Analysis State
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved plan on mount
  useEffect(() => {
    const loadPlan = async () => {
      const saved = await backend.getActivePlan();
      if (saved) setCurrentPlan(saved);
    };
    loadPlan();
  }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    const result = await generateFitnessPlan(profile);
    setDraftPlan(result); // Set as draft first
    setLoading(false);
  };

  const handleConfirmPlan = async () => {
    if (!draftPlan) return;
    setSaving(true);
    try {
      await backend.saveActivePlan(draftPlan);
      setCurrentPlan(draftPlan);
      setDraftPlan(null); // Clear draft, now it is current
    } catch (e) {
      console.error("Failed to save plan", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftPlan(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeWorkoutHistory(logs, profile);
    setAdvice(result);
    setLoading(false);
  };

  // Helper to render a plan card
  const renderPlanDetails = (plan: WorkoutPlan, isDraft: boolean) => (
    <div className="animate-fade-in relative">
        {isDraft && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold">
                <span className="animate-pulse">●</span> 这是一个预览草稿，请点击底部按钮保存。
            </div>
        )}

        <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
            <div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">{plan.title}</h2>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wide">{plan.goal}</span>
            </div>
            {!isDraft && (
                <button 
                    onClick={() => {
                        if(window.confirm('确定要重新生成吗？当前计划将被覆盖。')) {
                            handleGeneratePlan();
                        }
                    }} 
                    className="text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium"
                >
                    重新生成
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plan.schedule.map((day, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                <div className="flex justify-between items-center mb-4">
                <span className="text-slate-800 font-bold text-lg">{day.day}</span>
                <span className="text-xs bg-white border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg font-medium">{day.duration} 分钟</span>
                </div>
                <div className="text-sm text-indigo-600 font-bold mb-3 uppercase tracking-wider">{day.focus}</div>
                <ul className="space-y-2 mb-4">
                {day.exercises.map((ex, i) => (
                    <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mt-1.5 flex-shrink-0"></span>
                    {ex}
                    </li>
                ))}
                </ul>
                {day.notes && (
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 italic">💡 {day.notes}</p>
                </div>
                )}
            </div>
            ))}
        </div>

        {isDraft && (
            <div className="sticky bottom-4 bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-2xl shadow-2xl flex gap-4 items-center justify-between">
                <div className="text-sm text-slate-500 font-medium pl-2 hidden sm:block">
                    满意这个计划吗？
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleDiscardDraft}
                        className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                    >
                        放弃
                    </button>
                    <button 
                        onClick={handleConfirmPlan}
                        disabled={saving}
                        className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                        {saving ? '保存中...' : '确认并保存计划'}
                    </button>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'plan' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          智能计划
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'analysis' 
              ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BrainIcon className="w-4 h-4" />
          AI 复盘
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Spinner />
            <p className="text-slate-400 font-medium animate-pulse">AI 正在思考中...</p>
          </div>
        ) : (
          <>
            {/* PLAN TAB */}
            {activeTab === 'plan' && (
              <div className="space-y-8">
                {draftPlan ? (
                    // Show Draft
                    renderPlanDetails(draftPlan, true)
                ) : currentPlan ? (
                    // Show Saved Plan
                    renderPlanDetails(currentPlan, false)
                ) : (
                   // Show Generate Prompt
                   <div className="text-center py-12 max-w-md mx-auto">
                     <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="w-8 h-8 text-indigo-500" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">定制您的专属计划</h3>
                     <p className="text-slate-500 mb-8 leading-relaxed">根据您的个人资料（{profile.goal} / {profile.fitnessLevel}），AI 将为您生成一份科学的周训练安排。</p>
                     <button 
                       onClick={handleGeneratePlan}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                     >
                       立即生成
                     </button>
                   </div>
                )}
              </div>
            )}

            {/* ANALYSIS TAB */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {!advice ? (
                  <div className="text-center py-12 max-w-md mx-auto">
                     {logs.length === 0 ? (
                       <div className="text-slate-400">
                          <p>请先记录一些训练日志以获取反馈！</p>
                       </div>
                     ) : (
                       <>
                         <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BrainIcon className="w-8 h-8 text-emerald-500" />
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-2">AI 智能复盘</h3>
                         <p className="text-slate-500 mb-8">分析您近期的训练表现，发现亮点与改进空间。</p>
                         <button 
                           onClick={handleAnalyze}
                           className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                         >
                           开始分析
                         </button>
                       </>
                     )}
                   </div>
                ) : (
                   <div className="animate-fade-in space-y-8">
                      <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-emerald-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">📊 表现总结</h3>
                        <p className="text-slate-600 leading-relaxed">{advice.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                          <h4 className="text-emerald-700 font-bold mb-4 flex items-center gap-2">
                             ✅ 优势
                          </h4>
                          <ul className="space-y-3">
                            {advice.strengths.map((item, i) => (
                              <li key={i} className="text-slate-700 text-sm flex items-start gap-2 bg-white p-2 rounded-lg shadow-sm">
                                <span className="text-emerald-500">✓</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                          <h4 className="text-orange-700 font-bold mb-4 flex items-center gap-2">
                             🚀 改进空间
                          </h4>
                          <ul className="space-y-3">
                            {advice.improvements.map((item, i) => (
                              <li key={i} className="text-slate-700 text-sm flex items-start gap-2 bg-white p-2 rounded-lg shadow-sm">
                                <span className="text-orange-500">↑</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <h4 className="font-bold text-lg mb-2 opacity-90">💡 教练建议 - 下一步</h4>
                        <p className="font-medium text-indigo-50">{advice.nextStep}</p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button onClick={handleAnalyze} className="text-sm text-slate-400 hover:text-slate-600 underline">刷新分析结果</button>
                      </div>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};