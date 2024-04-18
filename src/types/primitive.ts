import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { IDENT, STATE, COMPARATOR, State, getNextId } from "../constants";
import { createComputed, type ComputedState } from "./computed";
import * as comparators from "../comparator";
import * as addons from "../addons";

import type { $Primitive } from "./primitive.extensions";

export type PrimitiveState<T = any> = State & {
    readonly [STATE]: "primitive";
    [COMPARATOR]: comparators.Comparator<T>;

    /** @reactive Getting the value will make it reactive */
    get value(): T;
    set value(value: T);

    /** @inert */
    get(): T;

    set(updater: (value: T) => T);
    observe(reaction: Reaction<T>): () => void;

    /** @reactive */
    use(): T;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
} & $Primitive<T>;

// TODO: Non-primitive
export type InferPrimitive<T = any> = T extends PrimitiveState<infer U> ? U : T;

export function isPrimitiveState(src: any): src is PrimitiveState {
    return src?.[STATE] === "primitive";
}

export const PrimitiveAccessor = {
    inert: <T = any>(state: PrimitiveState<T>) => state.get(),
    reactive: <T = any>(state: PrimitiveState<T>) => state.value
};

export function createPrimitive<T = any>(initialValue?: T) {
    if(isPrimitiveState(initialValue)) {
        return initialValue as PrimitiveState<T>;
    }

    const id = getNextId();
    let value = initialValue as T;
    let comparator = comparators.eqeqeq<T>;

    const primitive = {
        [STATE]: "primitive",
        [IDENT]: id,

        get [COMPARATOR]() { return comparator },
        set [COMPARATOR](func) { comparator = func; },

        get() {
            return value;
        },

        get value() {
            processDependents(id);
            return value;
        },

        set value(newValue: T) {
            if(comparator(value, newValue)) return;

            value = newValue;
            trigger(id, newValue);
        },

        set(modifier) {
            const newValue = modifier(value);
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

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(primitive.value), eager, awaitPromise)
    };

    addons.use("primitive", primitive, {});
    return primitive as PrimitiveState<T>;
}
