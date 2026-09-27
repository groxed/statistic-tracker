import type { InputHTMLAttributes } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export const Checkbox = ({ id, label, ...props }: CheckboxProps) => {
	return (
		<div className="flex items-center gap-2.5">
			<input
				type="checkbox"
				id={id}
				className="w-4 h-4 text-emerald-500 bg-[#18181b] border-[#27272a] rounded focus:ring-emerald-500/20 focus:ring-1 focus:outline-none cursor-pointer"
				{...props}
			/>
			<label
				htmlFor={id}
				className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] cursor-pointer select-none flex flex-wrap items-center gap-1"
			>
				<span>{label}</span>
			</label>
		</div>
	);
};
