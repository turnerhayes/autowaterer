import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry } from '@/app/types';
import { getHistory, getLastHistorySyncTimestamp } from '@/app/api/autowaterer';
import { AppDispatch } from '@/app/redux/store';


export interface HistoryState {
  history: HistoryEntry[];
  lastSyncTimestamp: number | null;
}

const initialState: HistoryState = {
  history: [],
  lastSyncTimestamp: null,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistory(state, action: PayloadAction<HistoryEntry[]>) {
      state.history = action.payload;
    },
    setLastSyncTimestamp(state, action: PayloadAction<number | null>) {
      state.lastSyncTimestamp = action.payload;
    },
  },
});

export const { setHistory, setLastSyncTimestamp } = historySlice.actions;

export const historyReducer = historySlice.reducer;

export const fetchLastSyncTimestampThunk = () => async (dispatch: AppDispatch) => {
    try {
        const lastSyncTimestamp = await getLastHistorySyncTimestamp();
        dispatch(setLastSyncTimestamp(lastSyncTimestamp));
    } catch (error) {
        console.error('Error fetching last sync timestamp:', error);
    }
};

export const fetchHistoryThunk = () => async (dispatch: AppDispatch) => {
  try {
    const { history, lastSyncTimestamp } = await getHistory({
      limit: 200,
    });
    dispatch(setHistory(history));
    dispatch(setLastSyncTimestamp(lastSyncTimestamp));
  } catch (error) {
    console.error('Error fetching history:', error);
  }
};
