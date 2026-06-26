import { createSelector } from "@reduxjs/toolkit";
import { SettingKey } from "@/app/types";
import { api } from "@/app/api/api";


export const getSettings = createSelector(
    [
        api.endpoints.getSettings.select(),
    ],
    ({data}) => data?.settings
);

export const getSetting = createSelector(
    [
        getSettings,
        (_, key: SettingKey) => key,
    ],
    (settings, key) => settings?.[key]
);

export const getMoistureThresholdSetting = createSelector(
    [
        getSettings,
    ],
    (settings) => settings?.thresholdPct
)

export const getAreSettingsLoaded = createSelector(
    [
        api.endpoints.getSettings.select(),
    ],
    ({status}) => status === "fulfilled"
);
