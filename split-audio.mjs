import * as leyning from "@hebcal/leyning";
import { spawn } from "node:child_process";
import events from "node:events";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {import("./src/App").Parshah} Parsha */
/** @typedef {{ [book: string]: { [verse: string]: { src: `${Parsha}-${1|2|3|4|5|6|7}`, start_time: number, end_time?: number, labels: number[] } } }} VerseMap */

/** @type {<T>(x: T | T[]) => T[]} */
const ensureArray = (x) => (Array.isArray(x) ? x : [x]);

function split_audio() {
  /** @type {VerseMap} */ const out = {};
  for (const parsha of /** @type {Parsha[]} */ (Object.keys(audio_map))) {
    const { fullkriyah, haft, seph } = leyning.getLeyningForParsha(parsha);
    fullkriyah.H = haft;
    // adjustments to the leyning info where the recordings are different from the hebcal results
    switch (parsha) {
      case "Masei":
        fullkriyah[1].e = "33:9";
        fullkriyah[2].b = "33:10";
        break;
      case "Vayeilech":
        fullkriyah.H = { k: "Joel", b: "2:15", e: "2:27" };
        break;
      case "Achrei Mot":
        fullkriyah.H = seph;
        break;
      case "Kedoshim":
        fullkriyah.H = leyning.getLeyningForParsha("Achrei Mot").haft;
        break;
      case "Terumah":
        fullkriyah[2].e = "25:30";
        fullkriyah[3].b = "25:31";
        break;
    }
    for (const num of [1, 2, 3, 4, 5, 6, 7, "H"]) {
      /** @type {number[]} */
      const labels = book_labels[parsha][num];
      const aliyah = ensureArray(fullkriyah[num]);
      const verses = extractVerseData(
        aliyah,
        aliyah.map((x) => books[x.k])
      );
      let curWordIndex = 0;
      for (const verse of verses) {
        const nextWordIndex = curWordIndex + verse.words.length;
        const start_time = labels[curWordIndex];
        const chV = `${verse.chapterVerse[0] + 1}:${verse.chapterVerse[1] + 1}`;
        console.assert(
          nextWordIndex <= labels.length,
          "mismatched reading lengths",
          `${parsha} Aliyah ${num} ${verse.book} ${chV}`,
          ...aliyah
        );
        (out[verse.book] ??= {})[chV] = {
          src: `${audio_map[parsha]}-${num}`,
          start_time,
          end_time: labels[nextWordIndex],
          sof_aliyah: labels[nextWordIndex] == null,
          labels: labels
            .slice(curWordIndex, nextWordIndex)
            .map((x) => Math.round((x - start_time) * 1e10) / 1e10),
        };
        curWordIndex = nextWordIndex;
      }
      console.assert(
        curWordIndex === labels.length,
        "mismatched reading lengths",
        `hebcal ${curWordIndex} labels ${labels.length}`,
        `${parsha} Aliyah ${num}`,
        ...aliyah
      );
    }
  }
  return out;
}

