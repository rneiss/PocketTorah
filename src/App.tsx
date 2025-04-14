/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { createContext, useContext, useMemo, useState } from "react";
import { Button, ScrollView, StyleProp, ViewStyle, useColorScheme } from "react-native";

import {
  LinkingOptions,
  NavigationContainer,
  getPathFromState,
  getStateFromPath,
} from "@react-navigation/native";
import {
  StackNavigationProp,
  StackScreenProps,
  createStackNavigator,
} from "@react-navigation/stack";

import { HDate } from "@hebcal/core";
import { NUM_VERSES, formatAliyahShort, makeSummaryFromParts } from "@hebcal/leyning";

import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import useFonts from "../fonts";
import { AboutScreen } from "./AboutScreen";
import { CalendarLeyningSelectScreen, CalendarScreen } from "./CalendarScreen";
import { PlayViewScreen } from "./PlayViewScreen";
import { PlaySettings, SettingsModal } from "./SettingsScreen";
import { fixReadingId, getLeyning } from "./leyning";
import { SettingsProvider, useSettings } from "./settings";
import { CustomButton, HeaderContainer, Text, useNavigationTheme } from "./theming";
import { TropePhrases, TropePlayScreen, TropeSelectScreen, TropeType } from "./trope";
import { boolQuery, useScreenOptions, useScreenTitle } from "./utils";

function HomeScreen({ navigation }: ScreenProps<"Home">) {
  const { navigate } = navigation;

  return (
    <ScrollView>
      <CustomButton
        onPress={() => navigate("TorahReadingsScreen")}
        buttonTitle="List of Torah Readings"
      />
      <CustomButton
        onPress={() => {
          const hdate = new HDate();
          // const hdate = new HDate(28, "elul", 5783);
          // const hdate = new HDate(28, 'Tamuz', 5795);
          // const hdate = new HDate(19, 'Tishrei', 5783);
          const saturday = hdate.onOrAfter(6);
          navigate("AliyahSelectScreen", { readingId: dateToStr(saturday.greg()) });
        }}
        buttonTitle="This Week's Torah Readings"
      />
      <CustomButton onPress={() => navigate("Calendar")} buttonTitle="Calendar of Readings" />
      <CustomButton onPress={() => navigate("TropePhrases")} buttonTitle="Tropes" />
      <CustomButton onPress={() => navigate("Settings")} buttonTitle="Settings" />
      <CustomButton onPress={() => navigate("About")} buttonTitle="About this App" />
    </ScrollView>
  );
}

function TorahReadingsScreen({ navigation }: ScreenProps<"TorahReadingsScreen">) {
  const { navigate } = navigation;

  //create button for each parsha
  const content = allParshiot.map((parshah) => (
    <CustomButton
      key={parshah}
      buttonTitle={parshah}
      onPress={() => navigate("AliyahSelectScreen", { readingId: parshah })}
    />
  ));

  return <ScrollView>{content}</ScrollView>;
}

function AliyahSelectScreen({ navigation, route }: ScreenProps<"AliyahSelectScreen">) {
  const readingId = fixReadingId(route.params.readingId);
  const [{ tri: settingsTri, il }] = useSettings();
  const tri = boolQuery(route.params.tri) ?? settingsTri;

  const reading = useMemo(() => getLeyning(readingId, { tri, il }), [readingId, tri, il]);
  if (!reading)
    return (
      <ScrollView>
        <Text>Bad reading id</Text>
      </ScrollView>
    );

  useScreenTitle(navigation, reading.name.en ?? "404");

  const [modalVisible, setModalVisible] = useState(false);

  useScreenOptions(navigation, {
    headerRight: () => (
      <HeaderContainer>
        <Button title="Settings" onPress={() => setModalVisible(true)} />
      </HeaderContainer>
    ),
  });

  const kriyah = reading.aliyot;
  const namePrefix = reading.kind === "weekday" ? "Weekday " : "";
  const special = !reading.parsha;

  const aliyot =
    kriyah &&
    aliyahNums.flatMap((num) => {
      const summary =
        num in kriyah
          ? formatAliyahShort(kriyah[num], special || kriyah[num].k != kriyah[1].k)
          : num === "H" && reading.haftara
          ? makeSummaryFromParts(reading.haftara)
          : null;
      return summary ? [{ num, title: `${namePrefix}${aliyahName(num)}: ${summary}` }] : [];
    });
  const megillah =
    reading.megillahName &&
    NUM_VERSES[reading.megillahName].slice(1).map((_, i) => ({
      num: `Megillah${i + 1}` as const,
      title: `${reading.megillahName} ${i + 1}`,
    }));

  const content = [...(aliyot || []), ...(megillah || [])].map(({ num, title }) => (
    <CustomButton
      key={num}
      onPress={() =>
        navigation.navigate("PlayViewScreen", {
          readingId,
          aliyah: num,
          tri: route.params.tri === null ? "1" : route.params.tri,
        })
      }
      buttonTitle={title}
    />
  ));
  return (
    <ScrollView>
      <SettingsModal {...{ modalVisible, setModalVisible }} audio={null} />
      {content}
    </ScrollView>
  );
}

