import { PropsWithChildren } from "react";

type ContainerProps = {};

export const Container = ({ children }: PropsWithChildren<ContainerProps>) => {
  return (
    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded flex flex-col gap-1 transition-all duration-200">
      {children}
    </div>
  );
};
