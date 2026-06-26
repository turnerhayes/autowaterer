export interface HistoryEntry {
    timestamp: number;
    moisture_pct: number;
    did_water: boolean;
}

export type History = HistoryEntry[];

export interface Settings {
    thresholdPct: number;
    pumpDurationMs: number;
    checkIntervalMs: number;
    lockoutMs: number;
}

export type SettingKey = keyof Settings;

export const ReadableSettingKeyMap = {
    thresholdPct: "Moisture Threshold",
    pumpDurationMs: "Pump Duration",
    checkIntervalMs: "Check Interval",
    lockoutMs: "Lockout Duration",
} as Record<SettingKey, string>;


export const SettingUnits: Record<SettingKey, string> = {
    checkIntervalMs: "ms",
    thresholdPct: "%",
    pumpDurationMs: "ms",
    lockoutMs: "ms",
} as const;

export enum LogLevel {
    INFO = "INFO",
    DEBUG = "DEBUG",
    WARN = "WARN",
    ERROR = "ERROR",
}

export type LogEntry = {
    receivedAt: number;
    level: LogLevel;
    message: string;
} & (
    {
        timestamp: number;
        ms: never;
    } | {
        timestamp: never;
        ms: number;
    }
)
