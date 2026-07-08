import { useRef } from "react";
import { exportToCSV, parseCSV } from "../utils/csv";
import { Download, Upload } from "lucide-react";
import { StatEntry } from "../types";

const FILE_EXTENSION = "CSV";

type ImportExportProps = {
  onUpdateEntries: (newEntries: StatEntry[]) => void;
  onExport: (
    exportFunc: (entries: StatEntry[], filename?: string) => void,
  ) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export const ImportExport = ({
  onExport,
  onError,
  onUpdateEntries,
  onSuccess,
}: ImportExportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          onError("Could not read file content.");
          return;
        }

        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          onError(
            "No valid rows found in the provided file. Make sure it contains Date and Value.",
          );
          return;
        }

        const newEntries: StatEntry[] = parsed.map((item, idx) => ({
          id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
          date: item.date,
          value: item.value,
          isEvent: item.isEvent || false,
          isCheckpoint: item.isCheckpoint || false,
          eventName: item.eventName || undefined,
        }));

        // Merge imported entries, resolving duplicate dates by overwriting with the imported ones
        const mergedMap = new Map<string, StatEntry>();
        newEntries.forEach((e) => mergedMap.set(e.date, e));

        const mergedList = Array.from(mergedMap.values());
        onUpdateEntries(mergedList);

        onSuccess(
          `Successfully imported and merged ${newEntries.length} entries!`,
        );
      } catch (err) {
        console.error(`Error importing ${FILE_EXTENSION}:`, err);
        onError("Failed to parse file. Ensure valid columns.");
      }
    };

    reader.readAsText(file);
    // Clear input selection so same file can be selected again
    e.target.value = "";
  };

  return (
    <div
      className="flex items-center gap-2 self-start sm:self-center"
      id="global-actions-toolbar"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={`.${FILE_EXTENSION.toLowerCase()}`}
        className="hidden"
        id="file-selector"
      />
      <button
        onClick={handleImportClick}
        className="flex items-center gap-1.5 text-xs font-medium bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] px-3 py-1.5 rounded transition-all cursor-pointer"
        title={`Upload existing dataset via ${FILE_EXTENSION}`}
        id="import-from-file-action"
      >
        <Download className="w-3.5 h-3.5 text-blue-500" />
        <span>Import from {FILE_EXTENSION}</span>
      </button>
      <button
        onClick={() => onExport(exportToCSV)}
        className="flex items-center gap-1.5 text-xs font-medium bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] px-3 py-1.5 rounded transition-all cursor-pointer"
        title={`Download entries as ${FILE_EXTENSION}`}
        id="export-to-file-action"
      >
        <Upload className="w-3.5 h-3.5 text-blue-500" />
        <span>Export to {FILE_EXTENSION}</span>
      </button>
    </div>
  );
};
