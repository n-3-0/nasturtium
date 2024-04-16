import { Reaction, trigger, processDependents } from "../manifold";
import { COMPARATOR, IDENT, STATE, State, getNextId } from "../constants";
import * as comparators from "../comparator";
import { createComputed, type ComputedState } from "./computed";

import type { $Array } from "./array.extensions";

// TODO: concat is special and needs special treatment
// TODO: Is there a way to derive these efficiently?
export const listenableProps: (keyof Array<any>)[] = [
    "at", "entries", "every", "filter",
    "find", "findIndex", "flat", "flatMap",
    "forEach", "includes", "indexOf", "join",
    "keys", "lastIndexOf", "map", "reduce",
    "reduceRight", "slice", "some", "values",
];

export const mutativeProps: (keyof Array<any>)[] = [
    "copyWithin", "fill",
    "pop", "push",
    "reverse", "shift",
    "sort", "splice",
    "unshift"
];

export const forbiddenProps = ["observe", STATE, IDENT, "use"];

// TODO: More complex type with standard methods (e.g. get()) to make it like the others
// TODO: Should the trigger(id, []) pass in a reference to the state in a read-only way?
export type ArrayState<T = any> = State & T[] & {
    readonly [STATE]: "array";
    [COMPARATOR]: comparators.Comparator<T>;

    /** @inert Non-reactive equivalent of at(i) */
    get(i: number)
    observe(reaction: Reaction<T>): () => void;

    makeComputed<U = any>(func: (value: ArrayState<T>) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
} & $Array<T>;

export function isArrayState(src: any): src is ArrayState {
    return src?.[STATE] === "array";
}

export const ArrayAccessor = {
    inert: <T = any>(state: ArrayState<T>, index: number) => state.get(index),
    reactive: <T = any>(state: ArrayState<T>, index: number) => state[index]
};

// TODO: Implement `deep` for array of observables
// TODO: Implement "subscribe to specific index" array-type state
export function createArray<T = any>(initialValue?: T[]) {
    const state = [...initialValue ?? []];
    const id = getNextId();

    // TODO: implement observe()
    const fakePrototype = {
        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(array), eager, awaitPromise),

        concat: (...others) => state.concat(...others),
        copyWithin: () => { throw new Error("copyWithin() not yet supported") },
    };

    for(const prop of listenableProps) {
        if(fakePrototype[prop]) continue;
        fakePrototype[prop] = (...args) => {
            processDependents(id);
            return (state as any)[prop](...args);
        };
    }

    for(const prop of mutativeProps) {
        if(fakePrototype[prop]) continue;
        fakePrototype[prop] = (...args) => {
            const result = (state as any)[prop](...args);
            trigger(id, []);
            return result;
        };
    }

    const basicGetter = i => state[i];

    // TODO: implement "observe"
    const array = new Proxy(state, {
        get(_, prop) {
            if(prop === STATE) return "array";
            if(prop === IDENT) return id;
            // TODO: Implement swappable comparators
            if(prop === COMPARATOR) return comparators.eqeqeq;

            if(fakePrototype[prop]) {
                return fakePrototype[prop];
            }

            if(prop === "get") {
                return basicGetter;
            }

            if(prop === "length") {
                processDependents(id);
                return state.length;
            }

            // TODO: Make this secure against mutations
            if(prop === Symbol.iterator) {
                processDependents(id);
                return state[Symbol.iterator];
            }

            // TODO: Support other symbols
            if(typeof prop === "symbol") {
                console.log("Found some weird symbol", prop);
                return null;
            }

            if(!isNaN(Number(prop))) {
                processDependents(id);
                return state[prop];
            }
        },
        set(_, prop, value) {
            if(forbiddenProps.includes(prop)) return true;
            if(typeof prop === "symbol") return true; // Just don't worry about it for now
            if(isNaN(Number(prop))) return true; // Filters out prototype methods

            state[prop] = value;
            trigger(id, []);
            return true;
        },
        has(_, prop) {
            return Object.hasOwn(state, prop);
        }
    }) as ArrayState<T>;

    return array;
}
