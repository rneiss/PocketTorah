import { NUM_VERSES } from "@hebcal/leyning";
import binarySearch from "binary-search";
import { AVPlaybackSource } from "expo-av";
import React, { useMemo, useState } from "react";
import * as RN from "react-native";
import { ActivityIndicator, Button, ScrollView, TouchableOpacity, View } from "react-native";
import useFonts from "../fonts";
import {
  AliyahNum,
  NavigationProp,
  ScreenProps,
  aliyahName,
  extractMegillahVerse,
  isMegillahVerse,
} from "./App";
import { SettingsModal } from "./SettingsScreen";
import {
  Book,
  TransBook,
  getAudio,
  getAudioFromIndex,
  getBook,
  getLabels,
  getTransBook,
  hebFont,
  loadAudioIndex,
  tikkunFont,
} from "./assetImports";
import { Aliyah, BookName, MegillahName, Reading, fixReadingId, getLeyning } from "./leyning";
import { useSettings } from "./settings";
import {
  CustomButton,
  Footer,
  FooterButton,
  HeaderContainer,
  Text,
  useNavigationTheme,
  useStyles,
} from "./theming";
import { TropeType } from "./trope";
import TropeIcon from "./trope-icon.svg";
import { useAudio } from "./useAudio";
import {
  Maybe,
  boolQuery,
  ensureArrayOrNull,
  usePromise,
  useScreenOptions,
  useScreenTitle,
} from "./utils";

const getReading = (leyning: Reading, num: AliyahNum) =>
  ensureArrayOrNull(
    num === "H"
      ? leyning.haftara
      : isMegillahVerse(num)
      ? leyning.megillah?.[extractMegillahVerse(num)] ?? null
      : leyning.aliyot?.[num] ?? null,
  );

const megillotToTrope: { [k in MegillahName]: TropeType } = {
  Ruth: "3megillot",
  Esther: "esther",
  Lamentations: "eicha",
  "Song of Songs": "3megillot",
  Ecclesiastes: "3megillot",
};

export function PlayViewScreen({ route, navigation }: ScreenProps<"PlayViewScreen">) {
  const { params } = route;
  const [translationOn, setTranslationOn] = useState(false);
  const [tikkunOn, setTikkunOn] = useState(false);
  const buttons = (
    <>
      <FooterButton
        key="trans"
        onPress={() => setTranslationOn((b) => !b)}
        buttonTitle={translationOn ? "Translation Off" : "Translation On"}
      />
      <FooterButton
        key="tikkun"
        onPress={() => setTikkunOn((b) => !b)}
        buttonTitle={tikkunOn ? "Tikkun Off" : "Tikkun On"}
      />
    </>
  );

  const readingId = fixReadingId(params.readingId);
  const [{ tri: settingsTri, il }] = useSettings();
  const tri = boolQuery(route.params.tri) ?? settingsTri;
  const leyning = useMemo(() => getLeyning(readingId, { tri, il }), [readingId, tri, il]);

  const aliyahString = isMegillahVerse(params.aliyah)
    ? `${leyning?.megillahName ?? "Megillah verse"} ${extractMegillahVerse(params.aliyah)}`
    : aliyahName(params.aliyah);
  useScreenTitle(navigation, leyning?.name.en?.concat(`, ${aliyahString}`) ?? "404");

  if (!leyning)
    return (
      <ScrollView>
        <Text>No reading for date</Text>
      </ScrollView>
    );

  const aliyah = useMemo(
    () => leyning && getReading(leyning, params.aliyah),
    [leyning, params.aliyah],
  );

  if (!aliyah)
    return (
      <ScrollView>
        <Text>Bad aliyah number</Text>
      </ScrollView>
    );

  const verseInfo = useMemo(() => aliyah && aliyah.map(extractVerses), [aliyah]);

  const key = params.aliyah + leyning.name.en;

  const audioPromise = useMemo(async () => {
    const sofMismatch = Array<boolean>(verseInfo.flat().length).fill(false);
    const audioIndex = await loadAudioIndex();
    const arr = verseInfo.flat().map(({ book, chapterVerse, sof }, i) => {
      let src = getAudioFromIndex(audioIndex, book, chapterVerse!);
      const [pref, fallback] = sof ? [src.sof, src.reg] : [src.reg, src.sof];
      if (pref) return getAudio(book, chapterVerse!, sof);
      if (!fallback) return null;
      sofMismatch[i] = true;
      return getAudio(book, chapterVerse!, !sof);
    });
    return noneNull(arr) ? { audioSource: arr, sofMismatch } : null;
  }, [verseInfo]);
  const { audioSource = null, sofMismatch = null } =
    usePromise(() => audioPromise, [audioPromise]) ?? {};

  const labelsPromise: Promise<number[][]> = useMemo(async () => {
    if (!(await audioPromise)) return await Promise.race([]);
    return Promise.all(
      verseInfo.flat().map(({ book, chapterVerse }) =>
        // TODO: different labels for sof/reg
        getLabels(book).then((labels) => labels[fmtChV(chapterVerse!)]),
      ),
    );
  }, [verseInfo]);

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => getBook(k as BookName))),
    [key],
  );
  const transBook_ = usePromise<TransBook[]>(
    () => Promise.all(aliyah.map(({ k }) => getTransBook(k as BookName))),
    [key],
  );

  const transBook = translationOn ? transBook_ : undefined;

  let v_i = 0;
  const verses =
    book && transBook !== null
      ? verseInfo.flatMap((verses, i) =>
          verses.map((verse) => getVerseData(verse, book[i], transBook?.[i], sofMismatch?.[v_i++])),
        )
      : null;

  const tropes: TropeType =
    params.aliyah === "H"
      ? "haftarah"
      : params.readingId.match(/Rosh Hashana|Yom Kippur/i)
      ? "hhd"
      : isMegillahVerse(params.aliyah) && leyning.megillahName
      ? megillotToTrope[leyning.megillahName]
      : "torah";
  return (
    <PlayView
      audioLabels={labelsPromise}
      tikkun={tikkunOn}
      {...{ verses, tropes, audioSource, buttons, navigation }}
    />
  );
}

