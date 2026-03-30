import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { UserProfile, WorkoutLog } from '@/types/shared';

interface AppState {
  authenticated: boolean;
  profile: UserProfile | null;
  logs: WorkoutLog[];
}

const initialState: AppState = {
  authenticated: false,
  profile: null,
  logs: []
};

type Action =
  | { type: 'set_authenticated'; payload: boolean }
  | { type: 'set_profile'; payload: UserProfile | null }
  | { type: 'set_logs'; payload: WorkoutLog[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set_authenticated':
      return { ...state, authenticated: action.payload };
    case 'set_profile':
      return { ...state, profile: action.payload };
    case 'set_logs':
      return { ...state, logs: action.payload };
    default:
      return state;
  }
}

const AppStoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export const AppStoreProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used inside AppStoreProvider');
  }
  return ctx;
}
