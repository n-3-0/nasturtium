import { addReaction, handleSubscription, trigger } from "../manifold";
import { COMPARATOR, IDENT, STATE, State, getNextId } from "../constants";
import * as comparators from "../comparator";
import { createComputed, type ComputedState } from "./computed";

export interface Semaphore<T = void> extends State {
    readonly [STATE]: "semaphore";
    get(): T;
    /** @reactive */
    use(): T;
    /** Watch the signal, with a cleanup handler */
    observe(trigger: (value: T) => void): () => void;
    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;

    /** @inert */
    readonly lastValue: T | undefined;
    /** @inert */
    readonly context: any;
}

export function isSemaphore(obj: any): obj is Semaphore {
    return obj?.[STATE] === "semaphore";
}

/**
 * A Semaphore is a mix between a Signal and a Computed. The return value of the function will determine the initial
 * value, and the callback provided will update the state. This can be used to create stateful data based on events
 * (e.g. window.navigator events)
 *
 * Calling use() will return the last value, which will be provided when sending the signal
 */
export function createSemaphore<T = void>(caller: (signal: (value?: any) => void, context: any) => T): Semaphore<T> {
    const id = getNextId();

    const context: any = {};
    let comparator: comparators.Comparator<T>;
    let lastValue: any = undefined;
    let currentValue: T = caller(value => {
        if(comparator?.(currentValue, value)) return;

        lastValue = currentValue;
        currentValue = value;
        trigger(id, value);
    }, context);

    const semaphore: Semaphore<T> = {
        [STATE]: "semaphore",
        [IDENT]: id,
        [COMPARATOR]: null,
        get: () => currentValue,
        observe: reaction => addReaction(id, reaction),
        use: () => {
            handleSubscription(id, {
                stateContainer: semaphore,
                id,
                get: () => currentValue,
            });

            return currentValue;
        },
        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(semaphore.use()), eager, awaitPromise),

        get lastValue() {
            return lastValue;
        },

        get context() {
            return context;
        }
    };

    Object.defineProperty(semaphore, COMPARATOR, {
        get: () => comparator,
        set: (newComparator) => comparator = newComparator,
    });

    return semaphore;
}
