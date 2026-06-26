"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import MoistureChart from "@/app/components/Dashboard/MoistureChart";
import Settings from "@/app/components/Dashboard/Settings";
import { getLastHeartbeat } from "@/app/redux/selectors/heartbeat";
import styles from "./Dashboard.module.scss";
import { LogViewer } from "@/app/components/Dashboard/LogViewer";
import { DashboardItem } from "@/app/components/Dashboard/DashboardItem";


enum HeartbeatStatus {
  UNKNOWN,
  GOOD,
  WARN,
  ERROR,
}

const heartbeatPollIntervalMs = process.env.NEXT_PUBLIC_HEARTBEAT_POLL_INTERVAL_MS ?
  Number(process.env.NEXT_PUBLIC_HEARTBEAT_POLL_INTERVAL_MS) :
  60000;

const heartbeatAgeWarningThresholdMs = heartbeatPollIntervalMs * 2;

const heartbeatAgeErrorThresholdMs = heartbeatPollIntervalMs * 4;

const HeartbeatStatusIndicator = (
  {
    status,
  }: {
    status: HeartbeatStatus;
  }
) => {
  const classes = [styles.heartbeatStatusIndicator,];

  switch (status) {
    case HeartbeatStatus.UNKNOWN:
      classes.push(styles.hearbeatStatus_unknown);
      break;
    case HeartbeatStatus.GOOD:
      classes.push(styles.hearbeatStatus_good);
      break;
    case HeartbeatStatus.WARN:
      classes.push(styles.hearbeatStatus_warn);
      break;
    case HeartbeatStatus.ERROR:
      classes.push(styles.hearbeatStatus_error);
      break;
    default:
      throw new Error(`Unknown heartbeat status: ${status}`);
  }

  const title = useMemo(() => {
    let title = "Connection with board: ";

    switch (status) {
      case HeartbeatStatus.UNKNOWN:
        title += "Unknown";
        break;
      case HeartbeatStatus.GOOD:
        title += "Good";
        break;
      case HeartbeatStatus.WARN:
        title += "Warning";
        break;
      case HeartbeatStatus.WARN:
        title += "Warning";
        break;
      case HeartbeatStatus.ERROR:
        title += "Error";
        break;
    }

    return title;
  }, [
    status
  ]);

  return (
    <div
      className={classes.join(" ")}
      title={title}
    >
    </div>
  );
};

export const Dashboard = () => {
  const {data: lastHeartbeat} = useSelector(getLastHeartbeat);

  const heartbeatStatus = useMemo(() => {
    if (!lastHeartbeat) {
      return HeartbeatStatus.UNKNOWN;
    }

    const heartbeatAge = Date.now() - lastHeartbeat;

    if (heartbeatAge < heartbeatAgeWarningThresholdMs) {
      return HeartbeatStatus.GOOD;
    }

    if (heartbeatAge < heartbeatAgeErrorThresholdMs) {
      return HeartbeatStatus.WARN;
    }

    return HeartbeatStatus.ERROR;
  }, [
    lastHeartbeat,
  ]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <HeartbeatStatusIndicator
          status={heartbeatStatus}
        />
      </header>
      <div
        className={styles.dashboardBody}
      >
        {/* <p>Last synced: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Never'}</p> */}

        <MoistureChart
        />
        <Settings
        />
        <LogViewer
          maxEntries={300}
        />
      </div>
    </div>
  );
};
