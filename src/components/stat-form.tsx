import React, { useState } from "react";
import { StatEntry } from "../types";
import { Plus, Calendar, Hash, AlertCircle, Sparkles } from "lucide-react";

interface StatFormProps {
  onAddEntry: (entry: Omit<StatEntry, "id">) => void;
}

export default function StatForm({ onAddEntry }: StatFormProps) {
  // Helper to get today's date in YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayString());
  const [value, setValue] = useState("");
  const [isCheckpoint, setIsCheckpoint] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [eventName, setEventName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please select a valid date.");
      return;
    }

    if (isEvent) {
      console.log(eventName.trim());
      if (!eventName.trim()) {
        setError("Please enter a milestone/event name.");
        return;
      }
      // Call parent handler for non-statistic checkpoint event
      onAddEntry({
        date,
        value: null,
        isCheckpoint: false,
        isEvent: true,
        eventName: eventName.trim(),
      });
    } else {
      if (!value.trim()) {
        setError("Please enter a statistic value.");
        return;
      }

      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        setError("Statistic value must be a valid number.");
        return;
      }

      // Call parent handler for statistic
      onAddEntry({
        date,
        value: numericValue,
        isCheckpoint,
        isEvent: false,
      });
    }

    // Reset fields but keep date as today for subsequent rapid entry
    setValue("");
    setEventName("");
    setIsCheckpoint(false);
    setIsEvent(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#09090b] border border-[#27272a] p-4 rounded-lg flex flex-col gap-4 shadow-xl"
      id="add-entry-form"
    >
      <div className="flex">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a]">
          Log New Entry
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Input */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="input-date"
            className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#52525b]" />
            <span>Date</span>
          </label>
          <div className="relative">
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
              className="w-full bg-[#18181b] text-[#fafafa] text-sm font-mono px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Dynamic Input: Value or Event Name depending on isEvent */}
        {!isEvent ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-value"
              className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] flex items-center gap-1.5"
            >
              <Hash className="w-3.5 h-3.5 text-[#52525b]" />
              <span>Value</span>
            </label>
            <input
              id="input-value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="e.g. 450"
              className="w-full bg-[#18181b] text-[#fafafa] text-sm font-mono px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-[#3f3f46]"
              required
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-event-name"
              className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Event / Milestone Name</span>
            </label>
            <input
              id="input-event-name"
              type="text"
              value={eventName}
              onChange={(e) => {
                setEventName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Started new training schedule"
              className="w-full bg-[#18181b] text-[#fafafa] text-sm font-sans px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-[#3f3f46]"
              required
            />
          </div>
        )}
      </div>

      {/* Checkboxes / Toggles row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 py-1"
        id="form-toggles-container"
      >
        {/* Toggle entry type (Stat vs Event) */}
        <div className="flex items-center gap-2.5" id="is-event-wrapper">
          <input
            type="checkbox"
            id="input-is-event"
            checked={isEvent}
            onChange={(e) => {
              setIsEvent(e.target.checked);
              setError("");
            }}
            className="w-4 h-4 text-emerald-500 bg-[#18181b] border-[#27272a] rounded focus:ring-emerald-500/20 focus:ring-1 focus:outline-none cursor-pointer"
          />
          <label
            htmlFor="input-is-event"
            className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] cursor-pointer select-none flex flex-wrap items-center gap-1"
          >
            <span>Mark as event</span>
          </label>
        </div>

        {/* Checkpoint Checkbox (only show if NOT an event) */}
        {!isEvent && (
          <div className="flex items-center gap-2.5" id="is-checkpoint-wrapper">
            <input
              type="checkbox"
              id="input-is-checkpoint"
              checked={isCheckpoint}
              onChange={(e) => setIsCheckpoint(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-[#18181b] border-[#27272a] rounded focus:ring-blue-500/20 focus:ring-1 focus:outline-none cursor-pointer"
            />
            <label
              htmlFor="input-is-checkpoint"
              className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] cursor-pointer select-none flex flex-wrap items-center gap-1"
            >
              <span>Mark as a checkpoint</span>
            </label>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {error && (
        <div
          className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/10 border border-rose-900/30 px-3 py-2 rounded"
          id="form-error-banner"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {error}
          </span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full md:w-auto md:self-end flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer"
        id="add-entry-submit-btn"
      >
        <Plus className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
        <span>Add Entry</span>
      </button>
    </form>
  );
}
