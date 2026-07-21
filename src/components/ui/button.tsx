import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {};

export const Button = ({
  children,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      {...props}
      className="w-full md:w-auto md:self-end flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
};
