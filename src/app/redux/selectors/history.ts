import { RootState } from "@/app/redux/store";
import { createSelector } from "@reduxjs/toolkit";

export const getHistory = (state: RootState) => state.history.history;

export const getLatestHistoryEntry = createSelector(
  [getHistory],
  (history) => history[history.length - 1]
);

export const getLastSyncTimestamp = (state: RootState) => state.history.lastSyncTimestamp;
