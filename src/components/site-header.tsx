import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ReactNode } from "react";
import { Spinner } from "./ui/spinner";

type SiteHeaderProps = {
  title: string;
  loading?: boolean;
  children?: ReactNode;
};

const SiteHeader = ({ title, loading, children }: SiteHeaderProps) => {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) mb-4">
      <div className="flex w-full items-center gap-1">
        <SidebarTrigger className="ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-8" />
        <h1 className="text-xl font-medium">{title}</h1>
        {loading && <Spinner />}
        {children && <div className="flex items-center gap-2 ml-auto">{children}</div>}
      </div>
    </header>
  );
};

export default SiteHeader;
