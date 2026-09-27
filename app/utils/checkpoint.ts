import type { StatEntry } from "../types";

/**
 * Parses YYYY-MM-DD date string as UTC midnight.
 * Immunizes calculation against timezone and daylight saving shifts.
 */
export function getUTCDate(dateStr: string): number {
	const parts = dateStr.split("-");
	if (parts.length !== 3) {
		const d = new Date(dateStr);
		return Number.isNaN(d.getTime()) ? 0 : d.getTime();
	}
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	return Date.UTC(year, month, day);
}

/**
 * Returns formatted string representation of time passed between two date strings.
 */
export function formatTimePassed(
	startStr: string,
	endStr: string,
	type: "checkpoint" | "event",
	eventName?: string,
): string {
	const msPerDay = 1000 * 60 * 60 * 24;
	const startMs = getUTCDate(startStr);
	const endMs = getUTCDate(endStr);

	const diffDays = Math.round((endMs - startMs) / msPerDay);
	if (diffDays < 0) return "";

	const label =
		type === "event"
			? `since event${eventName ? ` (${eventName})` : ""}`
			: "since checkpoint";

	if (diffDays === 0) {
		return `0 days ${label}`;
	} else if (diffDays % 7 === 0) {
		const weeks = diffDays / 7;
		return `${weeks} ${weeks === 1 ? "week" : "weeks"} ${label}`;
	} else if (diffDays < 7) {
		return `${diffDays} ${diffDays === 1 ? "day" : "days"} ${label}`;
	} else {
		const weeks = Math.floor(diffDays / 7);
		const remDays = diffDays % 7;
		return `${weeks} ${weeks === 1 ? "week" : "weeks"}, ${remDays} ${remDays === 1 ? "day" : "days"} ${label}`;
	}
}

export interface CheckpointData {
	daysPassedCheckpoint: number | null;
	checkpointText: string;
	daysPassedEvent: number | null;
	eventText: string;
}

/**
 * Computes the distance since the last checkpoint and last event for each entry in chronological order.
 * Returns a mapping of entry ID to checkpoint and event tracking information.
 */
export function calculateCheckpoints(
	entries: StatEntry[],
): Record<string, CheckpointData | null> {
	const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
	const mapping: Record<string, CheckpointData | null> = {};

	let lastCheckpoint: StatEntry | null = null;
	let lastEvent: StatEntry | null = null;
	const msPerDay = 1000 * 60 * 60 * 24;

	for (const entry of sorted) {
		const itemData: CheckpointData = {
			daysPassedCheckpoint: null,
			checkpointText: "",
			daysPassedEvent: null,
			eventText: "",
		};

		if (lastCheckpoint) {
			const startMs = getUTCDate(lastCheckpoint.date);
			const endMs = getUTCDate(entry.date);
			const diffDays = Math.round((endMs - startMs) / msPerDay);
			if (diffDays >= 0) {
				itemData.daysPassedCheckpoint = diffDays;
				itemData.checkpointText = formatTimePassed(
					lastCheckpoint.date,
					entry.date,
					"checkpoint",
				);
			}
		}

		if (lastEvent) {
			const startMs = getUTCDate(lastEvent.date);
			const endMs = getUTCDate(entry.date);
			const diffDays = Math.round((endMs - startMs) / msPerDay);
			if (diffDays >= 0) {
				itemData.daysPassedEvent = diffDays;
				itemData.eventText = formatTimePassed(
					lastEvent.date,
					entry.date,
					"event",
					lastEvent.eventName,
				);
			}
		}

		mapping[entry.id] = itemData;

		// Update references for subsequent entries
		if (entry.isCheckpoint && !entry.isEvent) {
			lastCheckpoint = entry;
		}
		if (entry.isEvent) {
			lastEvent = entry;
		}
	}

	return mapping;
}
