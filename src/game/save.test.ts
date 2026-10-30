import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { addEntry, parseSave } from "./save";

describe("checkpoints and journal", () => {
  it("resumes at the reached quest with its lives", () => {
    deepStrictEqual(parseSave(JSON.stringify({ index: 4, lives: 2, salt: 9, journal: [] })), { index: 4, lives: 2, salt: 9, journal: [] });
  });
  it("ignores a save from the first quest, a dead run or a corrupt value", () => {
    strictEqual(parseSave(JSON.stringify({ index: 0, lives: 3 })), null);
    strictEqual(parseSave(JSON.stringify({ index: 3, lives: 0 })), null);
    strictEqual(parseSave("{oops"), null);
  });
  it("does not duplicate a clue in the journal", () => {
    const e = { title: "Quête 1", text: "La porte" };
    strictEqual(addEntry(addEntry([], e), e).length, 1);
  });
});
