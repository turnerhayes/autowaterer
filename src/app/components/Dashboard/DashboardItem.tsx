import { ReactNode, useCallback, useState } from "react";

import styles from "./DashboardItem.module.scss";


export const DashboardItem = (
    {
        children,
        controls,
        title,
        className,
    }: {
        children: ReactNode|ReactNode[];
        controls?: ReactNode;
        title: string;
        className?: string;
    }
) => {
    const [minimized, setMinimized] = useState(false);
    const handleToggleMinimized = useCallback(() => {
        setMinimized((minimized) => !minimized);
    }, []);

    return (
        <div
            className={`${styles.root}${className ? " " + className : ""}`}
        >
            <header
                className={styles.header}
            >
                <div
                    className={styles.titleRow}
                >
                    <h3>{title}</h3>
                    <button
                        className={styles.toggleMinimizeButton}
                        onClick={handleToggleMinimized}
                    >
                        {minimized ? "+" : "-"}
                    </button>
                </div>
                {
                    controls ? (
                        <div
                            className={`${styles.controls}${minimized ? " " + styles.hidden : ""}`}
                        >
                            {controls}
                        </div>
                    ) : null
                }
            </header>
            <div
                className={minimized ? styles.hidden : ""}
            >
                {children}
            </div>
        </div>
    )
};