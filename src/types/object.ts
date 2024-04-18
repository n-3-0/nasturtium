import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { IDENT, STATE, COMPARATOR, getNextId, INTERNALS } from "../constants";
import * as comparators from "../comparator";
import { box, Boxed } from "../utilities";
import * as addons from "../addons";

import { createComputed, type ComputedState } from "./computed";
import type { ObjectKeyMap } from "./map";

import type { $Object } from "./object.extensions";

type ObjectStateMethods<T extends object = {}> = {
    readonly [STATE]: "object";
    [COMPARATOR]: comparators.Comparator<T>;

    /** This is just for type exposure, not actually provided */
    readonly _type: T;

    /**
     * @inert This will return a copy of the original, to avoid external mutation
     */
    get(): T;

    /** @inert */
    get<K extends keyof T>(key: K): T[K];
    /** @inert */
    get(key: string): any;

    getAll<K extends (keyof T)[]>(...keys: [...K]): ObjectKeyMap<K, T>;
    getAll(...keys: string[]): any[];

    set<K extends keyof T>(key: K, value: T[K]);
    set(key: string, value: any);

    subset<K extends keyof T>(key: K): Boxed<T[K], { get(): T[K] }>;
    subset(key: string): Boxed<any, { get(): any }>;
    subset<K extends keyof T>(...keys: K[]): { [X in K]: T[X] };
    subset<K extends string>(...keys: K[]): { [X in K]: X extends keyof T ? T[X] : any };

    observe<K extends keyof T>(key: K, reaction: Reaction<T[K]>): () => void;
    observe(key: string, reaction: Reaction): () => void;

    // Any responds to any change with that specific change, all response to any change with the full state
    observeAny(reaction: Reaction<{ key: string, value: any }>): () => void;
    observeAll(reaction: Reaction<T>): () => void;

    use(): T;
    use<K extends (keyof T)[]>(...keys: [...K]): ObjectKeyMap<K, T>;
    use(reaction?: Reaction<T> | undefined): void;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
}

export type ObjectState<T extends object = {}> = T & ObjectStateMethods<T> & $Object<T>;

export function isObjectState(src: any): src is ObjectState {
    return src?.[STATE] === "object";
}

export const ObjectAccessor = {
    inert: <T extends object = {}>(state: ObjectState<T>, key: string) => state.get(key),
    reactive: <T extends object = {}>(state: ObjectState<T>, key: string) => state[key]
};

export function createObject<T extends object = {}>(
    initialValue?: T // TODO: This isn't sanitized like the proxy's keys are
): ObjectState<T> {
    if(isObjectState(initialValue)) return initialValue as any;

    const internals = {
        values: {} as Record<string, any>,
        ids: new Map<string, number>(),
        keys: [] as string[],
        comparator: comparators.eqeqeq
    };

    const id = getNextId();
    const observeAllChannel = getNextId();

    Object.entries(initialValue ?? {}).forEach(([ key, value ]) => {
        const id = getNextId();
        internals.keys.push(key);
        internals.ids.set(key, id);
        internals.values[key] = value;
    });

    const object = {
        [STATE]: "object",
        [IDENT]: id,
        [INTERNALS]: internals,

        get [COMPARATOR]() { return internals.comparator },

        get: (key) => {
            if(key === undefined) {
                //! TODO: Use deepClone() here - check for performance first, maybe a flag on initialize?
                return internals.values;
            }

            return internals.values[key];
        },

        getAll: (...keys) => {
            return keys.map(key => internals.values[key]) as any;
        },

        set: (key, value) => {
            if(!internals.ids.has(key)) {
                internals.ids.set(key, getNextId());
            }

            const keyId = internals.ids.get(key)!;

            if(internals.values[key] === value) return;

            internals.values[key] = value;

            trigger(observeAllChannel, internals.values);
            trigger(id, { key, value });
            trigger(keyId, value);
        },

        observe: (key, reaction) => {
            if(!internals.ids.has(key)) {
                internals.ids.set(key, getNextId());
            }

            return addReaction(internals.ids.get(key)!, reaction);
        },

        observeAny: (reaction) => {
            return addReaction(id, reaction);
        },

        observeAll: reaction => {
            return addReaction(observeAllChannel, reaction);
        },

        subset: (...keys) => {
            if(keys.length === 1) {
                const [ key ] = keys;

                if(!internals.ids.has(key)) {
                    internals.ids.set(key, getNextId());
                }

                const id = internals.ids.get(key)!;
                return box(
                    () => (processDependents(id), internals.values[key]),
                    value => (internals.values[key], trigger(id, value)),
                    { get: () => internals.values[key] }
                );
            }

            const subset = createObject();
            const other = subset[INTERNALS];

            // Let's just clone the whole thing and not tell anyone
            other.values = internals.values;
            other.ids = internals.ids;
            other.keys = internals.keys;

            return subset;
        },

        use: (reaction, ...keys) => {
            if(typeof reaction === "function" || arguments.length === 0) {
                processDependents(id);
                return internals.values;
            }

            keys = [reaction, ...keys];

            return keys.map(key => {
                if(!internals.ids.has(key)) return null;

                const keyId = internals.ids.get(key)!;
                processDependents(keyId);
                return internals.values[key];
            }) as any;
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(proxy), eager, awaitPromise)
    } as any as ObjectState<T>;

    internals.keys.push(...Object.keys(object));

    const proxy = new Proxy(internals.values, {
        get(_, key: any) {
            if(object[key]) return object[key];

            if(!internals.ids.has(key)) internals.ids.set(key, getNextId());
            const keyId = internals.ids.get(key)!;

            processDependents(keyId);

            return internals.values[key];
        },

        set(_, key: any, value) {
            if(key === COMPARATOR) {
                internals.comparator = value;
                return true;
            }

            if(object[key]) return true;

            if(!internals.ids.has(key)) internals.ids.set(key, getNextId());
            const keyId = internals.ids.get(key)!;

            if(internals.comparator(internals.values[key], value)) return true;

            (internals.values as any)[key] = value;
            trigger(observeAllChannel, internals.values);
            trigger(id, { key, value });
            trigger(keyId, value);

            return true;
        },

        // TODO: Support other attribute things
        defineProperty(_, key: any, attribute) {
            if(object[key]) return true;
            const value = attribute.value;

            if(!internals.ids.has(key)) internals.ids.set(key, getNextId());
            const keyId = internals.ids.get(key)!;

            if(!internals.keys.includes(key)) {
                internals.keys.push(key);
            }

            if(internals.comparator(internals.values[key], value)) return true;

            (internals.values as any)[key] = value;
            trigger(observeAllChannel, internals.values);
            trigger(id, { key, value });
            trigger(keyId, value);

            return true;
        },

        deleteProperty(_, key: any) {
            if(object[key]) return false;
            if(!Object.hasOwn(internals.values, key)) return false;

            const keyId = internals.ids.get(key);
            internals.keys.splice(internals.keys.indexOf(key), 1);

            delete internals.values[key];

            if(keyId) {
                trigger(keyId, undefined);
                internals.ids.delete(key);
            }

            trigger(observeAllChannel, internals.values);
            trigger(id, { key, value: undefined });
            return true;
        },

        getOwnPropertyDescriptor(_, key: any) {
            if(object[key]) return Object.getOwnPropertyDescriptor(object, key);
        },

        getPrototypeOf() {
            return {};
        },

        has(_, key: any) {
            return !!object[key] || internals.keys.includes(key);
        },

        ownKeys() {
            return internals.keys;
        }
    }) as ObjectState<T>;

    addons.use("object", proxy, object);

    return proxy;
}
