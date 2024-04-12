// TODO: Do we want to compute these?
import { useComputed } from "implementations/react/hooks";
import React, {
    useMemo,
    type ReactNode,
    type ReactElement
} from "react";

export type WithProps<T = any, P extends string = "value"> = { q: () => T; prop?: P; } & ({
    children: ReactElement<{ value: T }>;
    run?: never;
} | {
    children?: never;
    run: (value: T) => ReactNode;
});

/**
 * Inject a property into child props based on a reactive value.
 */
export function With<T = any, P extends string = "value">({
    q, children, prop = "value" as P, run
}: WithProps<T, P>) {
    const value = useComputed(q).use();

    return useMemo(() => {
        if(run) {
            return run(value);
        }

        return React.Children.map(children, child => {
            if(!React.isValidElement(child)) return child;

            return React.cloneElement(child, { [prop]: value });
        });
    }, [ value, prop ]);
}
