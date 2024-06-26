// TODO: Do we want to compute/memoize these?
import type { ReactNode } from "react";

export type SwitchProps<T extends string | symbol | number = any> = {
    q: () => T;
    when: Partial<Record<T, ReactNode>> & { default?: ReactNode };
};

/**
 * Equivalent to nested ternary or a switch statement, allows conditional rendering based on a given value
 */
export function Switch<T extends string | symbol | number = any>({
    q, when
}: SwitchProps<T>) {
    const value = q();

    return Object.hasOwn(when, value) ? when[value] : when.default;
}
