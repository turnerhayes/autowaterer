import { configureStore } from '@reduxjs/toolkit';
import { historyReducer } from './slices/history';
import { settingsReducer } from './slices/settings';

export const makeStore = () => {
  return configureStore({
    reducer: {
      history: historyReducer,
      settings: settingsReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];