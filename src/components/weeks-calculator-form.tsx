import { type SubmitEvent, useState } from "react";
import { getDefaultFormattedDate, getTodayString } from "../utils";
import { Form } from "./ui/form";
import { Input } from "./ui/input";

interface WeeksCalculatorFormProps {
	formatResultDate?: (date: Date) => string;
}

type CalculationDirection = "after" | "before";

export default function WeeksCalculatorForm({
	formatResultDate = getDefaultFormattedDate,
}: WeeksCalculatorFormProps) {
	const [date, setDate] = useState(getTodayString());
	const [weeks, setWeeks] = useState("");
	const [direction, setDirection] = useState<CalculationDirection>("after");
	const [result, setResult] = useState("");
	const [error, setError] = useState("");

	const clearError = () => setError("");

	const onFieldChange = (callback: () => void) => {
		callback();
		clearError();
	};

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		clearError();

		if (!date) {
			setError("Please select a valid date.");
			return;
		}

		if (!weeks.trim()) {
			setError("Please enter the number of weeks.");
			return;
		}

		const numericWeeks = Number(weeks);

		if (Number.isNaN(numericWeeks)) {
			setError("Weeks must be a valid number.");
			return;
		}

		const calculatedDate = new Date(date);
		const days = numericWeeks * 7;

		calculatedDate.setDate(
			calculatedDate.getDate() + (direction === "after" ? days : -days),
		);

		setResult(formatResultDate(calculatedDate));
	};

	return (
		<Form
			headerTitle="Weeks Calculator"
			submitButtonText="Calculate Date"
			onSubmit={handleSubmit}
			id="weeks-calculator-form"
			error={error}
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Input
					label="Date"
					id="input-date"
					type="date"
					value={date}
					onChange={(e) =>
						onFieldChange(() => {
							setDate(e.target.value);
							setResult("");
						})
					}
					className="w-full bg-[#18181b] text-[#fafafa] text-sm font-mono px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
					required
				/>

				<Input
					id="input-weeks"
					label="Number of Weeks"
					type="number"
					min="0"
					step="1"
					value={weeks}
					onChange={(e) =>
						onFieldChange(() => {
							setWeeks(e.target.value);
							setResult("");
						})
					}
					placeholder="e.g. 12"
					required
				/>
			</div>

			<div
				id="direction-container"
				className="flex items-center gap-6 py-2 text-sm"
			>
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="direction"
						checked={direction === "after"}
						onChange={() => {
							setDirection("after");
							setResult("");
						}}
					/>
					After date
				</label>

				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="direction"
						checked={direction === "before"}
						onChange={() => {
							setDirection("before");
							setResult("");
						}}
					/>
					Before date
				</label>
			</div>

			{!!result && <div>Result: {result}</div>}
		</Form>
	);
}
