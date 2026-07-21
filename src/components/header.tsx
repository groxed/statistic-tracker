import { useState } from "react";
import { FileExtension } from "../constants";
import { FileExtensionSelect } from "./file-extension-select";
import { ImportExport } from "./import-export";
import { exportToCSV, parseCSV } from "../utils/csv";
import { exportToXLSX, parseXLSX } from "../utils/excel";
import { NotificationType } from "../hooks";
import { StatEntry } from "../types";

type HeaderProps = {
  entries: StatEntry[];
  showNotification: (message: string, type: NotificationType) => void;
  updateEntries: (newEntries: StatEntry[]) => void;
};

export const Header = ({
  entries,
  showNotification,
  updateEntries,
}: HeaderProps) => {
  const [fileExtension, setFileExtension] = useState<FileExtension>(
    FileExtension.XLSX,
  );

  const importEntries = async (buffer: ArrayBuffer | string) => {
    const result = await (fileExtension === FileExtension.CSV
      ? parseCSV(buffer as string)
      : parseXLSX(buffer as ArrayBuffer));
    return result;
  };

  const exportEntries = () => {
    if (entries.length === 0) {
      showNotification("No data available to export.", "error");
      return;
    }

    const exportFn =
      fileExtension === FileExtension.CSV ? exportToCSV : exportToXLSX;

    exportFn(entries, "timeseries_statistics");
    showNotification("Entries exported successfully!", "success");
  };

  return (
    <header className="border-b border-[#27272a] bg-[#09090b] sticky top-0 z-30 px-6 py-4">
      <div className="max-w-4xl mx-auto flex sm:items-center gap-4">
        <FileExtensionSelect
          fileExtension={fileExtension}
          onFileExtensionSelect={setFileExtension}
        />
        <ImportExport
          importFunc={importEntries}
          fileExtension={fileExtension}
          onExport={exportEntries}
          onError={(message) => showNotification(message, "error")}
          onSuccess={(message) => showNotification(message, "success")}
          onUpdateEntries={updateEntries}
        />
      </div>
    </header>
  );
};
