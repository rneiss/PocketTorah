import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Settings {
  /** A multiplier for the size of the hebrew text */
  textSize: number;
  /** A multiplier for the speed of the audio */
  audioSpeed: number;
  /** Whether or not leyning should be for in eretz yisrael or not */
  il: boolean;
  /** Color theme */
  colorTheme: ColorTheme;
  /** Triennial reading scheme */
  tri: boolean;
}

type ColorTheme = "auto" | "light" | "dark";

const defaultSettings: Settings = {
  textSize: 1,
  audioSpeed: 1,
  il: false,
  colorTheme: "auto",
  tri: false,
};

const settingsFields = ["textSize", "audioSpeed", "il", "colorTheme", "tri"] as const;

type MutuallyAssignable<T extends U, U extends V, V = T> = true;
(_: MutuallyAssignable<(typeof settingsFields)[number], keyof Settings>) => {};

type SettingsContext = {
  settings: Settings;
  updateSettings: UpdateSettings;
};
export type UpdateSettings = <K extends keyof Settings>(settings: Pick<Settings, K>) => void;
const settingsContext: React.Context<SettingsContext> = React.createContext({
  settings: defaultSettings,
  updateSettings: (_settings) => {},
});

const KEY = "settings";
export const SettingsProvider = ({ children }: React.PropsWithChildren) => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((res) => {
      if (res != null) {
        setSettings({ ...defaultSettings, ...JSON.parse(res) });
      }
    });
  }, []);

  const updateSettings: UpdateSettings = useCallback((settings) => {
    AsyncStorage.mergeItem(KEY, JSON.stringify(settings));
    setSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    settingsFields.map((k) => settings[k]),
  );

  return <settingsContext.Provider {...{ value, children }} />;
};

export const useSettings = (): [Settings, UpdateSettings] => {
  const { settings, updateSettings } = useContext(settingsContext);
  return [settings, updateSettings];
};