/** @returns {[number, number]} */
function parseChV(s) {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

const extractVerseData = (aliyah, book) =>
  aliyah.flatMap((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    // these values are 0-indexed and **inclusive**
    const [begChapter, begVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    return b.c.flatMap((c, cNum) => {
      if (cNum < begChapter || cNum > endChapter) return [];
      const verses = c.v.map((v, vNum) => ({
        book: aliyah.k,
        chapterVerse: [cNum, vNum],
        words: v.w,
      }));
      const sliceStart = cNum === begChapter ? begVerse : 0;
      const sliceEnd = cNum === endChapter ? endVerse + 1 : verses.length;
      return sliceStart === 0 && sliceEnd === verses.length
        ? verses
        : verses.slice(sliceStart, sliceEnd);
    });
  });

const audio_map = {
  Bereshit: "Bereshit",
  Noach: "Noach",
  "Lech-Lecha": "Lech-Lecha",
  Vayera: "Vayera",
  "Chayei Sara": "ChayeiSara",
  Toldot: "Toldot",
  Vayetzei: "Vayetzei",
  Vayishlach: "Vayishlach",
  Vayeshev: "Vayeshev",
  Miketz: "Miketz",
  Vayigash: "Vayigash",
  Vayechi: "Vayechi",
  Shemot: "Shemot",
  Vaera: "Vaera",
  Bo: "Bo",
  Beshalach: "Beshalach",
  Yitro: "Yitro",
  Mishpatim: "Mishpatim",
  Terumah: "Terumah",
  Tetzaveh: "Tetzaveh",
  "Ki Tisa": "KiTisa",
  Vayakhel: "Vayakhel",
  Pekudei: "Pekudei",
  Vayikra: "Vayikra",
  Tzav: "Tzav",
  Shmini: "Shmini",
  Tazria: "Tazria",
  Metzora: "Metzora",
  "Achrei Mot": "AchreiMot",
  Kedoshim: "Kedoshim",
  Emor: "Emor",
  Behar: "Behar",
  Bechukotai: "Bechukotai",
  Bamidbar: "Bamidbar",
  Nasso: "Nasso",
  "Beha'alotcha": "Behaalotcha",
  "Sh'lach": "Shlach",
  Korach: "Korach",
  Chukat: "Chukat",
  Balak: "Balak",
  Pinchas: "Pinchas",
  Matot: "Matot",
  Masei: "Masei",
  Devarim: "Devarim",
  Vaetchanan: "Vaethanan",
  Eikev: "Eikev",
  "Re'eh": "Reeh",
  Shoftim: "Shoftim",
  "Ki Teitzei": "KiTeitzei",
  "Ki Tavo": "KiTavo",
  Nitzavim: "Nitzavim",
  Vayeilech: "Vayeilech",
  "Ha'azinu": "Haazinu",
  "Vezot Haberakhah": "VezotHaberakhah",
};

const book_labels = {};
for (const book_name of leyning.BOOK.slice(1)) {
  Object.assign(
    book_labels,
    (await import(`./old_data/torah/labels/${book_name}.json`, { with: { type: "json" } })).default
  );
}

// adjustments to the labels where there's e.g. a missing label
const dup = (arr, idx) => arr.splice(idx, 0, arr[idx]);
dup(book_labels.Vayera.H, 194);
book_labels.Shemot[1].shift();
dup(book_labels.Tetzaveh[3], 167);
book_labels.Shmini[6].splice(95, 1);

const books = {};
for (const fname of await fs.readdir("./old_data/torah/json")) {
  let book_name = path.basename(fname, ".json");
  book_name =
    { Samuel_1: "I Samuel", Samuel_2: "II Samuel", Kings_1: "I Kings", Kings_2: "II Kings" }[
      book_name
    ] ?? book_name;
  ({ default: books[book_name] } = await import(`./old_data/torah/json/${fname}`, {
    with: { type: "json" },
  }));
}

const out = split_audio();
await fs.mkdir("data/torah/labels", { recursive: true });
for (const [book_name, verses] of Object.entries(out)) {
  await fs.writeFile(
    `data/torah/labels/${book_name}.json`,
    JSON.stringify(Object.fromEntries(Object.entries(verses).map(([k, v]) => [k, v.labels])))
  );
}

const audioDir = fileURLToPath(new URL("data/audio", import.meta.url));
const oldAudioDir = fileURLToPath(new URL("old_data/audio", import.meta.url));

await Promise.all(
  Object.keys(out).map((x) =>
    fs.mkdir(path.join(audioDir, x.replace(" ", "_")), { recursive: true })
  )
);

const taskmap = {};

for (const [book_name, verses] of Object.entries(out)) {
  const book = book_name.replace(" ", "_");

  for (const [verse, { src, start_time, end_time, sof_aliyah }] of Object.entries(verses)) {
    const outfile = `${verse.replace(":", "_")}${sof_aliyah ? `-SA` : ""}.mp3`;

    (taskmap[src] ??= []).push(
      "-ss",
      String(start_time),
      ...(end_time == null ? [] : ["-to", String(end_time)]),
      "-codec",
      "copy",
      path.join(audioDir, book, outfile)
    );
  }
}

/**
 * @arg {number} n
 * @arg {Array<() => Promise<void>>} tasks
 */
const runTasks = async (n, tasks) => {
  await Promise.all(
    Array(n)
      .fill(null)
      .map(async () => {
        while (tasks.length) {
          await tasks.shift()();
        }
      })
  );
};

console.log("Splitting audio...");
await runTasks(
  os.availableParallelism(),
  Object.entries(taskmap).map(([src, cmds]) => async () => {
    const child = spawn(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", path.join(oldAudioDir, `${src}.mp3`), ...cmds],
      { stdio: "inherit", windowsHide: true }
    );
    await events.once(child, "exit");
    const code = child.exitCode || child.signalCode;
    if (code) {
      console.error(`process exited with ${code}`);
      process.exitCode = 1;
    }
  })
);
console.log("Done");
