import { Reaction, addReaction, trigger, processDependents } from "../manifold";
import { IDENT, STATE, COMPARATOR, getNextId } from "../constants";
import * as comparators from "../comparator";

import { ObjectKeyMap } from "./map";
import { type PrimitiveState, createPrimitive } from "./primitive";
import { createComputed, type ComputedState } from "./computed";

type ObjectStateMethods<T extends object = {}> = {
    readonly [STATE]: "object";
    [COMPARATOR]: comparators.Comparator<T>;

    /** This is just for type exposure, not actually provided */
    readonly _type: T;

    /**
     * NOTE: get() methods are non-reactive
     * NOTE: This will return a copy of the original, to avoid external mutation
     */
    get(): T;

    /** NOTE: get() methods are non-reactive */
    get<K extends keyof T>(key: K): T[K];
    /** NOTE: get() methods are non-reactive */
    get(key: string): any;

    getAll<K extends (keyof T)[]>(...keys: [...K]): ObjectKeyMap<K, T>;
    getAll(...keys: string[]): any[];

    /**
     * Turn a property of the state into a primitive, so it can be independently reactive in a more compact way
     */
    primitive<K extends keyof T>(key: K, defaultValue?: T): PrimitiveState<T[K]>;
    primitive<T = any>(key: string, defaultValue?: T): PrimitiveState<T>;

    set<K extends keyof T>(key: K, value: T[K]);
    set(key: string, value: any);

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

export type ObjectState<T extends object = {}> = T & ObjectStateMethods<T>;

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

    const values = Object.fromEntries(Object.entries({ ...(initialValue as any) })) as Record<string, any>;
    const ids = new Map();
    const id = getNextId();
    const observeAllChannel = getNextId();

    const keys: any[] = Object.keys(values);
    let comparator = comparators.eqeqeq<T>;

    const object = {
        [STATE]: "object",
        [IDENT]: id,

        get [COMPARATOR]() { return comparator },

        get: (key) => {
            if(key === undefined) {
                //! TODO: Use deepClone() here - check for performance first, maybe a flag on initialize?
                return values;
            }

            return values[key];
        },

        getAll: (...keys) => {
            return keys.map(key => values[key]) as any;
        },

        set: (key, value) => {
            if(!ids.has(key)) {
                ids.set(key, getNextId());
            }

            const keyId = ids.get(key);

            if(values[key] === value) return;

            values[key] = value;

            trigger(observeAllChannel, values);
            trigger(id, { key, value });
            trigger(keyId, value);
        },

        primitive: (key, defaultValue) => {
            if(!ids.has(key)) {
                ids.set(key, getNextId());
            }

            const keyId = ids.get(key);

            if(!Object.hasOwn(values, key)) {
                values[key] = defaultValue;
                keys.push(key);
            }

            const primitive = (createPrimitive as any)(values[key] , keyId, {
                get value() {
                    return values[key];
                },
                set value(newValue) {
                    values[key] = newValue;
                }
            });

            return primitive;
        },

        observe: (key, reaction) => {
            if(!ids.has(key)) {
                ids.set(key, getNextId());
            }

            return addReaction(ids.get(key), reaction);
        },

        observeAny: (reaction) => {
            return addReaction(id, reaction);
        },

        observeAll: reaction => {
            return addReaction(observeAllChannel, reaction);
        },

        use: (reaction, ...keys) => {
            if(typeof reaction === "function" || arguments.length === 0) {
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

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(proxy), eager, awaitPromise)
    } as any as ObjectState<T>;

    keys.push(...Object.keys(object));

    const proxy = new Proxy(values, {
        get(_, key: any) {
            if(object[key]) return object[key];

            if(!ids.has(key)) ids.set(key, getNextId());
            const keyId = ids.get(key);

            processDependents(keyId);

            return values[key];
        },

        set(_, key: any, value) {
            if(key === COMPARATOR) {
                comparator = value;
                return true;
            }

            if(object[key]) return true;

            if(!ids.has(key)) ids.set(key, getNextId());
            const keyId = ids.get(key);

            if(comparator(values[key], value)) return true;

            (values as any)[key] = value;
            trigger(observeAllChannel, values);
            trigger(id, { key, value });
            trigger(keyId, value);

            return true;
        },

        // TODO: Support other attribute things
        defineProperty(_, key: any, attribute) {
            if(object[key]) return true;
            const value = attribute.value;

            if(!ids.has(key)) ids.set(key, getNextId());
            const keyId = ids.get(key);

            if(!keys.includes(key)) {
                keys.push(key);
            }

            if(comparator(values[key], value)) return true;

            (values as any)[key] = value;
            trigger(observeAllChannel, values);
            trigger(id, { key, value });
            trigger(keyId, value);

            return true;
        },

        deleteProperty(_, key: any) {
            if(object[key]) return false;
            if(!Object.hasOwn(values, key)) return false;

            const keyId = ids.get(key);
            keys.splice(keys.indexOf(key), 1);

            delete values[key];

            if(keyId) {
                trigger(keyId, undefined);
                ids.delete(keyId);
            }

            trigger(observeAllChannel, values);
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
            return !!object[key] || keys.includes(key);
        },

        ownKeys() {
            return keys;
        }
    }) as ObjectState<T>;

    return proxy;
}
