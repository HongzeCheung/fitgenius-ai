
import React, { useEffect, useState, useRef } from 'react';
import { TrainingReport, WorkoutLog, UserProfile } from '../types';
import { generateTrainingReport, Cache } from '../services/geminiService';
import { Spinner } from './Spinner';

interface AnalysisReportProps {
  logs: WorkoutLog[];
  profile: UserProfile;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ logs, profile }) => {
  const [report, setReport] = useState<TrainingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // 用于锁定正在进行的请求，防止并发
  const isFetchingRef = useRef(false);
  // 用于记录上一次成功抓取的 Key，防止重复请求
  const lastFetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (logs.length === 0) return;
      
      // 生成当前状态的唯一 Key
      const currentKey = Cache.stableKey('report', { 
        logCount: logs.length, 
        lastDate: logs[0]?.date || '', 
        age: profile.age, 
        goal: profile.goal 
      });

      // 1. 如果已经有这个 Key 的报告了，直接停止（可能是切换 Tab 回来的）
      if (lastFetchedKeyRef.current === currentKey && report) {
        return;
      }

      // 2. 尝试从缓存获取（同步检查，避免 Loading 闪烁）
      const cached = Cache.get(currentKey);
      if (cached) {
        setReport(cached);
        lastFetchedKeyRef.current = currentKey;
        setErrorMsg(null);
        return;
      }

      // 3. 如果正在请求中，或者已经请求过这个 Key 了，跳过
      if (isFetchingRef.current) return;

      // 锁定请求
      isFetchingRef.current = true;
      setLoading(true);
      setErrorMsg(null);

      try {
        const result = await generateTrainingReport(logs, profile);
        if (result) {
          setReport(result);
          lastFetchedKeyRef.current = currentKey;
        } else {
          setErrorMsg("报告生成失败，请稍后重试（可能由于 API 访问限制）。");
        }
      } catch (e: any) {
        console.error("Report generation failed", e);
        if (e?.message?.includes('429')) {
          setErrorMsg("请求过于频繁（API 额度暂用完），请 1 分钟后再试。");
        } else {
          setErrorMsg("深度分析服务暂时不可用，请稍后再试。");
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchReport();
  }, [logs.length, profile.age, profile.goal]); // 减少不必要的依赖，只关注核心变化

  if (logs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
        <h3 className="text-slate-800 font-bold text-lg mb-2">暂无训练数据</h3>
        <p className="text-slate-500">请先记录一些训练日志，或者使用模拟数据来生成报告。</p>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Spinner />
        <p className="text-slate-500 font-medium mt-6 animate-pulse text-center">正在从云端调取深度分析报告...<br/><span className="text-[10px] opacity-60 font-normal">首次请求可能需要 5-10 秒</span></p>
      </div>
    );
  }

  if (errorMsg && !report) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
        <div className="text-amber-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-slate-800 font-bold mb-2">服务暂时不可用</h3>
        <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
        >
          重试一下
        </button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">深度训练分析报告</h2>
        <div className="inline-flex items-center gap-2 text-slate-500 text-[10px] bg-white px-4 py-1 rounded-full border border-slate-200 shadow-sm font-bold uppercase">
           <span>{profile.age}岁</span>
           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
           <span>{profile.fitnessLevel}</span>
           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
           <span>BMI: {(profile.weight / ((profile.height/100) ** 2)).toFixed(1)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Score Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
           <h3 className="text-base font-bold text-slate-700 mb-6 flex items-center gap-2">
             <span className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </span>
             训练质量评分
           </h3>
           <div className="flex flex-col items-center justify-center py-4">
             <div className="text-7xl font-black text-slate-800 mb-1 tracking-tighter">{report.score}</div>
             <div className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 uppercase">
               {report.level}
             </div>
           </div>

           <div className="mt-8 space-y-5">
              {[
                { label: '训练一致性', val: report.metrics.consistency, color: 'bg-indigo-500' },
                { label: '动作多样性', val: report.metrics.variety, color: 'bg-orange-500' },
                { label: '渐进超负荷', val: report.metrics.overload, color: 'bg-emerald-500' },
                { label: '技术执行', val: report.metrics.execution, color: 'bg-blue-500' }
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    <span>{m.label}</span>
                    <span className="text-slate-900">{m.val}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5">
                    <div className={`${m.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${m.val}%` }}></div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-base font-bold text-slate-700 mb-6 flex items-center gap-2">
             <span className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
             </span>
             肌群发展平衡
           </h3>
           <div className="space-y-6">
              {[
                { label: '上肢推力', val: report.muscleBalance.push, color: 'bg-rose-500' },
                { label: '上肢拉力', val: report.muscleBalance.pull, color: 'bg-sky-500' },
                { label: '下肢推力', val: report.muscleBalance.legs, color: 'bg-emerald-500' },
                { label: '核心稳定', val: report.muscleBalance.core, color: 'bg-purple-500' }
              ].map((m) => (
                <div key={m.label}>
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-700 font-bold text-xs">{m.label}</span>
                      <span className="text-slate-400 text-[10px] font-bold">{m.val}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-3 relative overflow-hidden mb-1.5">
                      <div className={`${m.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${m.val}%` }}>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="text-indigo-700 text-xs font-bold mb-2 flex items-center gap-2 uppercase">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                平衡性建议
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {report.recommendations[0] || "目前肌群发展比例协调，建议维持现状并逐步提升强度。"}
              </p>
           </div>
        </div>

        {/* Physiology Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-base font-bold text-slate-700 mb-6 flex items-center gap-2">
             <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </span>
             生理学周期分析
           </h3>
           <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-indigo-600 mb-1 uppercase tracking-wider">当前阶段: {report.physiologicalAnalysis.currentPhase}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{report.physiologicalAnalysis.currentPhaseDesc}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-wider">预期发展: {report.physiologicalAnalysis.futureProjection}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{report.physiologicalAnalysis.futureProjectionDesc}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
