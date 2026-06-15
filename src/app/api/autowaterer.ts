import { HistoryEntry } from "@/app/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


export const getHistory = async (
  {
    limit,
  }: {
    limit?: number;
  } = {}
) => {
  try {
    let url = `${BASE_URL}/api/history`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    const {history, lastSyncTimestamp} = await response.json() as { history: HistoryEntry[]; lastSyncTimestamp: number | null };
    return { history, lastSyncTimestamp };
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export const syncHistory = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to sync history');
    }
    await response.json();
    console.log('History synced successfully.');
  } catch (error) {
    console.error('Error syncing history:', error);
    throw error;
  }
};

export const getLastHistorySyncTimestamp = async (): Promise<number | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/sync`);
    if (!response.ok) {
      throw new Error('Failed to fetch last history sync timestamp');
    }
    const timestamp = await response.json() as number | null;
    return timestamp;
  } catch (error) {
    console.error('Error fetching last history sync timestamp:', error);
    return null;
  }
};

export const getSettings = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    const {settings, lastSettingsSyncTimestamp} = (await response.json()) as { settings: Record<string, number>; lastSettingsSyncTimestamp: number | null };
    return {settings, lastSettingsSyncTimestamp};
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};