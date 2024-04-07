import { Reaction, addReaction, trigger, handleSubscription } from "../manifold";
import { COMPARATOR, IDENT, STATE, State, getNextId } from "../constants";
import { PrimitiveState } from "./primitive";
import * as comparators from "../comparator";
import { createComputed, type ComputedState } from "./computed";

export interface BoxState<T = any> extends State {
    get(): T;
    set(value: T);
    observe(reaction: Reaction<T>): () => void;
    /** @reactive */
    use(): T;
    change(func: (previous: T) => T): void;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
}

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

    const box: BoxState<T> = Object.freeze({
        [STATE]: "box",
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
            handleSubscription(id, {
                stateContainer: box,
                id,
                get: () => value,
            });

            return value;
        },

        change: func => box.set(func(value)),
        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(box.use()), eager, awaitPromise)
    });

    return box;
}

export function boxPrimitive<T = any>(state: PrimitiveState<T>) {
    const box: BoxState<T> = Object.freeze({
        [STATE]: "box",
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
    });

    return box;
}
