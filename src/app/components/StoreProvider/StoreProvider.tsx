'use client';

import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../../redux/store';
import { useGetHistoryQuery, useGetLastHeartbeatQuery, useGetSettingsQuery } from '@/app/api/api';


const Container = (
  {
    children,
  }: {
    children: React.ReactNode;
  }
) => {
  useGetHistoryQuery(void 0, {
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
  });
  useGetSettingsQuery();
  useGetLastHeartbeatQuery(void 0, {
    pollingInterval: 1000 * 60 * 10, // 10 minutes
  })

  return (
    children
  );
};

export const StoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    // storeRef.current.dispatch(fetchLastSyncTimestampThunk());
    // storeRef.current.dispatch(fetchHistoryThunk());
    // storeRef.current.dispatch(fetchSettingsThunk());

    // Set up polling to fetch the latest sync timestamp every 10 seconds
    // setInterval(() => {
    //   storeRef.current?.dispatch(fetchHistoryThunk());
    // }, 10000);
  }

  return (
    <Provider store={storeRef.current}>
      <Container>
        {children}
      </Container>
    </Provider>
  );
};