/** Auto-save checkpoint: the quest the player reached, lives and journal. */
export interface JournalEntry { title: string; text: string }
export interface SaveData { index: number; lives: number; salt: number; journal: JournalEntry[] }

const KEY = "roubaix-echoes-save-v1";

export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<SaveData>;
    if (typeof d.index !== "number" || d.index < 1 || d.index > 9 || typeof d.lives !== "number" || d.lives < 1) return null;
    return { index: d.index, lives: d.lives, salt: typeof d.salt === "number" ? d.salt : 1, journal: Array.isArray(d.journal) ? d.journal.slice(0, 80) : [] };
  } catch { return null; }
}
export const loadSave = () => (typeof localStorage === "undefined" ? null : parseSave(localStorage.getItem(KEY)));
export const writeSave = (d: SaveData) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ } };
export const clearSave = () => { try { localStorage.removeItem(KEY); } catch { /* blocked */ } };

/** Adds an entry once (same title + text is not duplicated). */
export function addEntry(journal: JournalEntry[], entry: JournalEntry) {
  return journal.some(e => e.title === entry.title && e.text === entry.text) ? journal : [...journal, entry];
}
