export interface HistoryEntry {
    timestamp: number;
    moisturePct: number;
    did_water: boolean;
}

export enum SettingKey {
    ThresholdPct = 'thresholdPct',
    PumpDurationMs = 'pumpDurationMs',
    CheckIntervalMs = 'checkIntervalMs',
    LockoutMs = 'lockoutMs',
}

export type Settings = Record<SettingKey, number>;
