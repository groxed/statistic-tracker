import { AlertCircle, Plus } from "lucide-react";
import type { PropsWithChildren, SubmitEventHandler } from "react";
import { Button } from "./button";
import { Icon } from "./icon";

type FormProps = {
	onSubmit: SubmitEventHandler<HTMLFormElement>;
	id: string;
	headerTitle: string;
	submitButtonText: string;
	error?: string;
};

export const Form = ({
	children,
	id,
	headerTitle,
	submitButtonText,
	error,
	onSubmit,
}: PropsWithChildren<FormProps>) => {
	return (
		<form
			onSubmit={onSubmit}
			className="bg-[#09090b] border border-[#27272a] p-4 rounded-lg flex flex-col gap-4 shadow-xl"
			id={id}
		>
			<div className="flex">
				<h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a]">
					{headerTitle}
				</h3>
			</div>

			{children}

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

			<Button type="submit" id={`${id}-submit-btn`}>
				<Icon Element={Plus} />
				<span>{submitButtonText}</span>
			</Button>
		</form>
	);
};
