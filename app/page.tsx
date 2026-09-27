'use client'
import { useEffect, useState } from "react";
import { Header } from "./components/header";
import StatAccordion from "./components/stat-accordion";
import StatChart from "./components/stat-chart";
import StatForm from "./components/stat-form";
import { ToastNotification } from "./components/ui/notification";
import WeeksCalculatorForm from "./components/weeks-calculator-form";
import { useNotification } from "./hooks";
import type { StatEntry } from "./types";
import { formatDateLabel, getDefaultFormattedDate } from "./utils";

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
			{notification.type && <ToastNotification notification={notification} />}

			<Header
				showNotification={showNotification}
				updateEntries={updateEntriesState}
				entries={entries}
			/>

			<main
				className="flex-1 px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6"
				id="applet-main-body"
			>
				<section id="form-section">
					<StatForm onSubmit={addEntry} />
				</section>

				<section id="chart-section" className="flex flex-col gap-2">
					<StatChart entries={entries} />
				</section>

				<section id="calculator-section">
					<WeeksCalculatorForm formatResultDate={getDefaultFormattedDate} />
				</section>

				<section id="accordion-section" className="flex flex-col gap-2">
					<StatAccordion
						entries={entries}
						onUpdateEntry={updateEntry}
						onDeleteEntry={deleteEntry}
					/>
				</section>
			</main>
		</div>
	);
}
