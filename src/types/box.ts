import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { COMPARATOR, IDENT, STATE, State, getNextId } from "../constants";
import { createComputed, type ComputedState } from "./computed";
import { PrimitiveState } from "./primitive";
import * as comparators from "../comparator";
import * as addons from "../addons";

import type { $Box } from "./box.extensions";

export type BoxState<T = any> = State & {
    readonly [STATE]: "box";
    [COMPARATOR]: comparators.Comparator<T>;

    /** @inert */
    get(): T;
    set(value: T);
    observe(reaction: Reaction<T>): () => void;
    /** @reactive */
    use(): T;
    change(func: (previous: T) => T): void;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
} & $Box<T>;

export function isBoxState(src: any): src is BoxState {
    return src?.[STATE] === "box";
}

export const BoxAccessor = {
    inert: <T = any>(state: BoxState<T>) => state.get(),
    reactive: <T = any>(state: BoxState<T>) => state.use()
};

export function createBox<T = any>(initialValue?: T) {
    const id = getNextId();
    let value = initialValue as T;
    let comparator = comparators.eqeqeq<T>;

    const box: BoxState<T> = {
        [STATE]: "box" as const,
        [IDENT]: id,

        get [COMPARATOR]() { return comparator },
        set [COMPARATOR](func) { comparator = func; },

        get() {
            return value;
        },

        set(newValue) {
            if(comparator(value, newValue)) return;

            value = newValue;
            trigger(id, newValue);
        },

        observe(reaction: Reaction<T>) {
            return addReaction(id, reaction);
        },

        use() {
            processDependents(id);
            return value;
        },

        change: func => box.set(func(value)),
        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(box.use()), eager, awaitPromise)
    };

    addons.use("box", box, {});

    return box;
}

export function boxPrimitive<T = any>(state: PrimitiveState<T>) {
    const box: BoxState<T> = {
        [STATE]: "box" as const,
        [IDENT]: state[IDENT],

        get [COMPARATOR]() {
            return state[COMPARATOR];
        },

        set [COMPARATOR](comparator) {
            state[COMPARATOR] = comparator;
        },

        get() {
            return state.get();
        },

        set(newValue) {
            state.value = newValue;
        },

        observe(reaction: Reaction<T>) {
            return state.observe(reaction);
        },

        use() {
            return state.use();
        },

        change: func => state.value = func(state.get()),

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(state.use()), eager, awaitPromise)
    };

    addons.use("box", box, { primitive: state });

    return box;
}
