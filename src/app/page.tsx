import React from "react";
import StoreProvider from "@/app/components/StoreProvider";
import styles from "@/app/page.module.css";
import Dashboard from "@/app/components/Dashboard";

export default async function Home() {
  return (
    <React.StrictMode>
      <StoreProvider
      >
        <div className={styles.page}>
          <main className={styles.main}>
            <Dashboard />
          </main>
        </div>
      </StoreProvider>
    </React.StrictMode>
  );
}
