import { makeAgent } from "./agent";
import { useAgent } from "./manifold"
import { isPromise, wrap } from "./utilities";

/**
 * This wrapper will re-run the provided function whenever dependencies change.
 */
export function reactive<T = void>(body: (lastValue?: T) => Promise<T> | T) {
    let _lastValue = undefined as T;
    const caller = () => {
        const result = body(_lastValue);
        if(isPromise<T>(result)) {
            return result.then(value => _lastValue = value);
        }

        return (_lastValue = result);
    };

    const agent = makeAgent(caller);
    const cleanup = useAgent(agent);

    const result = caller();
    if(isPromise<T>(result)) {
        result.then(cleanup);
    } else {
        cleanup();
    }

    return wrap(() => _lastValue, { agent });
}

/**
 * This wrapper will run the provided function, preventing reactivity therein
 */

export function inert<T>(body: () => T): T
export function inert<T extends Promise<any>>(body: () => T): T {
    const cleanup = useAgent();
    const result = body();

    if(isPromise(result)) {
        return result.then(value => (cleanup(), value)) as T;
    }

    cleanup();
    return result;
}

type Func<A extends any[] = any[], R = any> = (...args: A) => R;

/**
 * This will create a wrapped function that disables reactivity within.
 * This is useful for React components that do not need reactivity, for example.
 *
 * NOTE: Do not use makeInert() with async functions, use makeAsyncInert()
 */
export function makeInert<T extends Func>(func: T): T extends Func<any[], Promise<any>> ? never : T {
    return ((...args) => {
        const cleanup = useAgent();
        func(...args);
        cleanup();
    }) as T extends Func<any[], Promise<any>> ? never : T;
}

/**
 * This will create a wrapped function that disables reactivity within while supporting promises.
 */
export function makeAsyncInert<T extends Func>(func: T) {
    return ((...args) => {
        const cleanup = useAgent();
        return Promise.resolve(func(...args)).then((val: ReturnType<T>) => (cleanup(), val));
    }) as T;
}
