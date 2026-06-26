import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { History, SettingKey, Settings } from "@/app/types";


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api`, }),
    tagTypes: [
        "Setting",
    ],
    endpoints: (builder) => ({
        getHistory: builder.query<{history: History, lastSyncTimestamp: number}, void>({
            query: () => '/history',
        }),

        getSettings: builder.query<{settings: Settings, lastSyncTimestamp: number}, void>({
            query: () => '/settings',
            providesTags: (result) => result?.settings ? Object.keys(result.settings).map((key) => ({type: "Setting", key})) : [],
        }),

        updateSetting: builder.mutation<Settings, {key: SettingKey, value: number}>({
            query: ({key, value}) => ({
                url: `/settings/${key}`,
                method: "POST",
                body: JSON.stringify(value),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            invalidatesTags: (_, error, {key}) => (error ? [] : [
                {type: "Setting", key}
            ]),
        }),

        getLastHeartbeat: builder.query<number, void>({
            query: () => 'heartbeat',
        }),
    }),
});

export const {
    useGetHistoryQuery,
    useGetSettingsQuery,
    useUpdateSettingMutation,
    useGetLastHeartbeatQuery,
} = api;