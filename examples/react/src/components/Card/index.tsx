import React from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.PropsWithChildren {
    className?: string;
}

export function Card({ className, ...props }: CardProps) {
    return (
        <div className={cn("card", className)} {...props} />
    );
}
