// TODO: Do we want to compute/memoize these?
import type { ReactNode } from "react";

export type IfProps = {
    q: () => boolean;
    otherwise?: ReactNode;
} & ({
    children: ReactNode;
    then?: never;
} | {
    children?: never;
    then: ReactNode;
});

/**
 * Reactive ternary alternative, conditionally render if/else.
 *
 * Else is a reserved keyword, so otherwise is the equivalent.
 */
export function If({
    q, children, then, otherwise
}: IfProps) {
    const value = q();

    if(!value) {
        return otherwise;
    }

    return then || children;
}
