import { useGetLogsQuery } from "@/app/api/logs";
import { LogEntry, LogLevel } from "@/app/types";
import { ChangeEvent, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./LogViewer.module.scss";
import { DashboardItem } from "@/app/components/Dashboard/DashboardItem";


const LogEntryRow = (
    {
        entry,
    }: {
        entry: LogEntry;
    }
) => {
    const timestamp = useMemo(() => {
        if (entry.ms != null) {
            return `${entry.ms}ms`;
        }
        else if (entry.timestamp != null) {
            return new Date(entry.timestamp * 1000).toLocaleTimeString([], {
                hour12: false,
            });
        }
        else {
            console.error("Entry with no timestamp info");
            return "";
        }
    }, [
        entry.timestamp,
        entry.ms,
    ]);

    return (
        <div className={styles.entryLine} data-level={entry.level}>
            <span>
                {timestamp}
            </span>
            <span>
                {entry.level}
            </span>
            <span>
                {entry.message}
            </span>
        </div>
    );
};

const Controls = (
    {
        enabledLevels,
        toggleLevel,
        filterString = "",
        onFilterChange,
        follow,
        toggleFollow,
    }: {
        enabledLevels: {
            [level in LogLevel]: boolean;
        };
        toggleLevel: (level: LogLevel, enabled: boolean) => void;
        filterString?: string;
        onFilterChange: (value: string) => void;
        follow: boolean;
        toggleFollow: (follow: boolean) => void;
    }
) => {
    const handleClickFollowButton = useCallback(() => {
        toggleFollow(!follow);
    }, [
        follow,
        toggleFollow,
    ]);

    const handleToggleLevel = useCallback((level: LogLevel) => {
        toggleLevel(level, !enabledLevels[level]);
    }, [
        enabledLevels,
        toggleLevel
    ]);

    const handleDebugLevelButtonClick = useCallback(() => {
        handleToggleLevel(LogLevel.DEBUG);
    }, [
        handleToggleLevel,
    ]);

    const handleInfoLevelButtonClick = useCallback(() => {
        handleToggleLevel(LogLevel.INFO);
    }, [
        handleToggleLevel,
    ]);

    const handleWarnLevelButtonClick = useCallback(() => {
        handleToggleLevel(LogLevel.WARN);
    }, [
        handleToggleLevel,
    ]);

    const handleErrorLevelButtonClick = useCallback(() => {
        handleToggleLevel(LogLevel.ERROR);
    }, [
        handleToggleLevel,
    ]);

    const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;

        onFilterChange(value);
    }, [
        onFilterChange,
    ]);

    const handleClearFilterClick = useCallback(() => {
        onFilterChange("");
    }, [
        onFilterChange,
    ]);

    return (
        <Fragment>
            <button
                className={styles.followButton}
                onClick={handleClickFollowButton}
            >
                ⏬ Follow
            </button>

            <div className={styles.levelFilters}>
                <button
                    className={enabledLevels.DEBUG ? styles.on : ""}
                    onClick={handleDebugLevelButtonClick}
                    data-level={LogLevel.DEBUG}
                    >
                    DEBUG
                </button>
                <button
                    className={enabledLevels.INFO ? styles.on : ""}
                    onClick={handleInfoLevelButtonClick}
                    data-level={LogLevel.INFO}
                    >
                    INFO
                </button>
                <button
                    className={enabledLevels.WARN ? styles.on : ""}
                    onClick={handleWarnLevelButtonClick}
                    data-level={LogLevel.WARN}
                    >
                    WARN
                </button>
                <button
                    className={enabledLevels.ERROR ? styles.on : ""}
                    onClick={handleErrorLevelButtonClick}
                    data-level={LogLevel.ERROR}
                >
                    ERROR
                </button>
            </div>

            <div className={styles.filterContainer}>
                <input
                    type="text"
                    placeholder="Filter..."
                    value={filterString}
                    onChange={handleFilterChange}
                />
                <button
                    onClick={handleClearFilterClick}
                >
                    Clear
                </button>
            </div>
        </Fragment>
    );
};

