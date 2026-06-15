import { getSettings } from "@/app/api/autowaterer";
import { AppDispatch } from "@/app/redux/store";
import { SettingKey, Settings } from "@/app/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface SettingsState extends Settings {
    lastSettingsSyncTimestamp: number|null;
}

const initialState: SettingsState = {
    [SettingKey.ThresholdPct]: -1,
    [SettingKey.PumpDurationMs]: -1,
    [SettingKey.CheckIntervalMs]: -1,
    [SettingKey.LockoutMs]: -1,
    lastSettingsSyncTimestamp: null,
};


export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<SettingsState>>) {
        const settings = action.payload;

        for (const key of Object.values(SettingKey)) {
            const value = settings[key as SettingKey];
            if (value != undefined) {
                state[key as SettingKey] = value;
            }
        }
    },

    setLastSettingsSyncTimestamp(state, action: PayloadAction<number|null>) {
        state.lastSettingsSyncTimestamp = action.payload;
    },
  },
});

export const { updateSettings, setLastSettingsSyncTimestamp } = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;

export const fetchSettingsThunk = () => async (dispatch: AppDispatch) => {
    const { settings, lastSettingsSyncTimestamp } = await getSettings();
    dispatch(updateSettings(settings));
    dispatch(setLastSettingsSyncTimestamp(lastSettingsSyncTimestamp));
};
