import { addReaction, processDependents, trigger } from "../manifold";
import { COMPARATOR, IDENT, STATE, State, getNextId } from "../constants";
import { createComputed, type ComputedState } from "./computed";
import * as addons from "../addons";

import type { $Signal } from "./signal.extensions";

export type Signal<T = void> = State & {
    readonly [STATE]: "signal";
    readonly [COMPARATOR]: null;

    /** Activate the signal */
    (value: T): void;
    /** @reactive */
    use(): T;
    /** Watch the signal, with a cleanup handler */
    observe(trigger: (value: T) => void): () => void;

    get lastValue(): T;

    /** Note: Even if the signal may not always have a value, this can be useful for normally-unreactive data */
    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
} & $Signal<T>;

export function isSignal(obj: any): obj is Signal {
    return obj?.[STATE] === "signal";
}

/**
 * A signal is a very simple pub/sub trigger, optionally with a return value
 *
 * Calling use() will return the last value, which will be provided when sending the signal
 *
 * Calling use() for the first time will return undefined, as the signal has never been sent before
 */
export function createSignal<T = void>(initialValue?: T): Signal<T> {
    const id = getNextId();

    let lastValue: T = initialValue!;
    const signal = ((value) => void(lastValue = value, trigger(id, value))) as Signal<T>;
    (signal as any)[STATE] = "signal";
    (signal as any)[IDENT] = id;
    (signal as any)[COMPARATOR] = null;

    signal.observe = reaction => addReaction(id, reaction);
    signal.use = () => {
        processDependents(id);
        return lastValue;
    };

    signal.makeComputed = (func, eager, awaitPromise) => createComputed(() => func(signal.use()), eager, awaitPromise)

    Object.defineProperty(signal, "lastValue", { get: () => lastValue });
    Object.defineProperty(signal, COMPARATOR, { set: () => {} });

    addons.use("signal", signal, {});

    return signal;
}
