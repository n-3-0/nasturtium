// Tuple is like an Array, but with individually-reactive elements

import { STATE, getNextId, type State, IDENT, COMPARATOR, INTERNALS } from "../constants";
import { handleSubscription, trigger, type Reaction, Cleanup, addReaction } from "../manifold";
import { forbiddenProps, listenableProps, mutativeProps } from "./array";
import { createComputed, type ComputedState } from "./computed";
import * as comparators from "../comparator";

type TupleExtensions<T extends any[] = any[]> = {
    readonly [STATE]: "tuple";

    /** @inert */
    concat<U extends any[]>(...others: U[]): [...T, ...U];

    /** @reactive equivalent to concat() */
    join<U extends any[]>(...others: U[]): [...T, ...U];

    /** @inert */
    get<I extends number>(i: I): T[I];

    /** @inert */
    size(): number;

    /** Swap two array items */
    swap(a: number, b: number);

    /** Useful for basic array functions that require non-reactivity. Returns a copy */
    readonly inert: T;

    /** @reactive */
    length: number;

    /** Replace entire state with new array values */
    replace(values: T): void;

    observe<I extends number>(i: I, reaction: Reaction<T[I]>): Cleanup;
    observe(reaction: Reaction<T>): Cleanup;

    makeComputed<I extends number, U = any>(index: I, func: (value: T[I]) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
    makeAllComputed<U = any>(func: (value: TupleState<T>) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
};

export type TupleState<T extends any[] = any[]> = State & T & TupleExtensions<T>;

export function isTupleState(src: any): src is TupleState {
    return src?.[STATE] === "tuple";
}

export function createTuple<T extends any[] = any[]>(initialValue: T = [] as any) {
    const topLevelId = getNextId();
    const lengthId = getNextId();

    let values = [...initialValue];
    const stateIds = Array(values.length).fill(0).map(() => getNextId());

    let comparator = comparators.eqeqeq;

    const inertGetter = i => values[i];
    const reactiveGetter = i => {
        if(!stateIds[i]) {
            values[i] = undefined;
            stateIds[i] = getNextId();
        }

        handleSubscription(stateIds[i], {
            stateContainer: tuple,
            id: stateIds[i],
            get: () => values[i]
        });

        return values[i];
    }

    const fakePrototype = {
        // TODO: Should this be values.concat() for safety? What are the use cases for inert?
        get inert() { return values },

        copyWithin: () => { throw new Error("copyWithin() not yet supported") },
        concat: (...others) => values.concat(...others),
        get: i => !arguments.length ? values : inertGetter(i),
        size: () => values.length,
        at: reactiveGetter,

        join: (...others) => {
            handleSubscription(topLevelId, {
                stateContainer: tuple,
                id: topLevelId,
                get: () => values.concat(...others),
            });

            return values.concat(...others);
        },

        swap: (a, b) => {
            if(!stateIds[a]) {
                values[a] = undefined;
                stateIds[a] = getNextId();
            }

            if(!stateIds[b]) {
                values[b] = undefined;
                stateIds[b] = getNextId();
            }

            const swap = values[b];
            values[b] = values[a];
            values[a] = swap;

            trigger(topLevelId, values);
            trigger(stateIds[a], swap);
            trigger(stateIds[b], values[b]);
        },

        makeComputed: (i, func, eager, awaitPromise) => createComputed(() => func(reactiveGetter(i)), eager, awaitPromise),
        makeAllComputed: (func, eager, awaitPromise) => createComputed(() => func(tuple), eager, awaitPromise),

        observe: (i, reaction) => {
            if(typeof i !== "function") {
                return addReaction(stateIds[i], reaction);
            }

            return addReaction(topLevelId, reaction);
        },

        replace: newValues => {
            const lengthChanged = values.length !== newValues.length;

            const newIndices = newValues.length - values.length;
            values = [...newValues];

            trigger(topLevelId, values);
            stateIds.forEach((id, i) => trigger(id, values[i]));

            if(lengthChanged) {
                trigger(lengthId, values.length);
            }

            // Backfill new state IDs
            if(newIndices > 0) {
                const newIds = Array(newIndices).fill(0).map(() => getNextId());
                stateIds.push(...newIds);
            }
        },

        // TODO: Create .subtuple() for a better reactive slice
        slice: (start, end) => {
            const idSlice = stateIds.slice(start, end);

            idSlice.forEach((id, i) => {
                handleSubscription(id, {
                    stateContainer: tuple,
                    id: id,
                    get: () => values.slice(start, end)[i]
                });
            });

            return values.slice(start, end);
        },

        fill: value => {
            values.fill(value);
            trigger(topLevelId, values);
            stateIds.forEach(id => trigger(id, value));

            return tuple;
        },
        pop: () => {
            if(!values.length) return;

            const value = values.pop();
            const stateId = stateIds.pop()!; // TODO: Cache and reuse state IDs?

            trigger(topLevelId, values);
            trigger(stateId, undefined);
            trigger(lengthId, values.length);

            return value;
        },
        push: (...values) => {
            const result = values.push(...values);
            stateIds.push(...values.map(() => getNextId()));

            trigger(topLevelId, values);
            trigger(lengthId, values.length);

            return result;
        },
        // These one is funny because we want to mutate the state but not the IDs
        reverse: () => {
            values.reverse();
            trigger(topLevelId, values);
            stateIds.forEach((id, i) => trigger(id, values[i]));
            return tuple;
        },
        shift: () => {
            const result = values.shift();
            trigger(topLevelId, values);
            trigger(lengthId, values.length);
            stateIds.forEach((id, i) => trigger(id, values[i]));

            return result;
        },
        sort: (...args) => {
            values.sort(...args);
            stateIds.forEach((id, i) => trigger(id, values[i]));

            return tuple;
        },
        splice: (start, count, ...items) => {
            const newIndices = values.length - count + items.length;
            values.splice(start, count, ...items);
            trigger(topLevelId, values);
            trigger(lengthId, values.length);
            stateIds.forEach((id, i) => trigger(id, values[i]));

            // Backfill new state IDs
            if(newIndices > 0) {
                const newIds = Array(newIndices).fill(0).map(() => getNextId());
                stateIds.push(...newIds);
            }

            return tuple;
        },
        unshift: (...items) => {
            const n = values.unshift(...items);
            trigger(lengthId, values.length);
            stateIds.forEach((id, i) => trigger(id, values[i]));

            const newIds = Array(items.length).fill(0).map(() => getNextId());
            stateIds.push(...newIds);

            return n;
        }
    };

    for(const prop of listenableProps) {
        if(fakePrototype[prop]) continue;

        fakePrototype[prop] = (...args) => {
            handleSubscription(topLevelId, {
                stateContainer: values,
                id: topLevelId,
                get: () => (values as any)[prop](...args)
            });

            return (values as any)[prop](...args);
        };
    }

    for(const prop of mutativeProps) {
        if(fakePrototype[prop]) continue;

        fakePrototype[prop] = (...args) => {
            const result = (values as any)[prop](...args);
            trigger(topLevelId, []);

            return result;
        };
    }

    const tuple = new Proxy(values, {
        get(_, prop) {
            if(fakePrototype[prop]) {
                return fakePrototype[prop];
            }

            if(prop === STATE) return "tuple";
            if(prop === IDENT) return topLevelId;
            if(prop === COMPARATOR) return comparator;
            if(prop === INTERNALS) return {
                stateIds,
                values,
                topLevelId,
                fakePrototype,
                inertGetter,
                reactiveGetter
            };

            if(prop === "length") {
                handleSubscription(lengthId, {
                    stateContainer: tuple,
                    id: lengthId,
                    get: () => values.length,
                });

                return values.length;
            }

            // TODO: Make this secure against mutations
            if(prop === Symbol.iterator) {
                handleSubscription(topLevelId, {
                    stateContainer: tuple,
                    id: topLevelId,
                    get: () => values[Symbol.iterator],
                });

                return values[Symbol.iterator];
            }

            // TODO: Support other symbols
            if(typeof prop === "symbol") {
                console.log("Found some weird symbol", prop);
                return null;
            }

            if(!isNaN(Number(prop))) {
                return reactiveGetter(prop);
            }
        },
        set(_, prop, value) {
            if(forbiddenProps.includes(prop)) return true;

            if(prop === COMPARATOR) {
                comparator = value;
            }

            if(prop === "length") {
                if(value !== 0) {
                    console.warn("TupleState does not support setting the length to anything but 0");
                    return true;
                }

                fakePrototype.replace([]);
                return true;
            }

            if(typeof prop === "symbol") return true; // Just don't worry about it for now
            if(isNaN(Number(prop))) return true; // Filters out prototype methods
            if(comparator(values[prop], value)) return true; // Don't propagate if value is "identical"

            if(!stateIds[prop]) {
                stateIds[prop] = getNextId();
            }

            const oldLength = values.length;
            values[prop] = value;
            trigger(topLevelId, values);
            trigger(stateIds[prop], value);

            if(oldLength !== values.length) {
                trigger(lengthId, values.length);
            }

            return true;
        },
        has(_, prop) {
            return Object.hasOwn(values, prop);
        }
    }) as TupleState<T>;

    return tuple;
}