function noneNull<T>(arr: readonly T[]): arr is NonNullable<T>[] {
  return arr.every((v) => v != null);
}
const range = (n: number): null[] => Array(n).fill(null);

function slice<T>(arr: T[], start: number, end: number): T[] {
  if (start === 0 && end === arr.length) return arr;
  return arr.slice(start, end);
}

const extractVerses = <Book extends BookName>(aliyah: Aliyah<Book>): Verse<Book>[] => {
  // these values are 0-indexed and **inclusive**
  const [begChapter, begVerse] = parseChV(aliyah.b);
  const [endChapter, endVerse] = parseChV(aliyah.e);
  const ret = NUM_VERSES[aliyah.k].slice(1).flatMap((numV, cNum) => {
    if (cNum < begChapter || cNum > endChapter) return [];
    const verses = range(numV).map(
      (_, vNum): Verse<Book> => ({ book: aliyah.k, chapterVerse: [cNum, vNum], sof: false }),
    );
    const sliceStart = cNum === begChapter ? begVerse : 0;
    const sliceEnd = cNum === endChapter ? endVerse + 1 : verses.length;
    return slice(verses, sliceStart, sliceEnd);
  });
  ret[ret.length - 1].sof = true;
  return ret;
};

const getVerseData = <BookN extends BookName>(
  verse: Verse<BookN>,
  book: Book,
  transBook?: TransBook,
  sofAudioMismatch = false,
): VerseData<BookN> => {
  const [cNum, vNum] = verse.chapterVerse!;
  const words = book[cNum][vNum];
  return {
    ...verse,
    words,
    translation: transBook?.text[cNum][vNum],
    // find the start of the sof pasuk group by finding the last word that
    // doesn't have a mercha, tipcha, sof pasuk, or maqaf
    sofAudioMismatch: sofAudioMismatch
      ? words.findLastIndex((word) => !/[\u0596\u05a5\u05c3־]/.test(word)) + 1 || words.length - 3
      : undefined,
  };
};

