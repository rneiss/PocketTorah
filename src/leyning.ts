import { HDate, ParshaEvent } from "@hebcal/core";
import {
  Aliyah as Aliyah_,
  LeyningNames,
  LeyningParshaHaShavua,
  LeyningShabbatHoliday,
  LeyningWeekday,
  getLeyningOnDate as getFullLeyningOnDate,
  getLeyningForHolidayKey,
  getLeyningForParsha,
} from "@hebcal/leyning";
import {
  Triennial,
  TriennialAliyot,
  getTriennial,
  getTriennialForParshaHaShavua,
} from "@hebcal/triennial";
import { ReadingId, dateFromStr, isParshah } from "./App";
import { ensureArrayOrNull } from "./utils";

export type TorahBookName = "Genesis" | "Exodus" | "Leviticus" | "Numbers" | "Deuteronomy";
export type ProphetName =
  | "Amos"
  | "Ezekiel"
  | "Habakkuk"
  | "Hosea"
  | "II Kings"
  | "II Samuel"
  | "I Kings"
  | "I Samuel"
  | "Isaiah"
  | "Jeremiah"
  | "Joel"
  | "Jonah"
  | "Joshua"
  | "Judges"
  | "Malachi"
  | "Micah"
  | "Obadiah"
  | "Zechariah";
export type MegillahName = "Ruth" | "Esther" | "Lamentations" | "Song of Songs" | "Ecclesiastes";
export type KatuvName = MegillahName | "Daniel";
export type BookName = TorahBookName | ProphetName | KatuvName;

export type Aliyah<Book extends BookName = BookName> = Aliyah_ & { k: Book };
export type AliyotMap<Book extends BookName = BookName> = { [key: string]: Aliyah<Book> };

export type Reading = {
  name: LeyningNames;
  kind: "shabbat" | "chag" | "weekday" | "mincha";
  parsha?: string[];
  aliyot?: AliyotMap<TorahBookName>;
  haftara: Aliyah<ProphetName>[] | null;
  megillah?: AliyotMap;
  megillahName?: MegillahName;
  summary: string;
};

type KeysOfUnion<T> = T extends any ? keyof T : never;
type ValuesOfUnion<T, K> = T extends any ? (K extends keyof T ? T[K] : undefined) : never;
const getIfPresent = <T extends object, K extends KeysOfUnion<T>>(
  obj: T,
  key: K,
): ValuesOfUnion<T, K> => (key in obj ? obj[key] : undefined) as ValuesOfUnion<T, K>;

const leyningToReading = (
  leyning: LeyningParshaHaShavua | LeyningShabbatHoliday | LeyningWeekday,
): Reading => {
  const aliyot = getIfPresent(leyning, "fullkriyah") ?? getIfPresent(leyning, "weekday");
  const haftara = ensureArrayOrNull(getIfPresent(leyning, "haft") ?? null);
  const megillah = getIfPresent(leyning, "megillah");
  return {
    name: leyning.name,
    kind: leyning.name.en.includes("Mincha")
      ? "mincha"
      : !getIfPresent(leyning, "parsha")
      ? "chag"
      : "fullkriyah" in leyning && leyning.fullkriyah
      ? "shabbat"
      : "weekday",
    parsha: getIfPresent(leyning, "parsha") ?? undefined,
    aliyot: aliyot as AliyotMap<TorahBookName> | undefined,
    haftara: haftara as Aliyah<ProphetName>[] | null,
    megillah: megillah as AliyotMap<MegillahName>,
    megillahName: megillah?.[1]?.k as MegillahName | undefined,
    summary: leyning.summary,
  };
};
const triennialToReading = (baseReading: Reading, triennial: TriennialAliyot): Reading => ({
  ...baseReading,
  aliyot: (triennial.aliyot as AliyotMap<TorahBookName> | undefined) ?? baseReading.aliyot,
  haftara: ensureArrayOrNull(triennial.haft ?? baseReading.haftara) as Aliyah<ProphetName>[] | null,
});

export function getLeyningOnDate(
  hdate: HDate,
  { tri, il }: { tri: boolean; il: boolean },
): Reading | undefined {
  const leyning = getFullLeyningOnDate(hdate, il);
  const reading = leyning && leyningToReading(leyning);
  if (tri && reading?.kind === "shabbat" && hdate.getFullYear() >= 5745) {
    const ev = new ParshaEvent(hdate, reading.parsha!, il);
    const triennial = getTriennialForParshaHaShavua(ev, il) as TriennialAliyot;
    return triennialToReading(reading, triennial);
  }
  return reading;
}

export function getLeyningsOnDate(
  hdate: HDate,
  { tri, il }: { tri: boolean; il: boolean },
): Reading[] {
  const leynings = getFullLeyningOnDate(hdate, il, true).flatMap((l) => {
    if (l.name.en.includes("(Mincha)")) {
      const altKey = l.name.en.replace("(Mincha)", "(Mincha, Alternate)");
      const alt = getLeyningForHolidayKey(altKey, undefined, il);
      if (alt) {
        const tradKey = l.name.en.replace("(Mincha)", "(Mincha, Traditional)");
        return [getLeyningForHolidayKey(tradKey, undefined, il) ?? l, alt];
      }
    }
    return [l];
  });
  return leynings.map((leyning) => {
    const reading = leyningToReading(leyning);
    if (tri && reading.parsha && hdate.getFullYear() >= 5745) {
      const ev = new ParshaEvent(hdate, reading.parsha, il);
      const triennial = getTriennialForParshaHaShavua(ev, il) as TriennialAliyot;
      return triennialToReading(reading, triennial);
    }
    return reading;
  });
}

export const fixReadingId = (x: ReadingId): ReadingId =>
  isParshah(x) ? x : (decodeURIComponent(x) as ReadingId);
export const getLeyning = (
  readingId: ReadingId,
  { tri, il }: { tri: boolean; il: boolean },
): Reading | undefined => {
  if (isParshah(readingId)) {
    const leyning = leyningToReading(getLeyningForParsha(readingId));
    if (tri) {
      // TODO: be more configurable wrt the year
      const year = new HDate().getFullYear();
      const triennial = getTriennial(year, il).getReading(
        readingId,
        Triennial.getYearNumber(year) - 1,
      );
      return triennialToReading(leyning, triennial);
    } else {
      return leyning;
    }
  }
  const d = dateFromStr(readingId);
  if (d) return getLeyningOnDate(d, { tri, il });
  const leyning = getLeyningForHolidayKey(readingId, undefined, il);
  return leyning && leyningToReading(leyning);
};
