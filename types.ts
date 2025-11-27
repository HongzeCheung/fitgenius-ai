export enum GoalType {
  WEIGHT_LOSS = '减脂',
  MUSCLE_GAIN = '增肌',
  ENDURANCE = '耐力提升',
  FLEXIBILITY = '柔韧性',
  GENERAL_HEALTH = '健康维持'
}

export interface ExerciseSet {
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  title: string;
  duration: number; // in minutes
  calories: number;
  notes: string;
  exercises: ExerciseLog[];
}

export interface DailyPlan {
  day: string;
  focus: string;
  exercises: string[];
  duration: number;
  notes: string;
}

export interface WorkoutPlan {
  title: string;
  goal: GoalType;
  schedule: DailyPlan[];
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  goal: GoalType;
  fitnessLevel: '初学者' | '中级' | '高级';
}

export interface AIAdvice {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextStep: string;
}

export interface TrainingReport {
  score: number;
  level: string;
  metrics: {
    consistency: number;
    variety: number;
    overload: number;
    execution: number;
  };
  muscleBalance: {
    push: number;
    pull: number;
    legs: number;
    core: number;
  };
  physiologicalAnalysis: {
    currentPhase: string;
    currentPhaseDesc: string;
    futureProjection: string;
    futureProjectionDesc: string;
  };
  recommendations: string[];
}

export interface ExerciseInsight {
  exerciseName: string;
  targetMuscles: string[];
  technicalPoints: string[];
  physiologicalPrinciple: string;
}
