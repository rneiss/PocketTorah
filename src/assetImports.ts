import { Asset } from "expo-asset";
import { BookName } from "./leyning";
import type { TropeType } from "./trope";

const DATA_URL = __webpack_public_path__ + "data";
const jsonCache = new Map<string, Promise<any>>();
const loadJson = async (path: string): Promise<any> => {
  let prom = jsonCache.get(path);
  if (prom != null) return prom;
  prom = fetch(DATA_URL + path).then((r) => (r.status === 404 ? null : r.json()));
  jsonCache.set(path, prom);
  return prom;
};

export type Book = string[][][];
export type TransBook = { text: string[][] };
type Labels = Record<string, number[]>;

const spToSnake = (s: string) => s.replace(" ", "_");

export const getBook = (book: BookName): Promise<Book> =>
  loadJson(`/torah/json/${spToSnake(book)}.json`);
export const getTransBook = (book: BookName): Promise<TransBook> =>
  loadJson(`/torah/translation/${book}.json`);
export const getLabels = (book: BookName): Promise<Labels> =>
  loadJson(`/torah/labels/${book}.json`);

type VerseAudioIndex = { reg?: 1 | 0; sof?: 1 | 0 };
type AudioIndex = {
  [book: string]: {
    [ch: number]: [1 | 0 | VerseAudioIndex] | { [v: number]: VerseAudioIndex };
  };
};
export const loadAudioIndex = (): Promise<AudioIndex> =>
  loadJson("/audio/index.json").then((x: object) =>
    Object.fromEntries(Object.entries(x).map(([k, v]) => [k.replace("_", " "), v])),
  );
export const getAudioFromIndex = (
  index: AudioIndex,
  book: BookName,
  [ch, v]: [number, number],
): { reg?: 1 | 0; sof?: 1 | 0 } => {
  const name = book.replace("_", " ");
  const chapter = index[name]?.[ch];
  if (!chapter) return {};
  if (Array.isArray(chapter)) {
    const src = chapter[v];
    return typeof src === "object" ? src : { reg: src };
  } else {
    return chapter[v] ?? { reg: 1 };
  }
};
export const getAudio = (book: BookName, [ch, v]: [number, number], sof: boolean): Asset =>
  Asset.fromURI(
    `${DATA_URL}/audio/${book.replace(" ", "_")}/${ch + 1}_${v + 1}${sof ? "-SA" : ""}.mp3`,
  );

// export

export const hebFont = "Taamey_D";
export const tikkunFont = "StamAshkenazCLM";

export const getTropeAudio = (type: TropeType, trope: string): Asset =>
  Asset.fromURI(`${DATA_URL}/trope/audio/${type}-${trope}.mp3`);

type TropeText = {
  title: string;
  tropes: { [trope: string]: { name_he: string; text: string[][] } };
};
export const getTropeText = (type: TropeType): TropeText =>
  require(`../data/trope/text/${type}.json`);

export const getTropeLabels = (type: TropeType): Labels =>
  require(`../data/trope/labels/${type}.json`);
