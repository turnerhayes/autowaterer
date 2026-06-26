import { createSelector } from "@reduxjs/toolkit";
import { api } from "@/app/api/api";

export const getHistory = createSelector(
  [
    api.endpoints.getHistory.select(),
  ],
  ({data}) => data?.history
);

export const getLastSyncTimestamp = createSelector(
  [
    api.endpoints.getHistory.select(),
  ],
  ({data}) => data?.lastSyncTimestamp
);
