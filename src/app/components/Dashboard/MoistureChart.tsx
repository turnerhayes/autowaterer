import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis, Tooltip, Scatter, ReferenceLine, TooltipProps, Label } from "recharts";
import { RechartsDevtools } from '@recharts/devtools';
import { useAppSelector } from "@/app/redux/redux";
import { getHistory } from "@/app/redux/selectors/history";
import { useCallback, useMemo } from "react";
import { History } from "@/app/types";
import { getMoistureThresholdSetting } from "@/app/redux/selectors/settings";
import { DashboardItem } from "@/app/components/Dashboard/DashboardItem";


function isDateEarlier(date1: Date, date2: Date) {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);

    return d1 < d2;
}

function aggregateMoistureHistory(history: History) {
    const countByTimestamp: Record<number, number> = {};
    const aggregated = new Map<number, {timestamp: number; moisture: number, did_water: boolean}>();

    for (const {timestamp, moisture_pct, did_water} of history) {
        const entry = aggregated.get(timestamp);
        const time = new Date(timestamp);
        time.setMilliseconds(0);
        time.setSeconds(0);
        const truncatedTimestamp = time.getTime();
        if (!entry) {
            countByTimestamp[truncatedTimestamp] = (countByTimestamp[truncatedTimestamp] ?? 0) + 1
            aggregated.set(truncatedTimestamp, {
                timestamp,
                moisture: moisture_pct,
                did_water,
            });
        }
        else {
            entry.moisture = entry.moisture + (moisture_pct - entry.moisture)/countByTimestamp[truncatedTimestamp];
            entry.did_water = entry.did_water || did_water;
        }
    }

    return [...aggregated.values()].sort((a, b) => a.timestamp - b.timestamp);
}

const tooltipLabelFormatter = (
    (timestamp: any) => {
        if (typeof timestamp !== 'number') {
            throw new Error(`Label ${timestamp} is not a timestamp`);
        }
        if (Number.isNaN(timestamp)) {
            return String(timestamp)
        };
        return new Date(timestamp).toLocaleString([], {
            hour12: false,
        });
    }
);

export default function MoistureChart() {
    const history = useAppSelector(getHistory);
    const moistureThreshold = useAppSelector(getMoistureThresholdSetting);

    const aggregatedHistory = useMemo(() => {
        if (!history) {
            return [];
        }

        return aggregateMoistureHistory(history);
    }, [
        history,
    ]);

    const didWaterTimestamps = useMemo(
        () => {
            if (!aggregatedHistory) {
                return [];
            }
            
            return aggregatedHistory.reduce((timestamps, {timestamp, did_water}) => {
                if (did_water) {
                    timestamps.push(timestamp);
                }

                return timestamps;
            }, [] as number[]);
        },
        [
            aggregatedHistory,
        ]
    );

    const sensorErrorTimestamps = useMemo(() => {
        if (!aggregatedHistory) {
            return [];
        }
        
        return aggregatedHistory.reduce((timestamps, {timestamp, moisture}) => {
            if (moisture < 0) {
                timestamps.push(timestamp);
            }

            return timestamps;
        }, [] as number[]);
    }, [
        aggregatedHistory,
    ]);

    const moistureHistory = useMemo(() => {
        return aggregatedHistory.filter(({moisture}) => moisture >= 0);
    }, [
        aggregatedHistory,
    ]);

    const xTickFormatter = useCallback((timestamp: number, index: number) => {
        const date = new Date(timestamp);
        let includeDate = false;
        if (!history) {
            includeDate = true;
        }
        const prevDate = index > 0 ? new Date(aggregatedHistory[index - 1].timestamp) : null;

        if (prevDate == null || isDateEarlier(prevDate, date)) {
            includeDate = true;
        }

        return includeDate ? date.toLocaleString([], {
            hour12: false,
        }) : date.toLocaleTimeString([], {
            hour12: false,
        });
    }, [
        aggregatedHistory,
    ]);

    if (aggregatedHistory.length === 0) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        <DashboardItem
            title="Moisture"
        >
            <LineChart
                style={{ width: '100%', aspectRatio: 1.618 }}
                margin={{right: 20}}
                responsive
                data={moistureHistory}
            >
                <CartesianGrid />
                <Line
                    dataKey="moisture"
                    type="monotone"
                    name="Moisture"
                />
                <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    angle={-60}
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={xTickFormatter}
                    tick={{
                        textAnchor: "end",
                    }}
                    height={120}
                />
                <YAxis
                    domain={[0, 100]}
                    type="number"
                >
                    <Label
                        value="Moisture (%)"
                        angle={-90}
                        position="insideLeft"
                        textAnchor="middle"
                    />
                </YAxis>
                <Tooltip
                    labelFormatter={tooltipLabelFormatter}
                />
                <ReferenceLine
                    y={moistureThreshold}
                    stroke="green"
                    strokeDasharray="3 3"
                    label={{
                        value: "Threshold",
                        stroke: "green",
                        position: "right",
                        textAnchor: "middle",
                        fontSize: "small",
                        angle: 90,
                        offset: 10,
                    }}
                />
                {
                    didWaterTimestamps.map((ts) => (
                        <ReferenceLine
                            key={ts}
                            x={ts}
                            stroke="blue"
                        />
                    ))
                }

                {
                    sensorErrorTimestamps.map((ts) => (
                        <ReferenceLine
                            key={ts}
                            x={ts}
                            stroke="red"
                            position="start"
                        />
                    ))
                }
                {/* <Line
                    data={() => null}
                    stroke="red"
                    strokeDasharray="3 3" 
                    legendType="line"
                    name="Moisture Sensor Error"
                /> */}
                <Legend />
                <RechartsDevtools />
            </LineChart>
        </DashboardItem>
    );
}
