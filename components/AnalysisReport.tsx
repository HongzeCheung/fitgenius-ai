import React, { useEffect, useState } from 'react';
import { TrainingReport, WorkoutLog, UserProfile } from '../types';
import { generateTrainingReport } from '../services/geminiService';
import { Spinner } from './Spinner';

interface AnalysisReportProps {
  logs: WorkoutLog[];
  profile: UserProfile;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ logs, profile }) => {
  const [report, setReport] = useState<TrainingReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (logs.length === 0) return;
      setLoading(true);
      const result = await generateTrainingReport(logs, profile);
      setReport(result);
      setLoading(false);
    };
    fetchReport();
  }, [logs, profile]);

  if (logs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
        <h3 className="text-slate-800 font-bold text-lg mb-2">暂无训练数据</h3>
        <p className="text-slate-500">请先记录一些训练日志，或者使用模拟数据来生成报告。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Spinner />
        <p className="text-slate-500 font-medium mt-6 animate-pulse">正在分析生物力学数据与训练负荷...</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">深度训练分析报告</h2>
        <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-1 rounded-full border border-slate-200 shadow-sm">
           <span>{profile.age}岁</span>
           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
           <span>{profile.fitnessLevel}</span>
           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
           <span>BMI: {(profile.weight / ((profile.height/100) ** 2)).toFixed(1)}</span>
        </div>
      </div>

      {/* Top Section: Score and Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Score Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
           <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
             <span className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </span>
             训练质量评分
           </h3>
           <div className="flex flex-col items-center justify-center py-6">
             <div className="text-8xl font-black text-slate-800 mb-2 tracking-tighter">{report.score}</div>
             <div className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1">
               {report.level}
             </div>
           </div>

           <div className="mt-8 space-y-5">
              {[
                { label: '训练一致性', val: report.metrics.consistency, color: 'bg-indigo-500', desc: '过去4周保持规律训练' },
                { label: '动作多样性', val: report.metrics.variety, color: 'bg-orange-500', desc: '涵盖主要肌群，可增加变化' },
                { label: '渐进超负荷', val: report.metrics.overload, color: 'bg-emerald-500', desc: '重量递增合理有效' },
                { label: '技术执行', val: report.metrics.execution, color: 'bg-blue-500', desc: '动作质量良好，继续保持' }
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm font-medium text-slate-700 mb-1.5">
                    <span>{m.label}</span>
                    <span className="font-bold text-slate-900">{m.val}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5">
                    <div className={`${m.color} h-2 rounded-full`} style={{ width: `${m.val}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Muscle Balance */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
             <span className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
             </span>
             肌群发展平衡
           </h3>
           <div className="space-y-6">
              {[
                { label: '上肢推力', val: report.muscleBalance.push, color: 'bg-rose-500', ex: '平板撑, 史密斯卧推' },
                { label: '上肢拉力', val: report.muscleBalance.pull, color: 'bg-sky-500', ex: '坐姿划船, T杠划船' },
                { label: '下肢推力', val: report.muscleBalance.legs, color: 'bg-emerald-500', ex: '哈克深蹲, 臀桥机' },
                { label: '核心稳定', val: report.muscleBalance.core, color: 'bg-purple-500', ex: '平板撑, 反向卷腹' }
              ].map((m) => (
                <div key={m.label}>
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-700 font-bold text-sm">{m.label}</span>
                      <span className="text-slate-500 text-xs font-mono">{m.val}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden mb-1.5">
                      <div className={`${m.color} h-full rounded-full relative`} style={{ width: `${m.val}%` }}>
                      </div>
                   </div>
                   <p className="text-xs text-slate-400 truncate">{m.ex}</p>
                </div>
              ))}
           </div>
           
           <div className="mt-8 p-5 bg-orange-50 rounded-2xl border border-orange-100">
              <h4 className="text-orange-700 text-sm font-bold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                平衡性建议
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {report.muscleBalance.push < 50 ? "上肢推力相对较弱，建议增加胸部和肩部训练。可以加入更多推举类动作，如哑铃推胸、肩上推举等，以平衡拉推比例。" : "主要肌群结构平衡维持良好，请继续保持当前的全面训练模式。"}
              </p>
           </div>
        </div>
      </div>

      {/* Physiology Section */}
      <div className="space-y-4">
         <h3 className="text-xl font-bold text-slate-800 px-2">训练生理学分析</h3>
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <h4 className="text-slate-800 font-bold">当前阶段: {report.physiologicalAnalysis.currentPhase}</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                    {report.physiologicalAnalysis.currentPhaseDesc}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </span>
                    <h4 className="text-slate-800 font-bold">预期发展</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                    {report.physiologicalAnalysis.futureProjectionDesc}
                </p>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};