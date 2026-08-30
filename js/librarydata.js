// ── Google Sheet CSV URL ─────────────────────────
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRa4YNwQGG3HdZH9FmCJTYhaqdXOrNtZdMn_xujOixDPTkDeLs7A7VPCuH5GhAdhfZDRVJRnHxPiSIm/pub?output=csv";

// ── Manual entries rom Letterboxd) ──────e
//  Fields: title, category, rating, picture (0–5, halves ok), note (optional)
const manualEntries = [

  // 📺 Shows
  // { title: "Example Show", category: "show", rating: 4 , picture: "example-show.jpg"},

  // 📚 Books
  // { title: "Example Book", category: "book", rating: 5, picture: "example-book.jpg", note: "So good" },

];

// ── Category filter config ────────────────────────────
const categories = [
  { id: "all",   label: "✨ All"     },
  { id: "game",  label: "🎮 Games"  },
  { id: "movie", label: "🎬 Movies" },
  { id: "anime", label: "🌸 Anime"  },
  { id: "manga", label: "📖 Manga"  },
  { id: "book", label: "📚 Books"  },
];

// ── CSV parser ────────────────────────────────────────
// Handles quoted fields with commas inside them.
function parseCSV(text) {
  const rows = [];
  // normalize line endings
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    const cols = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// ── Sheet fetcher ─────────────────────────────────────
// The sheet has three tables stacked like this:
//
//   Title | Rating (Out of 5 stars) | Notes | Image  ← anime header
//   ...anime rows...
//   (blank)
//   (blank)
//   Title | Rating (out of 5 stars) | Notes | Image  ← manga header
//   ...manga rows...
//   (blank)
//   (blank)
//   Title | Rating (out of 5 stars) | Notes   ← games header
//   ...games rows...
//
// We detect each table by the "Title" header rows and assign
// categories in the order they appear: anime → manga → game.

async function fetchSheetEntries() {
  const res  = await fetch(SHEET_CSV_URL);
  const text = await res.text();
  const rows = parseCSV(text);

  const order      = ["anime", "manga", "game", "book"];
  let   tableIndex = -1;             // which table we're in (-1 = not started)
  const tables     = order.map(() => []); // one row-list per category, in sheet order

  for (const cols of rows) {
    const first = (cols[0] || "").toLowerCase().trim();

    // detect a header row ("title" in first column)
    if (first === "title") {
      tableIndex++;
      continue; // skip the header row itself
    }

    // skip blank rows
    if (!first) continue;

    // skip if we've gone past the known tables
    if (tableIndex < 0 || tableIndex >= order.length) continue;

    const title  = cols[0]?.trim() || "";
    const picture = cols[3]?.trim() || null;
    const rating = parseFloat(cols[1]) || 0;
    const note   = cols[2]?.trim() || "";
    const cat    = order[tableIndex];

    if (title && rating) {
      tables[tableIndex].push({ title, category: cat, picture, rating, note: note || null });
    }
  }

  // reverse each table individually so the most-recently-added row
  // (bottom of that table in the sheet) shows first, while keeping
  // the categories themselves in their original anime→manga→game→book order
  return tables.flatMap(t => t.reverse());
}