export const LogViewer = (
    {
        maxEntries = 200,
    }: {
        maxEntries?: number;
    }
) => {
    const {data, isSuccess} = useGetLogsQuery();
    const containerRef = useRef<HTMLDivElement>(null);
    const [follow, setFollow] = useState(true);
    const [filter, setFilter] = useState("");
    const [enabledLevels, setEnabledLevels] = useState<{
        [level in LogLevel]: boolean;
    }>({
        DEBUG: true,
        INFO: true,
        WARN: true,
        ERROR: true,
    });

    const {entries, isConnected} = data || {
        entries: [],
        isConnected: false,
    };

    useEffect(() => {
        if (follow && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [
        follow,
        entries?.length,
        containerRef.current,
    ]);

    const [groupedLogs, entryCount] = useMemo(() => {
        const dateGroups: Record<number, LogEntry[]> = {};
        let entryCount = 0;

        for (const entry of entries.slice(-1 * maxEntries)) {
            if (filter && !entry.message.includes(filter)) {
                continue;
            }
            if (!enabledLevels[entry.level]) {
                continue;
            }
            let entries: LogEntry[];
            if (entry.ms == null) {
                const dateOnly = new Date(entry.timestamp);
                dateOnly.setHours(0, 0, 0, 0);
    
                entries = dateGroups[dateOnly.getTime()];

                if (!entries) {
                    entries = [];
                    dateGroups[dateOnly.getTime()] = entries;
                }
            }
            else {
                entries = dateGroups[-1];
                if (!entries) {
                    entries = [];
                    dateGroups[-1] = entries;
                }

            }

            entries.push(entry);
            entryCount += 1;
        }

        return [dateGroups, entryCount];
    }, [
        entries,
        filter,
        enabledLevels,
    ]);

    console.log("grouped logs:", groupedLogs);

    const handleFilterChange = useCallback((filterString: string) => {
        setFilter(filterString);
    }, []);

    const handleToggleLevel = useCallback((level: LogLevel, enabled: boolean) => {
        setEnabledLevels((levels) => ({
            ...levels,
            [level]: enabled,
        }))
    }, []);

    const handleToggleFollow = useCallback((value: boolean) => {
        setFollow(value);
    }, []);

    return (
        <DashboardItem
            title="Realtime Logs"
            controls={
                <Controls
                    enabledLevels={enabledLevels}
                    follow={follow}
                    filterString={filter}
                    toggleLevel={handleToggleLevel}
                    onFilterChange={handleFilterChange}
                    toggleFollow={handleToggleFollow}
                />
            }
        >
            {
                isSuccess ? (
                    <div>
                        <div className={styles.entryContainer} ref={containerRef}>
                            {
                                Object.keys(groupedLogs).sort((a, b) => Number(a) - Number(b)).map((tsString) => {
                                    let header: ReactNode;
                                    const tsNum = Number(tsString);
                                    if (Number.isNaN(tsNum)) {
                                        throw new Error(`Group key ${tsString} is not a valid number`);
                                    }
                                    if (tsNum === -1) {
                                        header = (
                                            <div className={styles.dateHeader}>
                                                Milliseconds (pre-time sync)
                                            </div>
                                        );
                                    }
                                    else {
                                        const date = new Date(tsNum);
                                        header = (
                                            <div
                                                className={styles.dateHeader}
                                            >
                                                {date.toLocaleDateString()}
                                            </div>
                                        );
                                    }


                                    return (
                                        <Fragment
                                            key={tsString}
                                        >
                                            {header}
                                            {
                                                groupedLogs[tsNum].map((entry, index) => (
                                                    <LogEntryRow
                                                        key={index}
                                                        entry={entry}
                                                    />
                                                ))
                                            }
                                        </Fragment>
                                    );
                                })
                                // filteredLogs.map((entry, index) => (
                                //     <LogEntryRow
                                //         key={index}
                                //         entry={entry}
                                //     />
                                // ))
                            }
                        </div>
                        <footer className={styles.footer}>
                            <span>{isConnected ? "Connected" : "Disconnected"}</span>
                            <span className={styles.entryCount}>{entryCount} entries</span>
                        </footer>
                    </div>
                ) : (
                    <div>
                        Loading logs...
                    </div>
                )
            }
        </DashboardItem>
    );
};
