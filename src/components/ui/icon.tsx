import { ElementType } from "react";

type IconProps = {
  Element: ElementType;
};

export const Icon = ({ Element }: IconProps) => {
  return <Element className="w-3.5 h-3.5 text-white stroke-[2.5px]" />;
};
