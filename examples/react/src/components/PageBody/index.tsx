import { cn } from "../../utils/cn";
import "./style.scss";

export interface PageBodyProps {
    className?: string;
    children?: any;
    layout?: "horizontal" | "vertical";
}

export function PageBody({
    className,
    children,
    layout = "vertical"
}: PageBodyProps) {
    return (
        <section className={cn("page-body", `is-${layout}`, className)} children={children} />
    )
}
