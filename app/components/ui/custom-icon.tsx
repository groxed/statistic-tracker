import type { ElementType } from "react";

type CustomIconProps = {
	Element: ElementType;
};

export const CustomIcon = ({ Element }: CustomIconProps) => {
	return <Element className="w-3.5 h-3.5 text-white stroke-[2.5px]" />;
};
