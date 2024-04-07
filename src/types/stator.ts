import { Cleanup } from "manifold";
import { COMPARATOR, IDENT, STATE, getNextId, type State } from "../constants";
import { ComputedState, createComputed } from "./computed";

export type Stator<T extends Record<any, any> = Record<any, any>> = State & {
    readonly [STATE]: "stator";
    /** @reactive */
    <K extends keyof T>(input: K): T[K];

    get<K extends keyof T>(input: K): T[K];
    /** @reactive */
    use<K extends keyof T>(input: K): T[K];
    /** Precompute from a set of known parameters */
    seed<K extends (keyof T)[]>(...inputs: [...K]): void;

    observe<K extends keyof T>(input: K, reaction: (value: T[K]) => void): Cleanup;
}

export function createStator<T extends Record<any, any> = Record<any, any>>(memoizer: <K extends keyof T>(input: K) => T[K]) {
    const id = getNextId(); // Technically not necessary, but who knows what the future demands
    const cache: Record<any, ComputedState<any>> = {};

    const stator = (k => {
        return (cache[k] ??= createComputed(() => memoizer(k))).use();
    }) as Stator<T>;

    Object.defineProperty(stator, STATE, { value: "stator" });
    Object.defineProperty(stator, IDENT, { value: id });
    Object.defineProperty(stator, COMPARATOR, { value: null });

    stator.get = (k => {
        // TODO: Implement stator.get()
        if(!arguments.length) return {};

        if(cache[k]) {
            return cache[k].get();
        }

        return (cache[k] = createComputed(() => memoizer(k))).get();
    }) as any;

    // I'm lazy, it works, don't worry about it... just don't try to stringify it!
    stator.use = k => stator(k);

    stator.seed = (...keys) => {
        for(const key of keys) {
            cache[key] ??= createComputed(() => memoizer(key));
        }
    };

    stator.observe = (key, reaction) => {
        cache[key] ??= createComputed(() => memoizer(key));
        return cache[key].observe(reaction);
    }

    return stator;
}
