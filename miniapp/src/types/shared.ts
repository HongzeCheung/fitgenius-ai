export interface WeightEntry {
  date: string;
  weight: number;
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  duration?: number;
  speed?: number;
  incline?: number;
  resistance?: number;
  level?: number;
}

export interface ExerciseLog {
  name: string;
  type: 'strength' | 'cardio';
  cardioCategory?: string;
  sets: ExerciseSet[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  title: string;
  duration: number;
  calories: number;
  notes: string;
  exercises: ExerciseLog[];
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  fitnessLevel: string;
  weightHistory?: WeightEntry[];
}
