const fs = require("fs");
const gematria = require("gematria");
const path = require("path");

const project_root = path.resolve(__dirname, "../../..");
const mam_dir = path.join(project_root, "MAM-parsed/plus");

console.log("Processing tanach json...");

const namemap = {
  הושע: "Hosea",
  יואל: "Joel",
  עמוס: "Amos",
  עבדיה: "Obadiah",
  מיכה: "Micah",
  זכריה: "Zechariah",
  מלאכי: "Malachi",
  ירמיהו: "Jeremiah",
  יהושע: "Joshua",
  יונה: "Jonah",
  דברים: "Deuteronomy",
  ויקרא: "Leviticus",
  יחזקאל: "Ezekiel",
  'שמ"א': "I Samuel",
  'שמ"ב': "II Samuel",
  'מל"א': "I Kings",
  'מל"ב': "II Kings",
  שמות: "Exodus",
  שופטים: "Judges",
  ישעיהו: "Isaiah",
  בראשית: "Genesis",
  במדבר: "Numbers",
  קהלת: "Ecclesiastes",
  "שיר השירים": "Song of Songs",
  רות: "Ruth",
  חבקוק: "Habakkuk",
  אסתר: "Esther",
  איכה: "Lamentations",
};

const stripPref = (s, ...prefs) =>
  prefs.reduce((s, pref) => (s.startsWith(pref) ? s.slice(pref.length) : s), s);

const books = {};
for (const file of fs.readdirSync(mam_dir)) {
  const { book39s } = JSON.parse(fs.readFileSync(path.join(mam_dir, file), "utf8"));
  for (const book39 of book39s) {
    const hebrew_name = stripPref(book39.sub_book_name ?? book39.book24_name, "ספר", "מגילת", " ");
    const name = namemap[hebrew_name];
    if (name == null) continue;
    books[name] = book39;
  }
}

const gemToArray = (obj) => {
  const arr = [];
  for (const [gem, v] of Object.entries(obj)) {
    arr[gematria(gem).toMisparGadol() - 1] = v;
  }
  return arr;
};

const tmpls = {
  נוסח: ([wte]) => wte,
  "מ:אות-מיוחדת-במילה": ([_big, normal]) => normal,
  "מ:פסק": () => "׀",
  "מ:לגרמיה-2": () => "׀",
  פפ: () => " ",
  "מ:קמץ": ([], { ד }) => ד,
  'קו"כ-אם': ([wte]) => wte,
  "מ:הערה-2": ([wte]) => wte,
  'כו"ק': ([_, wte]) => wte,
  'קו"כ': ([_, wte]) => wte,
  "מ:כפול": ([], { כפול }) => כפול,
  'מ:כו"ק כתיב מילה חדה וקרי תרתין מילין': ([_standard, split]) => split,
  ססס: () => " ",
  סס: () => " ",
  "מ:ששש": () => " ",
  ר3: () => " ",
};

/** @returns {string} */
const eval_wte = (wte) => {
  if (typeof wte === "string") return wte;
  if (Array.isArray(wte)) return wte.map(eval_wte).join("");
  const tmpl = tmpls[wte.tmpl_name];
  if (tmpl == null) return "";
  const args = (wte.tmpl_args ?? []).map(eval_wte);
  const pos_args = [];
  const kwargs = {};
  for (const arg of args) {
    const [name, value] = arg.split("=", 2);
    if (value == null) pos_args.push(name);
    else if (name.match(/^\d+$/)) pos_args[name] = value;
    else kwargs[name] = value;
  }
  return eval_wte(tmpl(pos_args, kwargs));
};

const process_book = (book) =>
  gemToArray(book.chapters).map((chapter) =>
    gemToArray(chapter).map(
      ([_precode, _nav, verse]) => eval_wte(verse).split(/ |(?<=[׀־])/),
      // .map((w) => w.replace(/[\u0591-\u05C7\ufb1e\u034f]/g, "")),
    ),
  );

const processed_books = Object.fromEntries(
  Object.entries(books).map(([k, v]) => [k, process_book(v)]),
);

const outdir = path.join(project_root, "data/torah/json");
fs.mkdirSync(outdir, { recursive: true });
for (const [name, book] of Object.entries(processed_books)) {
  fs.writeFileSync(path.join(outdir, `${name}.json`), JSON.stringify(book));
}

console.log("Done");