type PlayViewProps = {
  verses: VerseInfo[] | null;
  audioSource: AVPlaybackSource[] | null;
  audioLabels: Promise<number[][]>;
  tikkun?: boolean;
  buttons?: React.ReactNode;
  navigation: NavigationProp;
  forceLinebreakVerses?: boolean;
  singleVerseAudio?: boolean;
  tropes?: TropeType;
};
export type Verse<Book extends BookName> = {
  book: Book;
  chapterVerse?: [number, number];
  sof: boolean;
};
export type VerseData<Book extends BookName> = Verse<Book> & VerseInfo;
export type VerseInfo = {
  chapterVerse?: [number, number];
  words: string[];
  translation?: string;
  /** If non-null, the word index at which the mismatched sof pasuk starts */
  sofAudioMismatch?: number;
};
export function PlayView({
  verses,
  audioSource,
  audioLabels,
  tikkun = false,
  buttons,
  navigation,
  forceLinebreakVerses = false,
  singleVerseAudio = false,
  tropes,
}: PlayViewProps) {
  const navTheme = useNavigationTheme();
  const [{ textSize: textSizeMultiplier, audioSpeed }] = useSettings();

  const audio = useAudio(audioSource, { speed: audioSpeed });

  const labels = usePromise(() => audioLabels, [audioLabels]);

  const [fontsLoaded, err] = useFonts();
  if (err) console.error(err);

  const wordStyle = useMemo(
    () => getWordStyle(tikkun, textSizeMultiplier),
    [tikkun, textSizeMultiplier],
  );

  const changeAudioTime = useMemo(
    () =>
      audio && verses
        ? async (verseIndex: number, wordIndex: number) => {
            if (singleVerseAudio) {
              wordIndex += verses
                .slice(0, verseIndex)
                .reduce((a, { words }) => a + words.length, 0);
              verseIndex = 0;
            }
            const newTime = (await audioLabels)[verseIndex][wordIndex];
            audio.setCurrentTime(verseIndex, newTime);
          }
        : undefined,
    [audioLabels, verses, audio?.setCurrentTime],
  );

  const [modalVisible, setModalVisible] = useState(false);

  useScreenOptions(
    navigation,
    {
      headerRight: () => (
        <HeaderContainer>
          {tropes && (
            <CustomButton
              style={{ borderRadius: 100, margin: 0, padding: 8 }}
              onPress={() => {
                audio?.pause();
                navigation.navigate("TropeSelectScreen", { tropeType: tropes });
              }}
            >
              <TropeIcon fill={navTheme.colors.text} />
            </CustomButton>
          )}
          <Button title="Settings" onPress={() => setModalVisible(true)} />
        </HeaderContainer>
      ),
    },
    [tropes, setModalVisible, audio?.pause, navTheme],
  );

  if ((!fontsLoaded && !err) || !verses) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading....</Text>
      </View>
    );
  } else {
    const unBitwiseNot = (x: number) => (x < 0 ? ~x : x);
    const audioInactive = audio == null || (!audio.playing && audio.currentTime == 0);
    let activeWordIndex =
      audioInactive || !labels
        ? null
        : unBitwiseNot(
            binarySearch(labels[audio.currentTrack], audio.currentTime, (a, b) =>
              a === b ? -1 : a - b,
            ),
          ) - 1;
    const activeVerseIndex =
      audioInactive || !labels
        ? null
        : singleVerseAudio
        ? activeWordIndex &&
          verses.findIndex((v) => {
            const ret = activeWordIndex! < v.words.length;
            if (!ret) activeWordIndex! -= v.words.length;
            return ret;
          })
        : audio.currentTrack;

    return (
      <View style={{ height: "100%" }}>
        <SettingsModal {...{ audio, modalVisible, setModalVisible }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 5 }}>
          <Verses
            {...{
              verses,
              changeAudioTime,
              wordStyle,
              activeVerseIndex,
              activeWordIndex,
              forceLinebreakVerses,
            }}
          />
        </ScrollView>
        <Footer>
          {audio && changeAudioTime ? (
            <FooterButton
              onPress={() => {
                if (audioInactive) {
                  changeAudioTime(0, 0);
                } else {
                  if (audio.playing) audio.pause();
                  else audio.play();
                }
              }}
              buttonTitle={audio.loaded ? (audio.playing ? "Pause" : "Play") : "Audio loading..."}
              disabled={!audio.loaded}
            />
          ) : (
            <FooterButton buttonTitle="No audio for aliyah" disabled />
          )}
          {buttons}
        </Footer>
      </View>
    );
  }
}

