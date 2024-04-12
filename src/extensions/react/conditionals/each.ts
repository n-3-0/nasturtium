// TODO: Do we want to compute these?
import { useComputed } from "implementations/react/hooks";
import React, {
    useMemo,
    type ReactNode,
    type ReactElement
} from "react";

export type EachProps<T extends any[] = any[]> = { q: () => [...T]; } & ({
    children: ReactElement<{ item: T[number], index: number, array: T }>;
    run?: never;
} | {
    children?: never;
    run: (item: T[number], index: number, array: T) => ReactNode;
});

/**
 * Render children repeatedly from the results of an array
 */
export function Each<T extends any[] = any[]>({
    q, children, run
}: EachProps<T>) {
    const value = useComputed(q).use();

    return useMemo(() => {
        if(run) {
            return value?.map(run as any);
        }

        return value?.map((item, index, array: any) => {
            return React.Children.map(children, child => {
                if(!React.isValidElement(child)) return child;

                return React.cloneElement(child, {
                    item, index, array
                });
            });
        });
    }, [ value ]);
}
