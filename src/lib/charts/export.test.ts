import { afterEach, expect, it, vi } from "vitest";
import { csvCell, exportToCsv, exportToJson, exportToPng } from "./export";
afterEach(() => vi.restoreAllMocks());
it.each([
  ["0,1", '"0,1"'],
  ['A "quote"', '"A ""quote"""'],
  ["Two\nLines", '"Two\nLines"'],
  ["=1+1", '"\'=1+1"'],
  [" +SUM(1)", '"\' +SUM(1)"'],
  ["@SUM(1)", '"\'@SUM(1)"'],
  ["-1+1", '"\'-1+1"'],
  ["\tvalue", '"\'\tvalue"'],
])("safely encodes %s", (input, output) => expect(csvCell(input)).toBe(output));
it("canceling any chart export creates no download", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const create = vi.spyOn(document, "createElement");
  exportToCsv("Synthetic", {"0,1":"test"}, new Map([["test", {name:"Synthetic Student"}]]));
  exportToJson("Synthetic", {});
  await exportToPng("Synthetic", "absent");
  expect(confirm).toHaveBeenCalledTimes(3);
  expect(create).not.toHaveBeenCalled();
});
