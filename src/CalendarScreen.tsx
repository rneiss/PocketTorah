import { HDate } from "@hebcal/core";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";
import { toMarkingFormat } from "react-native-calendars/src/interface";
import { MarkedDates } from "react-native-calendars/src/types";
import { dateFromStr, dateToStr, ScreenProps } from "./App";
import { fixReadingId, getLeyningsOnDate, Reading } from "./leyning";
import { useSettings } from "./settings";
import { CustomButton, useCalendarTheme } from "./theming";
import { useScreenTitle } from "./utils";

export function CalendarScreen({ navigation }: ScreenProps<"Calendar">) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [{ tri, il }] = useSettings();
  const theme = useCalendarTheme();
  type FuncOnly<F extends (...args: any) => any> = (...args: Parameters<F>) => ReturnType<F>;
  const Calend: FuncOnly<typeof Calendar> = Calendar;
  return (
    <Calend
      theme={theme}
      markingType="multi-dot"
      disableAllTouchEventsForDisabledDays
      disableAllTouchEventsForInactiveDays
      disabledByDefault
      markedDates={{
        [toMarkingFormat(new Date())]: { inactive: true },
        ...getMarkedDates(year, { tri, il }),
      }}
      onMonthChange={({ month, year }) => {
        setYear(year);
        if (month <= 2) Promise.resolve().then(() => fillMarkedDatesCache(year - 1, { tri, il }));
        else if (month >= 11)
          Promise.resolve().then(() => fillMarkedDatesCache(year + 1, { tri, il }));
      }}
      onDayPress={({ year, month, day }) => {
        const date = new Date(year, month - 1, day);
        const dateStr = dateToStr(date);
        if (getLeyningsOnDate(new HDate(date), { tri, il }).length > 1) {
          navigation.navigate("CalendarLeyningSelect", { date: dateStr });
        } else {
          navigation.navigate("AliyahSelectScreen", { readingId: dateStr });
        }
      }}
    />
  );
}
type MarkedCache = {
  markedYears: Set<number>;
  markedDates: MarkedDates;
};
const markedCache: { [k in `${boolean}-${boolean}`]?: MarkedCache } = Object.create(null);
const fillMarkedDatesCache = (
  year: number,
  { tri, il }: { tri: boolean; il: boolean },
): MarkedDates => {
  const { markedYears, markedDates } = (markedCache[`${tri}-${il}`] ??= {
    markedYears: new Set(),
    markedDates: {},
  });
  if (markedYears.has(year)) return markedDates;
  markedYears.add(year);
  const endDate = new HDate(new Date(year, 11, 31));
  for (
    let date = new HDate(new Date(year, 0, 1));
    date.abs() <= endDate.abs();
    date = date.next()
  ) {
    const l = getLeyningsOnDate(date, { tri, il });
    if (l.length) {
      markedDates[toMarkingFormat(date.greg())] = leyningToProps(l);
    }
  }
  return markedDates;
};
const leyningToProps = (leynings: Reading[]): MarkingProps => ({
  marked: true,
  disabled: false,
  dots: leynings.map((leyning) => ({
    color: { chag: "red", weekday: "green", shabbat: "darkblue", mincha: "orange" }[leyning.kind],
  })),
});
const getMarkedDates = (year: number, { tri, il }: { tri: boolean; il: boolean }) => {
  const markedDates = fillMarkedDatesCache(year, { tri, il });
  return { ...markedDates };
};

export function CalendarLeyningSelectScreen({
  navigation,
  route,
}: ScreenProps<"CalendarLeyningSelect">) {
  const dateStr = fixReadingId(route.params.date);
  const date = dateFromStr(dateStr);
  const [{ tri, il }] = useSettings();
  useScreenTitle(navigation, `Leynings on ${dateStr}`);
  const content =
    date == null
      ? []
      : getLeyningsOnDate(date, { tri, il }).map((leyning) => (
          <CustomButton
            key={leyning.name.en}
            onPress={() =>
              navigation.navigate("AliyahSelectScreen", { readingId: leyning.name.en })
            }
            buttonTitle={`${leyning.name.en} (${leyning.summary})`}
          />
        ));
  return <ScrollView>{content}</ScrollView>;
}
