import { ExerciseLog } from '@/types/shared';

const REST_MET = 2.5;
const STRENGTH_MET = 4.5;
const STRENGTH_SET_DURATION = 1.5;

const CARDIO_MET_MAP: Record<string, number> = {
  running: 8,
  incline: 6,
  stairmaster: 9,
  rowing: 7,
  elliptical: 5.5,
  other: 5
};

export function estimateCalories(duration: number, userWeight: number, exercises: ExerciseLog[]): number {
  if (!duration) return 0;

  if (exercises.length === 0) {
    return Math.round(4.0 * userWeight * (duration / 60));
  }

  let activeCalories = 0;
  let activeTime = 0;

  exercises.forEach((exercise) => {
    if (exercise.type === 'cardio') {
      const met = CARDIO_MET_MAP[exercise.cardioCategory || 'other'] || CARDIO_MET_MAP.other;
      const set = exercise.sets[0];
      const exDuration = set?.duration || 0;
      activeCalories += met * userWeight * (exDuration / 60);
      activeTime += exDuration;
      return;
    }

    const setCount = exercise.sets.length;
    const estimatedTime = setCount * STRENGTH_SET_DURATION;
    activeCalories += STRENGTH_MET * userWeight * (estimatedTime / 60);
    activeTime += estimatedTime;
  });

  const restTime = Math.max(0, duration - activeTime);
  const restCalories = REST_MET * userWeight * (restTime / 60);
  return Math.round(activeCalories + restCalories);
}
