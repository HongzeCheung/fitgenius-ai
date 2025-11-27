import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, WorkoutLog, AIAdvice, TrainingReport, ExerciseInsight } from "../types";

// Helper to get a fresh instance with the current key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Plan Generation
const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "训练计划标题" },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "周几 (例如：周一)" },
          focus: { type: Type.STRING, description: "训练重点 (例如：胸部力量)" },
          exercises: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "具体动作列表"
          },
          duration: { type: Type.NUMBER, description: "预计时长(分钟)" },
          notes: { type: Type.STRING, description: "注意事项" }
        },
        required: ["day", "focus", "exercises", "duration", "notes"]
      }
    }
  },
  required: ["title", "schedule"]
};

// Schema for Coach Analysis
const adviceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "近期表现总结" },
    strengths: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "做的好的地方" 
    },
    improvements: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "需要改进的地方" 
    },
    nextStep: { type: Type.STRING, description: "下一次训练的具体建议" }
  },
  required: ["summary", "strengths", "improvements", "nextStep"]
};

// Schema for Detailed Report
const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "0-100 评分" },
    level: { type: Type.STRING, description: "评级 (例如: 优秀, 良好)" },
    metrics: {
      type: Type.OBJECT,
      properties: {
        consistency: { type: Type.INTEGER },
        variety: { type: Type.INTEGER },
        overload: { type: Type.INTEGER },
        execution: { type: Type.INTEGER }
      },
      required: ["consistency", "variety", "overload", "execution"]
    },
    muscleBalance: {
      type: Type.OBJECT,
      properties: {
        push: { type: Type.INTEGER },
        pull: { type: Type.INTEGER },
        legs: { type: Type.INTEGER },
        core: { type: Type.INTEGER }
      },
      required: ["push", "pull", "legs", "core"]
    },
    physiologicalAnalysis: {
      type: Type.OBJECT,
      properties: {
        currentPhase: { type: Type.STRING },
        currentPhaseDesc: { type: Type.STRING },
        futureProjection: { type: Type.STRING },
        futureProjectionDesc: { type: Type.STRING }
      },
      required: ["currentPhase", "currentPhaseDesc", "futureProjection", "futureProjectionDesc"]
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["score", "level", "metrics", "muscleBalance", "physiologicalAnalysis", "recommendations"]
};

// Schema for Exercise Insight
const insightSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    exerciseName: { type: Type.STRING },
    targetMuscles: { type: Type.ARRAY, items: { type: Type.STRING } },
    technicalPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    physiologicalPrinciple: { type: Type.STRING }
  },
  required: ["exerciseName", "targetMuscles", "technicalPoints", "physiologicalPrinciple"]
};

export const generateFitnessPlan = async (profile: UserProfile): Promise<WorkoutPlan | null> => {
  try {
    const ai = getAI();
    const prompt = `
      为以下用户制定一个7天的健身计划，请使用中文回答：
      - 年龄: ${profile.age}
      - 体重: ${profile.weight}kg
      - 身高: ${profile.height}cm
      - 目标: ${profile.goal}
      - 水平: ${profile.fitnessLevel}
      
      计划应当切实可行，包含动作名称、组数次数建议。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
        systemInstruction: "你是一个专业的健身教练。请只返回有效的 JSON 数据。"
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        goal: profile.goal
      } as WorkoutPlan;
    }
    return null;
  } catch (error) {
    console.error("Error generating plan:", error);
    return null;
  }
};

export const analyzeWorkoutHistory = async (logs: WorkoutLog[], profile: UserProfile): Promise<AIAdvice | null> => {
  try {
    if (logs.length === 0) return null;
    const ai = getAI();

    // Limit log size to prevent context overflow
    const recentLogs = logs.slice(0, 8); 
    const logsText = JSON.stringify(recentLogs.map(l => ({
      date: l.date,
      title: l.title,
      exercises: l.exercises.map(e => ({ name: e.name, sets: e.sets.length }))
    })));

    const prompt = `
      分析该用户最近的训练日志，目标是"${profile.goal}"。请使用中文回答。
      用户水平: ${profile.fitnessLevel}。
      日志摘要: ${logsText}
      
      请提供建设性的反馈，找出训练模式中的优点和缺点。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: adviceSchema,
        systemInstruction: "你是一个数据驱动的健身分析师，语气要专业且鼓励人心。"
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAdvice;
    }
    return null;
  } catch (error) {
    console.error("Error analyzing history:", error);
    return null;
  }
};

export const generateTrainingReport = async (logs: WorkoutLog[], profile: UserProfile): Promise<TrainingReport | null> => {
  try {
    const ai = getAI();
    // Simplified log structure for analysis to reduce token usage
    const logsSummary = JSON.stringify(logs.slice(0, 10).map(l => ({
       title: l.title,
       exercises: l.exercises.map(e => e.name)
    })));

    const prompt = `
      基于过去训练日志生成一份详细的训练分析报告。请使用中文。
      用户资料: ${JSON.stringify(profile)}
      日志摘要: ${logsSummary}
      
      1. 评分 (0-100) 和评级。
      2. 评估以下指标 (0-100): 训练一致性 (consistency), 动作多样性 (variety), 渐进负荷 (overload), 技术执行估算 (execution)。
      3. 分析肌群平衡 (push/pull/legs/core) 的百分比。
      4. 生理学分析：判断当前处于什么训练阶段（如神经适应期、肌肥大期等），并预测未来发展。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        systemInstruction: "你是一位高级运动科学家，正在为运动员提供详细的生理学训练报告。"
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TrainingReport;
    }
    return null;
  } catch (error) {
    console.error("Error generating report:", error);
    return null;
  }
};

export const getExerciseInsight = async (exerciseName: string): Promise<ExerciseInsight | null> => {
  try {
    const ai = getAI();
    const prompt = `
      提供关于动作 "${exerciseName}" 的专业技术分析。请使用中文。
      包含：
      1. 目标肌群
      2. 4-5个关键的技术要点（Technical Points），用于保持完美姿势。
      3. 生理学原理（Physiological Principle），解释该动作如何刺激肌肉生长或力量提升。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: insightSchema,
        systemInstruction: "你是一位生物力学专家。"
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExerciseInsight;
    }
    return null;
  } catch (error) {
    console.error("Error getting insight:", error);
    return null;
  }
};