function parseChV(s: string): [number, number] {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

type VersesProps = {
  verses: VerseInfo[];
  activeVerseIndex: number | null;
  activeWordIndex: number | null;
  forceLinebreakVerses: boolean;
  changeAudioTime: ChangeAudioTime | undefined;
  wordStyle: WordStyle;
};

const Verses = React.memo(function Verses({
  verses,
  activeVerseIndex,
  activeWordIndex,
  forceLinebreakVerses,
  changeAudioTime,
  wordStyle,
}: VersesProps) {
  let curWordIndex = 0;
  let anyTrans = false;
  const verseText = verses.map((verse, verseIndex) => {
    anyTrans ||= verse.translation != null;
    const key = verse.chapterVerse?.join(":") ?? verseIndex;
    const ret = (
      <Verse
        {...{ key, verse, verseIndex, changeAudioTime, wordStyle }}
        activeWordIndex={activeVerseIndex === verseIndex ? activeWordIndex : null}
      />
    );
    curWordIndex += verse.words.length;
    return ret;
  });

  return forceLinebreakVerses || anyTrans ? <View>{verseText}</View> : <Text>{verseText}</Text>;
});

export const getWordStyle = (tikkun: boolean, textSizeMultiplier: number) => {
  const deleteRegex = tikkun ? /[\/\u0591-\u05C7]/g : /[\/־׀]/g;
  const fontFamily = tikkun ? tikkunFont : hebFont;
  const fontMul = tikkun ? 30 : 36;
  return {
    deleteRegex,
    tikkun,
    style: {
      fontFamily,
      fontSize: fontMul * textSizeMultiplier,
    },
  };
};

type WordStyle = ReturnType<typeof getWordStyle>;

type VerseProps = {
  verse: VerseInfo;
  changeAudioTime: ChangeAudioTime | undefined;
  wordStyle: WordStyle;
  verseIndex: number;
  activeWordIndex: number | null;
};

const fmtChV = ([cNum, vNum]: [number, number]) => `${cNum + 1}:${vNum + 1}`;

const MAQAF = "־";

const Verse = React.memo(function Verse(props: VerseProps) {
  const styles = useStyles();

  const { verse, changeAudioTime, wordStyle, verseIndex, activeWordIndex } = props;
  const words = verse.words.map((word, wordIndex) => {
    return (
      <Word
        key={wordIndex}
        {...{ word, verseIndex, wordIndex, wordStyle, changeAudioTime }}
        active={wordIndex === activeWordIndex}
      />
    );
  });
  if (verse.sofAudioMismatch) {
    const sofWords = words.splice(verse.sofAudioMismatch);
    words.push(
      <RN.Text key="sof" style={styles.sofAudioMismatch}>
        {sofWords}
      </RN.Text>,
    );
  }

  return (
    <>
      <Text style={[wordStyle.style, { userSelect: "none" }]}>
        {"\u200F"}
        {verse.chapterVerse && !wordStyle.tikkun && (
          <View style={styles.verseNumWrapper}>
            <RN.Text style={styles.verseNum}>{fmtChV(verse.chapterVerse)}</RN.Text>
          </View>
        )}
        {words}
      </Text>
      {verse.translation && <Text style={{ paddingHorizontal: 5 }}>{verse.translation}</Text>}
    </>
  );
});

type ChangeAudioTime = (verseIndex: number, wordIndex: number) => void;

type WordIndexInfo = Maybe<
  { verseIndex: number; wordIndex: number } & Maybe<{ changeAudioTime: ChangeAudioTime }>
>;

export type WordProps = WordIndexInfo & {
  wordStyle: WordStyle;
  word: string;
  active?: boolean;
};

export function Word({
  word,
  wordStyle,
  active,
  verseIndex,
  wordIndex,
  changeAudioTime,
}: WordProps) {
  const styles = useStyles();

  // check if the word has a maqaf or a paseq attached to it,
  // so that we can attach it back on with special formatting
  const punct = !wordStyle.tikkun && word.match(/[־׀]$/)?.[0];
  return (
    <>
      <TouchableOpacity
        onPress={changeAudioTime && (() => changeAudioTime(verseIndex, wordIndex))}
        disabled={!changeAudioTime}
      >
        <RN.Text style={[styles.word, active && styles.active]}>
          {word.replace(wordStyle.deleteRegex, "")}
        </RN.Text>
      </TouchableOpacity>
      {punct && <RN.Text style={[punct === MAQAF ? styles.maqaf : styles.paseq]}>{punct}</RN.Text>}
    </>
  );
}
