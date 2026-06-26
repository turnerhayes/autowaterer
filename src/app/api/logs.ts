import { createApi, fakeBaseQuery, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { History, LogEntry, SettingKey, Settings } from "@/app/types";


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const EVENT_SOURCE_URL = `${BASE_URL}/logs/stream`;

let _es: EventSource|null = null;

const getEventSource = () => {
    if (_es == null) {
        _es = new EventSource(EVENT_SOURCE_URL);
    }
    
    return _es;
}

const isLogEntry = (data: any): data is LogEntry => {
    return "level" in data && typeof data.level === "string" &&
    "receivedAt" in data && typeof data.receivedAt === "number" &&
    "message" in data && typeof data.message === "string" &&
    (!("timestamp" in data) || (data.timestamp == null || typeof data.timestamp === "number")) &&
    (!("ms" in data) || (data.ms == null || typeof data.ms === "number")) &&
    ((data.timestamp != null && data.ms == null) || (data.timestamp == null && data.ms != null));
};

export const logsApi = createApi({
    reducerPath: "logs",
    baseQuery: fakeBaseQuery(),
    tagTypes: [
        "Setting",
    ],
    endpoints: (builder) => ({
        getLogs: builder.query<{
            entries: LogEntry[];
            isConnected: boolean;
        }, void>({
            queryFn: () => ({data: {
                entries: [] as LogEntry[],
                isConnected: false,
            }}),
            async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
                const connect = async () => {
                    const eventSource = new EventSource(EVENT_SOURCE_URL)
                    const messageHandler = ({ data }: MessageEvent<string>) => {
                        const parsed = JSON.parse(data);
                        if (isLogEntry(parsed)) {
                            updateCachedData((draft) => {
                                draft.entries.push(parsed);
                            });
                        }
                        else {
                            console.error("Received an invalid log entry from stream:", parsed);
                        }
                    };
                    
                    const openHandler = () => {
                        updateCachedData((draft) => {
                            draft.isConnected = true;
                        });
                    };
    
                    const errorHandler = () => {
                        updateCachedData((draft) => {
                            draft.isConnected = false;
                        });
                        eventSource.close();
                        setTimeout(connect, 3000);
                    };
                    
                    try {
                        await cacheDataLoaded;
                        
                        eventSource.addEventListener("message", messageHandler);
                        eventSource.addEventListener("open", openHandler);
                        eventSource.addEventListener("error", errorHandler);
                    }
                    catch (ex) {
                        console.error("Error setting up listener for log stream:", ex);
                    }
                    
                    await cacheEntryRemoved;
                    eventSource.removeEventListener("message", messageHandler);
                    eventSource.removeEventListener("open", openHandler);
                    eventSource.removeEventListener("error", errorHandler);
                };

                await connect();
            },
        }), 
    }),
});

export const { useGetLogsQuery } = logsApi;
