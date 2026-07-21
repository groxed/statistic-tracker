import { useState, useEffect } from "react";
import { StatEntry } from "./types";
import StatForm from "./components/stat-form";
import StatChart from "./components/stat-chart";
import StatAccordion from "./components/stat-accordion";
import { formatDateLabel } from "./utils";
import { Header } from "./components/header";
import { useNotification } from "./hooks";

const STORAGE_KEY = "statistic_tracker_entries";

export default function App() {
  const [entries, setEntries] = useState<StatEntry[]>([]);
  const { notification, showNotification } = useNotification();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load local storage entries:", err);
    }
  }, []);

  const updateEntriesState = (newEntries: StatEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  };

  const addEntry = (newEntryData: Omit<StatEntry, "id">) => {
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

  const updateEntry = (id: string, updatedFields: Omit<StatEntry, "id">) => {
    const updated = entries.map((entry) => {
      if (entry.id === id) {
        return { ...entry, ...updatedFields };
      }
      return entry;
    });
    updateEntriesState(updated);
    showNotification("Record updated successfully!", "success");
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((entry) => entry.id !== id);
    updateEntriesState(updated);
    showNotification("Record deleted successfully.", "success");
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

      <Header
        showNotification={showNotification}
        updateEntries={updateEntriesState}
        entries={entries}
      />

      {/* Main Container */}
      <main
        className="flex-1 px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6"
        id="applet-main-body"
      >
        {/* 1. Logger Form (Top section) */}
        <section id="form-section">
          <StatForm onAddEntry={addEntry} />
        </section>

        {/* 2. Visual Trends Chart (Middle section) */}
        <section id="chart-section" className="flex flex-col gap-2">
          <StatChart entries={entries} />
        </section>

        {/* 3. Chronological Accordion List (Bottom section) */}
        <section id="accordion-section" className="flex flex-col gap-2">
          <StatAccordion
            entries={entries}
            onUpdateEntry={updateEntry}
            onDeleteEntry={deleteEntry}
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
