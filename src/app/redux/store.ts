import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/app/api/api';
import { logsApi } from '@/app/api/logs';

export const makeStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      [logsApi.reducerPath]: logsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([
      // settingsMiddleware,
      api.middleware,
      logsApi.middleware,
    ]),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];