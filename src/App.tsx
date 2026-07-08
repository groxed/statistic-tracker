import { useState, useEffect } from "react";
import { StatEntry } from "./types";
import StatForm from "./components/StatForm";
import StatChart from "./components/StatChart";
import StatAccordion from "./components/StatAccordion";
import { Info } from "lucide-react";
import { ImportExport } from "./components/ImportExport";

const STORAGE_KEY = "statistic_tracker_entries";

// Pre-seeded demo data representing statistical trends (including dates matching your request)
const DEMO_ENTRIES: StatEntry[] = [
  { id: "seed-1", date: "2026-07-01", value: 500, isCheckpoint: true }, // Checkpoint at 01/07/2026
  { id: "seed-2", date: "2026-07-08", value: 485 }, // Non-checkpoint at 08/07/2026 (1 week since checkpoint)
  { id: "seed-3", date: "2026-07-15", value: 470 }, // Non-checkpoint at 15/07/2026 (2 weeks since checkpoint)
  { id: "seed-4", date: "2026-07-22", value: 450, isCheckpoint: true }, // New checkpoint at 22/07/2026 (3 weeks since checkpoint)
  { id: "seed-5", date: "2026-07-29", value: 440 }, // Non-checkpoint at 29/07/2026 (1 week since checkpoint again)
];

export default function App() {
  const [entries, setEntries] = useState<StatEntry[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({
    message: "",
    type: null,
  });

  // Load entries from localStorage or pre-seed on first startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        // First-time user: pre-seed with demo data for immediate visualization
        setEntries(DEMO_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ENTRIES));
        showNotification(
          "Pre-loaded demo statistic entries! Feel free to modify or clear them.",
          "success",
        );
      }
    } catch (err) {
      console.error("Failed to load local storage entries:", err);
      setEntries(DEMO_ENTRIES);
    }
  }, []);

  // Helper to show brief feedback toast notifications
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: null });
    }, 4500);
  };

  // Helper to persist state updates to localStorage
  const updateEntriesState = (newEntries: StatEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  };

  // Create/Add entry
  const handleAddEntry = (newEntryData: Omit<StatEntry, "id">) => {
    const id = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: StatEntry = { id, ...newEntryData };

    // Check if entry on this date already exists
    const duplicate = entries.find((e) => e.date === newEntryData.date);
    let updated: StatEntry[];

    if (duplicate) {
      // If same date exists, merge/replace it to maintain neat daily logs
      updated = entries.map((e) =>
        e.date === newEntryData.date
          ? {
              ...e,
              value: newEntryData.value,
              isCheckpoint: newEntryData.isCheckpoint,
            }
          : e,
      );
      showNotification(
        `Updated existing entry for date ${formatDateLabel(newEntryData.date)} with new value.`,
        "success",
      );
    } else {
      updated = [...entries, newEntry];
      showNotification("Successfully added new statistic record!", "success");
    }

    updateEntriesState(updated);
  };

  // Update/Edit entry inline
  const handleUpdateEntry = (
    id: string,
    updatedFields: Omit<StatEntry, "id">,
  ) => {
    const updated = entries.map((entry) => {
      if (entry.id === id) {
        return { ...entry, ...updatedFields };
      }
      return entry;
    });
    updateEntriesState(updated);
    showNotification("Record updated successfully!", "success");
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((entry) => entry.id !== id);
    updateEntriesState(updated);
    showNotification("Record deleted successfully.", "success");
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const exportEntries = (
    exportFn: (exportedEntries: StatEntry[], filename?: string) => void,
  ) => {
    if (entries.length === 0) {
      showNotification("No data available to export.", "error");
      return;
    }
    exportFn(entries, "timeseries_statistics.csv");
    showNotification("CSV exported successfully!", "success");
  };

  return (
    <div
      className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans select-none"
      id="applet-viewport"
    >
      {/* Dynamic Feedback Notification Bar */}
      {notification.type && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3 py-2 rounded border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideDown ${
            notification.type === "success"
              ? "bg-[#18181b] border-blue-500/30 text-blue-400 text-xs font-medium"
              : "bg-[#18181b] border-rose-500/30 text-rose-400 text-xs font-medium"
          }`}
          id="toast-notification"
        >
          {notification.type === "success" ? (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
          )}
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {notification.message}
          </span>
        </div>
      )}

      <header className="border-b border-[#27272a] bg-[#09090b] sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <ImportExport
            onExport={exportEntries}
            onError={(message) => showNotification(message, "error")}
            onSuccess={(message) => showNotification(message, "success")}
            onUpdateEntries={updateEntriesState}
          />
        </div>
      </header>

      {/* Main Container */}
      <main
        className="flex-1 px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6"
        id="applet-main-body"
      >
        {/* Short Usage Information Banner */}
        <section
          className="bg-[#18181b]/30 border border-[#27272a] p-4 rounded flex gap-3 items-start"
          id="usage-info-banner"
        >
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#71717a]">
              System Core
            </h4>
            <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
              Use the logger below to record values on specific days. All logs
              are stored in your web browser. Import or Export dynamic datasets
              using standard CSV.
            </p>
          </div>
        </section>

        {/* 1. Logger Form (Top section) */}
        <section id="form-section">
          <StatForm onAddEntry={handleAddEntry} />
        </section>

        {/* 2. Visual Trends Chart (Middle section) */}
        <section id="chart-section" className="flex flex-col gap-2">
          <StatChart entries={entries} />
        </section>

        {/* 3. Chronological Accordion List (Bottom section) */}
        <section id="accordion-section" className="flex flex-col gap-2">
          <StatAccordion
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-4 border-t border-[#27272a] bg-[#09090b] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#52525b] font-mono gap-2"
        id="applet-footer"
      >
        <div className="flex gap-4">
          <span>SYSTEM READY</span>
          <span>DATA SOURCE: LOCAL_SYNC</span>
        </div>
        <div>LAST UPDATED: 2026-07-05 UTC</div>
      </footer>
    </div>
  );
}
