import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export const Input = ({ id, label, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] flex items-center gap-1.5"
      >
        <span>{label}</span>
      </label>
      <input
        id={id}
        className="w-full bg-[#18181b] text-[#fafafa] text-sm font-mono px-3 py-2 rounded border border-[#27272a] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-[#3f3f46]"
        {...props}
      />
    </div>
  );
};
