
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, WorkoutLog, AIAdvice, TrainingReport, ExerciseInsight } from "../types";

// Helper to get a fresh instance with the current key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simple SessionStorage Cache Helper
 */
export const Cache = {
  get: (key: string) => {
    try {
      const data = sessionStorage.getItem(`fg_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      sessionStorage.setItem(`fg_cache_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn("Cache set failed", e);
    }
  },
  // 生成稳定的缓存 Key
  stableKey: (prefix: string, data: any) => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `${prefix}_${hash}`;
  }
};

/**
 * Helper to handle API calls with exponential backoff for 429 errors.
 */
async function callWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const is429 = errorMsg.includes('429') || error?.status === 429 || error?.code === 429;
      
      if (is429) {
        if (i === maxRetries - 1) throw error; // Last attempt
        const delay = Math.pow(2, i) * 3000 + Math.random() * 1000;
        console.warn(`Rate limit hit (429). Attempt ${i + 1}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Model Selection: Flash has much higher quota (15 RPM) than Pro (2 RPM)
const DEFAULT_MODEL = 'gemini-3-flash-preview';

// Schemas
const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "计划标题，使用中文" },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "星期几，如'周一'" },
          focus: { type: Type.STRING, description: "当日重点，如'胸肌肥大'" },
          exercises: { type: Type.ARRAY, items: { type: Type.STRING }, description: "动作列表，使用中文" },
          duration: { type: Type.NUMBER },
          notes: { type: Type.STRING, description: "动作要领或建议，使用中文" }
        },
        required: ["day", "focus", "exercises", "duration", "notes"]
      }
    }
  },
  required: ["title", "schedule"]
};

const adviceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "分析总结，使用中文" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "优势点列表，使用中文" },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "改进方向列表，使用中文" },
    nextStep: { type: Type.STRING, description: "下一步具体操作建议，使用中文" }
  },
  required: ["summary", "strengths", "improvements", "nextStep"]
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    level: { type: Type.STRING, description: "水平评价，如'优秀水平'，使用中文" },
    metrics: {
      type: Type.OBJECT,
      properties: {
        consistency: { type: Type.INTEGER }, variety: { type: Type.INTEGER },
        overload: { type: Type.INTEGER }, execution: { type: Type.INTEGER }
      },
      required: ["consistency", "variety", "overload", "execution"]
    },
    muscleBalance: {
      type: Type.OBJECT,
      properties: {
        push: { type: Type.INTEGER }, pull: { type: Type.INTEGER },
        legs: { type: Type.INTEGER }, core: { type: Type.INTEGER }
      },
      required: ["push", "pull", "legs", "core"]
    },
    physiologicalAnalysis: {
      type: Type.OBJECT,
      properties: {
        currentPhase: { type: Type.STRING, description: "当前生理/训练阶段名称，使用中文" }, 
        currentPhaseDesc: { type: Type.STRING, description: "阶段描述，使用中文" },
        futureProjection: { type: Type.STRING, description: "未来预期发展阶段名称，使用中文" }, 
        futureProjectionDesc: { type: Type.STRING, description: "发展预期描述，使用中文" }
      },
      required: ["currentPhase", "currentPhaseDesc", "futureProjection", "futureProjectionDesc"]
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "针对性的平衡建议列表，使用中文" }
  },
  required: ["score", "level", "metrics", "muscleBalance", "physiologicalAnalysis", "recommendations"]
};

const insightSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    exerciseName: { type: Type.STRING },
    targetMuscles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "目标肌群名称列表，使用中文" },
    technicalPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "技术要点列表，使用中文" },
    physiologicalPrinciple: { type: Type.STRING, description: "生物力学或生理学原理详细解释，使用中文" }
  },
  required: ["exerciseName", "targetMuscles", "technicalPoints", "physiologicalPrinciple"]
};

export const generateFitnessPlan = async (profile: UserProfile): Promise<WorkoutPlan | null> => {
  const cacheKey = Cache.stableKey('plan', { goal: profile.goal, level: profile.fitnessLevel, weight: profile.weight });
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  return callWithRetry(async () => {
    const ai = getAI();
    const prompt = `你是一位专业的健身教练。请为健身水平为${profile.fitnessLevel}、体重${profile.weight}kg、身高${profile.height}cm、目标为${profile.goal}的用户制定一个为期7天的健身计划。所有回复内容必须完全使用中文。`;
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseSchema: planSchema }
    });

    if (response.text) {
      const result = { ...JSON.parse(response.text), goal: profile.goal };
      Cache.set(cacheKey, result);
      return result;
    }
    return null;
  }).catch(() => null);
};

export const analyzeWorkoutHistory = async (logs: WorkoutLog[], profile: UserProfile): Promise<AIAdvice | null> => {
  if (logs.length === 0) return null;
  const lastLogDate = logs[0]?.date || '';
  const cacheKey = Cache.stableKey('analysis', { logCount: logs.length, lastDate: lastLogDate, goal: profile.goal });
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  return callWithRetry(async () => {
    const ai = getAI();
    const prompt = `分析近5次训练日志：${JSON.stringify(logs.slice(0, 5))}。用户目标：${profile.goal}。请评估其训练强度和一致性。所有分析结果必须完全使用中文提供。`;
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseSchema: adviceSchema }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      Cache.set(cacheKey, result);
      return result;
    }
    return null;
  }).catch(() => null);
};

export const generateTrainingReport = async (logs: WorkoutLog[], profile: UserProfile): Promise<TrainingReport | null> => {
  if (logs.length === 0) return null;
  const lastLogDate = logs[0]?.date || '';
  const cacheKey = Cache.stableKey('report', { logCount: logs.length, lastDate: lastLogDate, age: profile.age, goal: profile.goal });
  
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  return callWithRetry(async () => {
    const ai = getAI();
    const prompt = `生成深度健身报告。总日志条数：${logs.length}。最后记录日期：${lastLogDate}。用户目标：${profile.goal}。年龄：${profile.age}。重点分析训练的一致性和超负荷原则的执行情况。请注意：报告中的所有描述、阶段名称（生理周期）和平衡性建议必须完全使用中文输出。`;
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseSchema: reportSchema }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      Cache.set(cacheKey, result);
      return result;
    }
    return null;
  }).catch(() => null);
};

export const getExerciseInsight = async (exerciseName: string): Promise<ExerciseInsight | null> => {
  const cacheKey = `insight_v2_${exerciseName}`;
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  return callWithRetry(async () => {
    const ai = getAI();
    const prompt = `提供动作 "${exerciseName}" 的生物力学分析。请列出技术要点、目标肌群以及生理学原理。所有解释请务必使用中文。`;
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseSchema: insightSchema }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      Cache.set(cacheKey, result);
      return result;
    }
    return null;
  }).catch(() => null);
};
