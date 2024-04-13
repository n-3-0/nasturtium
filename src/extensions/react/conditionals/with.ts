// TODO: Do we want to compute/memoize these?
import React, {
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
    const value = q();

    if(run) {
        return run(value);
    }

    const child = React.Children.only(children);
    return React.cloneElement(child, { [prop]: value });
}