const pluralRules = new Intl.PluralRules(undefined, { type: "ordinal" });
pluralRules.select(1);
const ordinals: { [k in Intl.LDMLPluralRule]: string } = {
  zero: "th",
  one: "st",
  two: "nd",
  few: "rd",
  many: "th",
  other: "th",
};
export const aliyahName = (num: Exclude<AliyahNum, `M${number}`>) =>
  num === "M"
    ? "Maftir Aliyah"
    : num == "H"
    ? "Haftarah"
    : `${num}${ordinals[pluralRules.select(Number(num))]} Aliyah`;

export const isMegillahVerse = (num: AliyahNum): num is `Megillah${number}` =>
  num.startsWith("Megillah");

export const extractMegillahVerse = (num: `Megillah${number}`) =>
  Number(num.slice("Megillah".length));

export const dateToStr = (date: HDate | Date) =>
  `${date.getFullYear()}-${
    date.getMonth() + (HDate.isHDate(date) ? 0 : 1)
  }-${date.getDate()}` as const;

export const dateFromStr = (str: string): HDate | null => {
  const x = /^(\d+)-(\d+)-(\d+)$/.exec(str);
  if (!x) return null;
  const [y, m, d] = [+x[1], +x[2], +x[3]];
  return y < 3000 ? new HDate(new Date(y, m - 1, d)) : new HDate(d, m, y);
};

export type Parshah = (typeof allParshiot)[number];
export const isParshah = (x: string): x is Parshah =>
  (allParshiot as readonly string[]).includes(x);
const allParshiot = [
  "Bereshit",
  "Noach",
  "Lech-Lecha",
  "Vayera",
  "Chayei Sara",
  "Toldot",
  "Vayetzei",
  "Vayishlach",
  "Vayeshev",
  "Miketz",
  "Vayigash",
  "Vayechi",
  "Shemot",
  "Vaera",
  "Bo",
  "Beshalach",
  "Yitro",
  "Mishpatim",
  "Terumah",
  "Tetzaveh",
  "Ki Tisa",
  "Vayakhel",
  "Pekudei",
  "Vayikra",
  "Tzav",
  "Shmini",
  "Tazria",
  "Metzora",
  "Achrei Mot",
  "Kedoshim",
  "Emor",
  "Behar",
  "Bechukotai",
  "Bamidbar",
  "Nasso",
  "Beha'alotcha",
  "Sh'lach",
  "Korach",
  "Chukat",
  "Balak",
  "Pinchas",
  "Matot",
  "Masei",
  "Devarim",
  "Vaetchanan",
  "Eikev",
  "Re'eh",
  "Shoftim",
  "Ki Teitzei",
  "Ki Tavo",
  "Nitzavim",
  "Vayeilech",
  "Ha'azinu",
  "Vezot Haberakhah",
] as const;

const SettingsScreen = ({ navigation }: ScreenProps<"Settings">) => (
  <PlaySettings
    closeSettings={() => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("Home");
    }}
    setAudioSpeed={() => {}}
  />
);

