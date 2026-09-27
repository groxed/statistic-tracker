import { type SubmitEvent, useState } from "react";
import type { StatEntry } from "../types";
import { getTodayString } from "../utils";
import { Checkbox } from "./ui/checkbox";
import { Form } from "./ui/form";
import { Input } from "./ui/input";

interface StatFormProps {
	onSubmit: (entry: Omit<StatEntry, "id">) => void;
}

export default function StatForm({ onSubmit }: StatFormProps) {
	const [date, setDate] = useState(getTodayString());
	const [value, setValue] = useState("");
	const [isCheckpoint, setIsCheckpoint] = useState(false);
	const [isEvent, setIsEvent] = useState(false);
	const [eventName, setEventName] = useState("");
	const [error, setError] = useState("");

	const clearError = () => {
		setError("");
	};
	const clearForm = () => {
		setValue("");
		setEventName("");
		setIsCheckpoint(false);
		setIsEvent(false);
	};

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		clearError();

		if (!date) {
			setError("Please select a valid date.");
			return;
		}

		if (isEvent) {
			if (!eventName.trim()) {
				setError("Please enter a milestone/event name.");
				return;
			}
			onSubmit({
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
			if (Number.isNaN(numericValue)) {
				setError("Statistic value must be a valid number.");
				return;
			}

			onSubmit({
				date,
				value: numericValue,
				isCheckpoint,
				isEvent: false,
			});
		}

		clearForm();
	};

	const onFieldChange = (fieldChangeCb: () => void) => {
		fieldChangeCb();
		clearError();
	};

	return (
		<Form
			headerTitle="Log New Entry"
			submitButtonText="Add Entry"
			onSubmit={handleSubmit}
			id="add-entry-form"
			error={error}
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Input
					label="Date"
					id="input-date"
					type="date"
					value={date}
					onChange={(e) => {
						onFieldChange(() => setDate(e.target.value));
					}}
					className="w-full bg-[#18181b] text-[#fafafa] text-sm font-mono px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
					required
				/>

				{!isEvent ? (
					<Input
						id="input-value"
						type="number"
						step="any"
						value={value}
						onChange={(e) => {
							onFieldChange(() => setValue(e.target.value));
						}}
						placeholder="e.g. 450"
						required
						label="Value"
					/>
				) : (
					<Input
						id="input-event-name"
						label="Event / Milestone Name"
						type="text"
						value={eventName}
						onChange={(e) => {
							onFieldChange(() => setEventName(e.target.value));
						}}
						placeholder="e.g. Started new training schedule"
						required
					/>
				)}
			</div>

			<div
				className="flex flex-col sm:flex-row sm:items-center gap-4 py-1"
				id="form-toggles-container"
			>
				<Checkbox
					id="input-is-event"
					checked={isEvent}
					onChange={(e) => {
						onFieldChange(() => setIsEvent(e.target.checked));
					}}
					label="Mark as event"
				/>

				{!isEvent && (
					<Checkbox
						id="input-is-checkpoint"
						checked={isCheckpoint}
						onChange={(e) => setIsCheckpoint(e.target.checked)}
						label="Mark as a checkpoint"
					/>
				)}
			</div>
		</Form>
	);
}
