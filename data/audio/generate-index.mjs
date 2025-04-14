import { NUM_VERSES } from "@hebcal/leyning";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const audioDir = path.dirname(fileURLToPath(import.meta.url));

const fullIndex = {};
for (const entry of await fs.readdir(audioDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  /** @type {{ [ch: number]: (true | {reg?: boolean, sof?: boolean} | undefined)[]}} */
  const index = {};
  const dir = path.join(audioDir, entry.name);
  for (const fname of await fs.readdir(dir)) {
    if (path.extname(fname) != ".mp3") continue;
    const [chV, extra] = path.basename(fname, ".mp3").split("-");
    const [chapter, verse] = parseChV(chV);
    const chapterArr = (index[chapter] ??= []);
    const kind = extra === "SA" ? "sof" : "reg";
    (chapterArr[verse] ??= {})[kind] = 1;
  }
  const bookName = entry.name.replace("_", " ");
  const numVerses = NUM_VERSES[bookName];
  for (const [ch, chapterArr] of Object.entries(index)) {
    for (let v = 0; v < chapterArr.length; v++) {
      if (chapterArr[v] === undefined) {
        chapterArr[v] = 0;
      } else if (isDeepStrictEqual(chapterArr[v], { reg: 1 })) {
        chapterArr[v] = 1;
      }
    }
    if (chapterArr.length === numVerses[Number(ch) + 1] && chapterArr.every((x) => !!x)) {
      const dense = {};
      for (let v = 0; v < chapterArr.length; v++) {
        if (chapterArr[v] !== 1) {
          dense[v] = chapterArr[v];
        }
      }
      index[ch] = dense;
    }
  }
  fullIndex[bookName] = index;
}

await fs.writeFile(path.join(audioDir, "index.json"), JSON.stringify(fullIndex));

function parseChV(s) {
  const [ch, v] = s.split("_");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}
