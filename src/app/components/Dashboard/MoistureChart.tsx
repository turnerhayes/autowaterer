import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis, Tooltip, Scatter, ReferenceLine } from "recharts";
import { RechartsDevtools } from '@recharts/devtools';
import { useAppSelector } from "@/app/redux/redux";
import { getHistory } from "@/app/redux/selectors/history";
import { useCallback, useMemo } from "react";

const timeFormatter = (timestamp: number) => new Date(timestamp).toLocaleDateString();

const dateFormat = new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "short",
});

const timeFormat = new Intl.DateTimeFormat(navigator.language, {
    timeStyle: "short",
});

function isDateEarlier(date1: Date, date2: Date) {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);

    return d1 < d2;
}

export default function MoistureChart() {
    const history = useAppSelector(getHistory);

    // console.log("history:", history);

    const didWaterTimestamps = useMemo(
        () => {
            return history.filter((val) => val.did_water).map((val) => val.timestamp);
        },
        [
            history,
        ]
    );

    console.log("didWaterTimestamps:", didWaterTimestamps.map(ts => new Date(ts).toISOString()));

    const xTickFormatter = useCallback((timestamp: number, index: number) => {
        // For some reason, Recharts seems to index ticks in reverse--index 0 corresponds to
        // the last data point, not the first.
        const historyIndex = history.length - 1 - index;
        const date = new Date(timestamp);
        const prevDate = historyIndex > 0 ? new Date(history[historyIndex - 1].timestamp) : null;

        let str = "";
        if (prevDate == null || isDateEarlier(prevDate, date)) {
            str = dateFormat.format(date) + " ";
        }
        str += timeFormat.format(date);

        return str;
    }, [
        history,
    ]);

    const tooltipFormatter = useCallback((value: number) => {
        return (
            {value}
        );
    }, []);

    return (
        <LineChart
            style={{ width: '100%', aspectRatio: 1.618 }}
            responsive
            data={history}
        >
            <CartesianGrid />
            <Line dataKey="moisturePct" type="monotone" />
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
                height={110}
            />
            <YAxis
                domain={[-10, 'auto']}
                type="number"
            />
            <Tooltip
            />
            {
                didWaterTimestamps.map((ts) => (
                    <ReferenceLine
                        key={ts}
                        x={ts}
                        stroke="blue"
                        label={{
                            value: "Watered",
                            fill: "black",
                            position: 'insideTop',
                        }}
                    />
                ))
            }
            <Legend />
            <RechartsDevtools />
        </LineChart>
    );
}
