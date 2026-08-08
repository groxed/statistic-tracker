import {
	AlertTriangle,
	ArrowUpDown,
	Calendar,
	Check,
	ChevronDown,
	ChevronUp,
	Clock,
	Edit2,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import type { StatEntry } from "../types";
import { calculateCheckpoints } from "../utils/checkpoint";

interface StatAccordionProps {
	entries: StatEntry[];
	onUpdateEntry: (id: string, updated: Omit<StatEntry, "id">) => void;
	onDeleteEntry: (id: string) => void;
}

export default function StatAccordion({
	entries,
	onUpdateEntry,
	onDeleteEntry,
}: StatAccordionProps) {
	const getTodayString = () => {
		const d = new Date();
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};
	const todayStr = getTodayString();

	// Sort direction: true = latest first, false = oldest first
	const [isLatestFirst, setIsLatestFirst] = useState(true);

	// Accordion open/close states (key is the group name like "July 2026")
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{},
	);

	// Inline editing state
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDate, setEditDate] = useState("");
	const [editValue, setEditValue] = useState("");
	const [editIsCheckpoint, setEditIsCheckpoint] = useState(false);
	const [editIsEvent, setEditIsEvent] = useState(false);
	const [editEventName, setEditEventName] = useState("");
	const [editError, setEditError] = useState("");

	// Delete confirmation state
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// Parse a date to Month Year key, e.g., "July 2026"
	const getMonthYearKey = (dateStr: string) => {
		const d = new Date(dateStr);
		if (Number.isNaN(d.getTime())) return "Other / Raw Dates";
		return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
	};

	// Format date for list display, e.g., "04.06.2026"
	const formatDateLabel = (dateStr: string) => {
		const d = new Date(dateStr);
		if (Number.isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		return `${day}.${month}.${year}`;
	};

	// Compute all checkpoint calculations
	const checkpointMapping = calculateCheckpoints(entries);

	// Group entries and sort
	const sortedEntries = [...entries].sort((a, b) => {
		return isLatestFirst
			? b.date.localeCompare(a.date)
			: a.date.localeCompare(b.date);
	});

	// Grouped structure
	const groupedEntries: Record<string, StatEntry[]> = {};
	sortedEntries.forEach((entry) => {
		const key = getMonthYearKey(entry.date);
		if (!groupedEntries[key]) {
			groupedEntries[key] = [];
		}
		groupedEntries[key].push(entry);
	});

	// Unique list of group names in sorted order
	const groupKeys = Object.keys(groupedEntries).sort((a, b) => {
		// To sort group headers properly, parse a representative date from each group
		const dateA = new Date(groupedEntries[a][0].date);
		const dateB = new Date(groupedEntries[b][0].date);
		return isLatestFirst
			? dateB.getTime() - dateA.getTime()
			: dateA.getTime() - dateB.getTime();
	});

	// Initialize expanded state for the very first/latest group if not set yet
	useState(() => {
		if (groupKeys.length > 0) {
			setExpandedGroups({ [groupKeys[0]]: true });
		}
	});

	const toggleGroup = (key: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	// Start Editing
	const handleStartEdit = (entry: StatEntry) => {
		setEditingId(entry.id);
		setEditDate(entry.date);
		setEditValue(
			entry.value !== undefined && entry.value !== null
				? entry.value.toString()
				: "",
		);
		setEditIsCheckpoint(!!entry.isCheckpoint);
		setEditIsEvent(!!entry.isEvent);
		setEditEventName(entry.eventName || "");
		setEditError("");
		setConfirmDeleteId(null); // Cancel any delete prompts active
	};

	// Save Editing
	const handleSaveEdit = (id: string) => {
		if (!editDate) {
			setEditError("Please select a valid date.");
			return;
		}

		if (editIsEvent) {
			if (!editEventName.trim()) {
				setEditError("Milestone/Event name is required.");
				return;
			}
			onUpdateEntry(id, {
				date: editDate,
				value: null,
				isCheckpoint: false,
				isEvent: true,
				eventName: editEventName.trim(),
			});
		} else {
			const valNum = Number(editValue);
			if (editValue.trim() === "" || Number.isNaN(valNum)) {
				setEditError("Statistic value must be a number.");
				return;
			}
			onUpdateEntry(id, {
				date: editDate,
				value: valNum,
				isCheckpoint: editIsCheckpoint,
				isEvent: false,
			});
		}
		setEditingId(null);
	};

	// Cancel Editing
	const handleCancelEdit = () => {
		setEditingId(null);
		setEditError("");
	};

	return (
		<div className="w-full flex flex-col gap-4" id="stats-accordion-widget">
			{/* List Header controls */}
			<div className="flex items-center justify-between border-b border-[#27272a] pb-3">
				<h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] flex items-center gap-2">
					<Clock className="w-4 h-4 text-blue-500" />
					Recorded History Sorted by Date
				</h3>

				<button
					type="button"
					onClick={() => setIsLatestFirst(!isLatestFirst)}
					className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#fafafa] bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] px-2.5 py-1.5 rounded transition-all"
					title={
						isLatestFirst ? "Showing Latest First" : "Showing Oldest First"
					}
					id="sort-toggle-button"
				>
					<ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
					<span>{isLatestFirst ? "Latest" : "Oldest"}</span>
				</button>
			</div>

			{entries.length === 0 ? (
				<div
					className="text-center py-6 text-[#52525b] text-xs font-mono border border-dashed border-[#27272a] rounded bg-[#18181b]/10"
					id="accordion-empty-state"
				>
					No entries recorded yet.
				</div>
			) : (
				<div className="flex flex-col gap-3" id="accordion-groups-list">
					{groupKeys.map((groupName) => {
						const isExpanded = !!expandedGroups[groupName];
						const groupItems = groupedEntries[groupName];

						return (
							<div
								key={groupName}
								className="border border-[#27272a] bg-[#09090b] rounded overflow-hidden transition-all duration-200"
								id={`accordion-item-${groupName.replace(/\s+/g, "-").toLowerCase()}`}
							>
								{/* Accordion Trigger Header */}
								<button
									type="button"
									onClick={() => toggleGroup(groupName)}
									className="w-full flex items-center justify-between px-4 py-3 bg-[#18181b]/30 hover:bg-[#18181b]/60 text-left transition-all duration-150 cursor-pointer"
									aria-expanded={isExpanded}
								>
									<div className="flex items-center gap-3">
										<span className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
											{groupName}
										</span>
										<span className="text-[10px] font-mono text-[#71717a] bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a]/30">
											{groupItems.length}{" "}
											{groupItems.length === 1 ? "entry" : "entries"}
										</span>
									</div>
									{isExpanded ? (
										<ChevronUp className="w-4 h-4 text-[#71717a]" />
									) : (
										<ChevronDown className="w-4 h-4 text-[#71717a]" />
									)}
								</button>

								{/* Accordion Content Panel */}
								{isExpanded && (
									<div className="border-t border-[#27272a]/60 divide-y divide-[#27272a]/40 bg-[#18181b]/10">
										{groupItems.map((entry) => {
											const isEditing = editingId === entry.id;
											const isConfirmingDelete = confirmDeleteId === entry.id;

											return (
												<div
													key={entry.id}
													className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-150 ${
														isEditing
															? "bg-blue-950/10 border-l-2 border-blue-500"
															: entry.isEvent
																? entry.date > todayStr
																	? "bg-amber-950/5 border-l-2 border-amber-500/60 hover:bg-amber-950/10"
																	: "bg-emerald-950/5 border-l-2 border-emerald-500/60 hover:bg-emerald-950/10"
																: ""
													}`}
													id={`entry-row-${entry.id}`}
												>
													{/* 1. EDIT MODE */}
													{isEditing ? (
														<div
															className="w-full flex flex-col gap-3"
															id={`edit-form-${entry.id}`}
														>
															<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
																<div className="flex flex-col gap-1">
																	<label className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">
																		<input
																			type="date"
																			value={editDate}
																			onChange={(e) => {
																				setEditDate(e.target.value);
																				setEditError("");
																			}}
																			className="w-full bg-[#18181b] text-xs text-[#fafafa] px-2.5 py-1.5 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-mono"
																		/>
																		Date
																	</label>
																</div>
																{!editIsEvent ? (
																	<div className="flex flex-col gap-1">
																		<label className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">
																			<input
																				type="number"
																				step="any"
																				value={editValue}
																				onChange={(e) => {
																					setEditValue(e.target.value);
																					setEditError("");
																				}}
																				placeholder="Enter value"
																				className="w-full bg-[#18181b] text-xs text-[#fafafa] px-2.5 py-1.5 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-mono"
																			/>
																			Value
																		</label>
																	</div>
																) : (
																	<div className="flex flex-col gap-1">
																		<label className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">
																			<input
																				type="text"
																				value={editEventName}
																				onChange={(e) => {
																					setEditEventName(e.target.value);
																					setEditError("");
																				}}
																				placeholder="Enter event name"
																				className="w-full bg-[#18181b] text-xs text-[#fafafa] px-2.5 py-1.5 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-sans"
																			/>
																			Event Name
																		</label>
																	</div>
																)}
															</div>

															{/* Edit Toggles */}
															<div className="flex flex-wrap items-center gap-4 py-1">
																<div className="flex items-center gap-2">
																	<input
																		type="checkbox"
																		id={`edit-event-${entry.id}`}
																		checked={editIsEvent}
																		onChange={(e) => {
																			setEditIsEvent(e.target.checked);
																			setEditError("");
																		}}
																		className="w-4 h-4 text-emerald-500 bg-[#18181b] border-[#27272a] rounded focus:ring-emerald-500/20 focus:ring-1 focus:outline-none cursor-pointer"
																	/>
																	<label
																		htmlFor={`edit-event-${entry.id}`}
																		className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] cursor-pointer select-none"
																	>
																		Is Non-Statistic Checkpoint?
																	</label>
																</div>

																{!editIsEvent && (
																	<div className="flex items-center gap-2">
																		<input
																			type="checkbox"
																			id={`edit-checkpoint-${entry.id}`}
																			checked={editIsCheckpoint}
																			onChange={(e) =>
																				setEditIsCheckpoint(e.target.checked)
																			}
																			className="w-4 h-4 text-blue-600 bg-[#18181b] border-[#27272a] rounded focus:ring-blue-500/20 focus:ring-1 focus:outline-none cursor-pointer"
																		/>
																		<label
																			htmlFor={`edit-checkpoint-${entry.id}`}
																			className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] cursor-pointer select-none"
																		>
																			Is Statistic Checkpoint?
																		</label>
																	</div>
																)}
															</div>

															{editError && (
																<p className="text-xs text-rose-400 font-mono uppercase tracking-wide flex items-center gap-1.5">
																	<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
																	{editError}
																</p>
															)}

															<div className="flex items-center gap-2 mt-1">
																<button
																	type="button"
																	onClick={() => handleSaveEdit(entry.id)}
																	className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
																	id={`save-edit-btn-${entry.id}`}
																>
																	<Check className="w-3.5 h-3.5" />
																	<span>Save Changes</span>
																</button>
																<button
																	type="button"
																	onClick={handleCancelEdit}
																	className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
																	id={`cancel-edit-btn-${entry.id}`}
																>
																	<X className="w-3.5 h-3.5" />
																	<span>Cancel</span>
																</button>
															</div>
														</div>
													) : (
														/* 2. READ MODE & DELETE CONFIRMATION */
														<>
															{/* Display values */}
															<div className="flex items-center gap-3.5 flex-1 flex-wrap">
																<div className="flex items-center gap-2 text-[#fafafa] bg-[#18181b]/50 border border-[#27272a]/40 px-2.5 py-1 rounded">
																	<Calendar className="w-3.5 h-3.5 text-[#71717a]" />
																	<span className="text-xs font-mono text-[#a1a1aa]">
																		{formatDateLabel(entry.date)}
																	</span>
																</div>
																{entry.isEvent ? (
																	<div className="flex items-baseline gap-1.5">
																		<span
																			className={`text-[10px] font-bold uppercase tracking-wider ${entry.date > todayStr ? "text-amber-500" : "text-emerald-500"}`}
																		>
																			{entry.date > todayStr
																				? "Planned Event:"
																				: "Event:"}
																		</span>
																		<span
																			className={`text-xs font-bold tracking-tight ${entry.date > todayStr ? "text-amber-400" : "text-emerald-400"}`}
																		>
																			{entry.eventName || "Milestone Event"}
																		</span>
																	</div>
																) : (
																	<div className="flex items-baseline gap-1.5">
																		<span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
																			Val:
																		</span>
																		<span className="text-base font-bold text-[#fafafa] font-mono tracking-tight">
																			{entry.value}
																		</span>
																	</div>
																)}

																<div className="flex flex-col gap-1">
																	{checkpointMapping[entry.id]
																		?.checkpointText && (
																		<span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded">
																			{
																				checkpointMapping[entry.id]
																					?.checkpointText
																			}
																		</span>
																	)}
																	{checkpointMapping[entry.id]?.eventText && (
																		<span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">
																			{checkpointMapping[entry.id]?.eventText}
																		</span>
																	)}
																</div>
															</div>

															{/* Action buttons */}
															<div className="flex items-center gap-2 sm:self-center">
																{isConfirmingDelete ? (
																	<div
																		className="flex items-center gap-1.5 bg-rose-950/10 border border-rose-900/30 p-1 rounded animate-fadeIn"
																		id={`confirm-box-${entry.id}`}
																	>
																		<span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-1.5 flex items-center gap-1">
																			<AlertTriangle className="w-3 h-3" />{" "}
																			Delete?
																		</span>
																		<button
																			type="button"
																			onClick={() => {
																				onDeleteEntry(entry.id);
																				setConfirmDeleteId(null);
																			}}
																			className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all"
																			id={`confirm-delete-yes-${entry.id}`}
																		>
																			Yes
																		</button>
																		<button
																			type="button"
																			onClick={() => setConfirmDeleteId(null)}
																			className="bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all"
																			id={`confirm-delete-no-${entry.id}`}
																		>
																			No
																		</button>
																	</div>
																) : (
																	<>
																		<button
																			type="button"
																			onClick={() => handleStartEdit(entry)}
																			className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#71717a] hover:text-[#fafafa] bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] px-2.5 py-1.5 rounded transition-all"
																			title="Edit Entry"
																			id={`edit-btn-${entry.id}`}
																		>
																			<Edit2 className="w-3 h-3 text-blue-500" />
																			<span>Edit</span>
																		</button>
																		<button
																			type="button"
																			onClick={() => {
																				setConfirmDeleteId(entry.id);
																				setEditingId(null); // Cancel any edits
																			}}
																			className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#71717a] hover:text-rose-400 bg-[#18181b] border border-[#27272a] hover:border-rose-950/40 hover:bg-rose-950/10 px-2.5 py-1.5 rounded transition-all"
																			title="Delete Entry"
																			id={`delete-btn-${entry.id}`}
																		>
																			<Trash2 className="w-3 h-3 text-rose-500" />
																			<span>Delete</span>
																		</button>
																	</>
																)}
															</div>
														</>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
