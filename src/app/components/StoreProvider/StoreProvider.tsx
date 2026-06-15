'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../../redux/store';
import { fetchHistoryThunk, fetchLastSyncTimestampThunk, setLastSyncTimestamp } from '@/app/redux/slices/history';
import { fetchSettingsThunk } from '@/app/redux/slices/settings';

export const StoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    storeRef.current.dispatch(fetchLastSyncTimestampThunk());
    storeRef.current.dispatch(fetchHistoryThunk());
    storeRef.current.dispatch(fetchSettingsThunk());

    // Set up polling to fetch the latest sync timestamp every 10 seconds
    setInterval(() => {
      storeRef.current?.dispatch(fetchHistoryThunk());
    }, 10000);
  }

  return (
    <Provider store={storeRef.current}>
        {children}
    </Provider>
  );
};