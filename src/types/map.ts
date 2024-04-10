import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { IDENT, STATE, COMPARATOR, State, getNextId } from "../constants";
import * as comparators from "../comparator";
import { createComputed, type ComputedState } from "./computed";

export type ObjectKeyMap<
  K extends readonly any[],
  O extends { [key in K[number]]: any }
> = K extends readonly []
  ? []
  : K extends readonly [infer H, ...infer T]
  ? [O[H], ...ObjectKeyMap<T, O>]
  : never;

export interface MapState<T extends object = {}> extends State {
    readonly [STATE]: "map";
    [COMPARATOR]: comparators.Comparator<T>;

    get<K extends keyof T>(key: K): T[K];
    get(key: string): any;
    get(): T;

    getAll<K extends (keyof T)[]>(...keys: [...K]): ObjectKeyMap<K, T>;
    getAll(...keys: string[]): any[];

    set<K extends keyof T>(key: K, value: T[K]);
    set(key: string, value: any);

    observe<K extends keyof T>(key: K, reaction: Reaction<T[K]>): () => void;
    observe(key: string, reaction: Reaction): () => void;

    observeAny(reaction: Reaction<{ key: string, value: any }>): () => void;

    /** @reactive */
    use<K extends (keyof T)[]>(...keys: [...K]): ObjectKeyMap<K, T>;
    use(...keys: string[]): Record<string, any>;
    use(reaction?: Reaction<T> | undefined): void;

    makeComputed<U = any>(func: (state: MapState<T>) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
}

export function isMapState(src: any): src is MapState {
    return src?.[STATE] === "map";
}

export const MapAccessor = {
    inert: <T extends object = {}>(state: MapState<T>, key: string) => state.get(key),
    reactive: <T extends object = {}>(state: MapState<T>, key: string) => state.use(key)
};

export function createMap<T extends object = {}>(
    initialValue?: T
): MapState<T> {
    if(isMapState(initialValue)) return initialValue as any;

    const values = Object.fromEntries(Object.entries({ ...(initialValue || {}) })) as Record<string, any>;
    const ids = new Map();
    const id = getNextId();
    let comparator = comparators.eqeqeq<T>;

    const map = Object.freeze({
        [STATE]: "map",
        [IDENT]: id,

        get [COMPARATOR]() { return comparator },
        set [COMPARATOR](func) { comparator = func; },

        // TODO: Error on get()
        get(key?: any) {
            if(!arguments.length) return new Map(Object.entries(values));

            return values[key];
        },

        getAll(...keys) {
            return keys.map(key => values[key]) as any;
        },

        set(key, value) {
            if(!ids.has(key)) {
                ids.set(key, getNextId());
            }

            const keyId = ids.get(key);

            if(comparator(values[key], value)) return;

            values[key] = value;

            trigger(id, { key, value });
            trigger(keyId, value);
        },

        observe(key, reaction) {
            if(!ids.has(key)) {
                ids.set(key, getNextId());
            }

            return addReaction(ids.get(key), reaction);
        },

        observeAny(reaction) {
            return addReaction(id, reaction);
        },

        use(reaction, ...keys) {
            if(typeof reaction === "function") {
                processDependents(id);
                return values;
            }

            keys = [reaction, ...keys];

            return keys.map(key => {
                if(!ids.has(key)) return null;

                const keyId = ids.get(key);
                processDependents(keyId);

                return values[key];
            }) as any;
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(map), eager, awaitPromise)
    }) as MapState<T>;

    return map;
}