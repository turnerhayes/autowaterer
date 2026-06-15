"use client";

import { useSelector } from "react-redux";
import { getLastSyncTimestamp } from "@/app/redux/selectors/history";
import MoistureChart from "@/app/components/Dashboard/MoistureChart";
import styles from "./Dashboard.module.scss";

export const Dashboard = () => {
  const lastSyncTimestamp = useSelector(getLastSyncTimestamp);

  return (
    <div className={styles.root}>
      <h1>Dashboard</h1>
      <div>
        <p>Last synced: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Never'}</p>

        <MoistureChart
        />
      </div>
    </div>
  );
};