type Params = {
  Home: undefined;
  About: undefined;
  Settings: undefined;
  TorahReadingsScreen: undefined;
  Calendar: undefined;
  CalendarLeyningSelect: { date: `${number}-${number}-${number}` };
  AliyahSelectScreen: {
    readingId: ReadingId;
    tri?: "1" | "0" | null;
  };
  PlayViewScreen: {
    readingId: ReadingId;
    aliyah: AliyahNum;
    tri?: "1" | "0" | null;
  };
  TropePhrases: undefined;
  TropeSelectScreen: { tropeType: TropeType };
  TropePlayScreen: { tropeType: TropeType; trope: string };
};
type FestivalKey = string;
export type ReadingId = Parshah | FestivalKey | `${number}-${number}-${number}`;
const aliyahNums = ["1", "2", "3", "4", "5", "6", "7", "M", "H"] as const;
export type AliyahNum = (typeof aliyahNums)[number] | `Megillah${number}`;
export type ScreenProps<RouteName extends keyof Params> = StackScreenProps<Params, RouteName>;
export type NavigationProp = StackNavigationProp<Params>;

const Stack = createStackNavigator<Params>();

const linkingConfig: LinkingOptions<Params>["config"] = {
  screens: {
    Home: "/",
    About: "/about",
    Settings: "/settings",
    TorahReadingsScreen: "/books",
    Calendar: "/calendar",
    CalendarLeyningSelect: "/calendar/:date",
    AliyahSelectScreen: "/reading/:readingId",
    PlayViewScreen: "/reading/:readingId/:aliyah",
    TropePhrases: "/tropes",
    TropeSelectScreen: "/tropes/:tropeType",
    TropePlayScreen: "/tropes/:tropeType/:trope",
  },
};
const linking: LinkingOptions<Params> = {
  prefixes: [],
  config: linkingConfig,
  getStateFromPath: (path, options) => {
    const config = getStateFromPath(rmPrefix(path), options);
    if (config) {
      for (const route of config.routes) {
        if (route.path != null) (route as any).path = addPrefix(route.path);
      }
    }
    return config;
  },
  getPathFromState: (state, options) => {
    return addPrefix(getPathFromState(state, options));
  },
};
const baseUrl = "/PocketTorah/";
const urlPrefix = "?";
const rmPrefix = (s: string) => {
  if (s.startsWith(baseUrl)) s = s.slice(baseUrl.length);
  s ||= "/";
  return s.startsWith(urlPrefix) ? "/" + s.slice(urlPrefix.length) : s;
};
const addPrefix = (s: string) =>
  s === "/" ? baseUrl : s.startsWith(baseUrl + urlPrefix) ? s : baseUrl + urlPrefix + s.slice(1);

const App = () => {
  useFonts();
  const insets = useSafeAreaInsets();
  const cardStyle: StyleProp<ViewStyle> = {
    maxHeight: "100%",
    paddingTop: insets.top,
    paddingRight: insets.right,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
  };
  const navTheme = useNavigationTheme();
  return (
    <NavigationContainer
      linking={linking}
      theme={navTheme}
      documentTitle={{
        formatter: (options, route) => `PocketTorah - ${options?.title ?? route?.name}`,
      }}
    >
      <Stack.Navigator initialRouteName="Home" screenOptions={{ cardStyle }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="TorahReadingsScreen"
          component={TorahReadingsScreen}
          options={{ title: "Torah Readings" }}
        />
        <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} />
        <Stack.Screen name="PlayViewScreen" component={PlayViewScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="CalendarLeyningSelect" component={CalendarLeyningSelectScreen} />
        <Stack.Screen name="TropePhrases" component={TropePhrases} />
        <Stack.Screen name="TropeSelectScreen" component={TropeSelectScreen} />
        <Stack.Screen name="TropePlayScreen" component={TropePlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default () => (
  <SettingsProvider>
    <DarkModeProvider>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </DarkModeProvider>
  </SettingsProvider>
);

const DarkModeProvider = ({ children }: React.PropsWithChildren) => {
  const [{ colorTheme }] = useSettings();
  const nativeColorScheme = useColorScheme();
  const colorScheme = colorTheme === "auto" ? nativeColorScheme : colorTheme;
  const dark = colorScheme === "dark";
  return <DarkMode.Provider value={dark} children={children} />;
};

const DarkMode = createContext(false);

export const useDarkMode = () => useContext(DarkMode);
