import { ChangeEvent, Fragment, useCallback } from "react";
import { useAppSelector } from "@/app/redux/redux";
import { getSettings } from "@/app/redux/selectors/settings";
import { ReadableSettingKeyMap, SettingKey, SettingUnits, Settings as ISettings } from "@/app/types";

import styles from "./Settings.module.scss";
import { useUpdateSettingMutation } from "@/app/api/api";
import { DashboardItem } from "@/app/components/Dashboard/DashboardItem";
// import { updateSetting } from "@/app/redux/slices/settings";


interface SettingInputProps {
    settingKey: SettingKey;
    currentValue: number;
    onChange: <K extends SettingKey>(key: K, value: ISettings[K]) => void;
}

const SettingInput = (
    {
        settingKey,
        currentValue,
        onChange,
    }: SettingInputProps
) => {
    const handleChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
        const valStr: string = ev.target.value;

        if (!valStr) {
            return;
        }

        const val = Number(valStr);

        if (Number.isNaN(val)) {
            return;
        }

        onChange(settingKey, val);
    }, [
        settingKey,
        onChange,
    ]);

    switch (settingKey) {
        case "checkIntervalMs":
            return (
                <input
                    type="number"
                    value={currentValue}
                    onChange={handleChange}
                    min={0}
                    step={1}
                />
            );
        case "lockoutMs":
            return (
                <input
                    type="number"
                    value={currentValue}
                    onChange={handleChange}
                    min={0}
                    step={1}
                />
            );
        case "pumpDurationMs":
            return (
                <input
                    type="number"
                    value={currentValue}
                    onChange={handleChange}
                    min={0}
                    step={1}
                />
            );
        case "thresholdPct":
            return (
                <input
                    type="number"
                    value={currentValue}
                    onChange={handleChange}
                    min={0}
                    step={1}
                />
            );
    }
};


const Settings = () => {
    const settings = useAppSelector(getSettings);
    const [updateSetting, ] = useUpdateSettingMutation();

    const handleSettingChange = useCallback<SettingInputProps["onChange"]>((key, value) => {
        console.log("changed setting", key, "to value", value);
        updateSetting({key, value});
    }, [
        updateSetting,
    ]);

    return (
        <DashboardItem
            title="Settings"
        >
            {
                settings != undefined ? (
                    <div>
                        <dl
                            className={styles.settingsList}
                        >
                            {
                                Object.keys(settings).map(
                                    (key) => (
                                        <Fragment
                                            key={key}
                                        >
                                            <dt>
                                                {ReadableSettingKeyMap[key as SettingKey]}:
                                            </dt>
                                            <dd>
                                                <SettingInput
                                                    settingKey={key as SettingKey}
                                                    currentValue={settings[key as SettingKey]}
                                                    onChange={handleSettingChange}
                                                />{SettingUnits[key as SettingKey]}
                                            </dd>
                                        </Fragment>
                                    )
                                )
                            }
                        </dl>
                    </div>
                ) : (
                    <div>
                        Loading...
                    </div>
                )
            }
        </DashboardItem>
    );
};

export default Settings;
