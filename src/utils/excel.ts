import * as XLSX from "xlsx";
import { StatEntry } from "../types";

/**
 * Exports statistic entries to a downloadable XLSX file.
 */
export function exportToXLSX(
  entries: StatEntry[],
  filename = "timeseries_statistics",
) {
  // Sort entries by date before export
  const sortedEntries = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const worksheetData = [
    ["Date", "Value", "IsCheckpoint", "IsEvent", "EventName"],
    ...sortedEntries.map((entry) => [
      entry.date,
      entry.value ?? "",
      entry.isCheckpoint,
      entry.isEvent,
      entry.eventName ?? "",
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Statistics");

  XLSX.writeFile(workbook, filename + ".xlsx");
}

/**
 * Parses an XLSX file and returns an array of StatEntry items.
 */
export async function parseXLSX(
  buffer: ArrayBuffer,
): Promise<Omit<StatEntry, "id">[]> {
  const workbook = XLSX.read(buffer, { type: "array" });

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  const result: Omit<StatEntry, "id">[] = [];

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (!row || row.length === 0) continue;

    const dateStr = String(row[0] ?? "").trim();
    const valueCell = row[1];

    const isCheckpoint =
      String(row[2]).toLowerCase() === "true" ||
      row[2] === true ||
      row[2] === 1;

    const isEvent =
      String(row[3]).toLowerCase() === "true" ||
      row[3] === true ||
      row[3] === 1;

    const eventName = String(row[4] ?? "").trim();

    const value =
      valueCell === "" || valueCell == null ? null : Number(valueCell);

    if (!dateStr) continue;

    if (!isEvent && value !== null && Number.isNaN(value)) continue;

    result.push({
      date: dateStr,
      value: isEvent ? null : value,
      isCheckpoint: isEvent ? false : isCheckpoint,
      isEvent,
      eventName: isEvent ? eventName || "Milestone Event" : undefined,
    });
  }

  return result;
}
