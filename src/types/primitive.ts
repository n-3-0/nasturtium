import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { IDENT, STATE, INTERNALS, COMPARATOR, State, getNextId } from "../constants";
import { Box, makeBox } from "../box";
import * as comparators from "../comparator";
import { createComputed, type ComputedState } from "./computed";

export interface PrimitiveState<T = any> extends State {
    readonly [STATE]: "primitive";
    [COMPARATOR]: comparators.Comparator<T>;

    /** @reactive Getting the value will make it reactive */
    get value(): T;
    set value(value: T);

    get(): T;
    set(updater: (value: T) => T);

    observe(reaction: Reaction<T>): () => void;

    /** @reactive Will react to changes if no reaction func is provided */
    use(): T;
    use(reaction?: Reaction<T>): void;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
}

// TODO: Non-primitive
export type InferPrimitive<T = any> = T extends PrimitiveState<infer U> ? U : T;

export function isPrimitiveState(src: any): src is PrimitiveState {
    return src?.[STATE] === "primitive";
}

export function getPrimitiveInternal<T>(state: PrimitiveState<T>): Box<T> {
    return state[INTERNALS];
}

export const PrimitiveAccessor = {
    inert: <T = any>(state: PrimitiveState<T>) => state.get(),
    reactive: <T = any>(state: PrimitiveState<T>) => state.value
};

export function createPrimitive<T = any>(
    initialValue?: T,
    id = getNextId(),
    box: Box<T> = null!
) {
    if(isPrimitiveState(initialValue)) return initialValue as PrimitiveState<T>;

    if(!box) {
        box = makeBox(initialValue);
    }

    let comparator = comparators.eqeqeq<T>;
    const primitive = {
        [STATE]: "primitive",
        [IDENT]: id,
        [INTERNALS]: box,

        get [COMPARATOR]() { return comparator },
        set [COMPARATOR](func) { comparator = func; },

        get() {
            return box.value;
        },

        get value() {
            processDependents(id);
            return box.value;
        },

        set value(newValue: T) {
            if(comparator(box.value, newValue)) return;

            box.value = newValue;
            trigger(id, newValue);
        },

        set(modifier) {
            const newValue = modifier(box.value);
            if(comparator(box.value, newValue)) return;

            box.value = newValue;
            trigger(id, newValue);
        },

        observe(reaction: Reaction<T>) {
            return addReaction(id, reaction);
        },

        // TODO: Is this good enough?
        use(reaction?: Reaction<T>) {
            if(!reaction) {
                processDependents(id);
                return box.value;
            }

            reaction(box.value, id);
            processDependents(id);
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(primitive.value), eager, awaitPromise)
    };

    return primitive as PrimitiveState<T>;
}
