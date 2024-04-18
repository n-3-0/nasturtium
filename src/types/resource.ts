// TODO: Do not use primitive for this
import { processDependents, trigger } from "../manifold";
import { STATE, COMPARATOR, getNextId, IDENT, State } from "../constants";
import { createPrimitive } from "./primitive";
import { createComputed, type ComputedState } from "./computed";
import * as addons from "../addons";

import type { $Resource } from "./resource.extensions";

export type AwaitedResource<T> = { waiting: boolean, error: any, result: T };

export type Resource<T> = State & {
    readonly [STATE]: "resource";
    readonly [COMPARATOR]: null;

    /** @reactive */
    readonly waiting: boolean;
    /** @reactive */
    readonly error: any;
    /** @reactive */
    readonly result: T;

    readonly signal: AbortSignal;

    /** @inert */
    isWaiting(): boolean;
    /** @inert */
    getError(): any;
    /** @inert */
    getResult(): T;

    refresh(abort?: boolean): Promise<T>;
    abort(reason?: any): void;

    /** @inert */
    get(): T;
    /** @reactive */
    use(): AwaitedResource<T>;

    makeComputed<U = any>(func: (value: AwaitedResource<T>) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
} & $Resource<T>;

export function createResource<T = any>(
    provider: (signal: AbortSignal) => Promise<T> | T,
    immediate = false
): Resource<T> {
    const id = getNextId();
    let controller = new AbortController();

    const waiting = createPrimitive(immediate);
    const error = createPrimitive<any>(null);
    const result = createPrimitive<T>();

    const state: Resource<T> = {
        [STATE]: "resource" as const,
        [IDENT]: id,
        [COMPARATOR]: null,

        isWaiting: () => waiting.get(),
        get waiting() {
            return waiting.value;
        },

        getError: () => error.get(),
        get error() {
            return error.value;
        },

        getResult: () => result.get(),
        get result() {
            return result.value;
        },

        get signal() {
            return controller?.signal;
        },

        abort: reason => void(controller?.abort(reason)),
        refresh: (abort = false) => {
            if(abort) {
                controller?.abort('refresh');
            }

            waiting.value = true;
            controller = new AbortController();
            const value = provider(controller.signal);

            return Promise.resolve(value)
                .then(val => (
                    error.value = null,
                    result.value = val,
                    waiting.value = false,
                    trigger(id, { result: val, waiting: false, error: null }),
                    val
                )).catch(ex => (
                    result.value = null as T,
                    error.value = ex,
                    waiting.value = false,
                    trigger(id, { result: null, waiting: false, error: ex }),
                    ex
                ));
        },

        get: () => result.get(),

        use: () => {
            processDependents(id);

            return {
                waiting: waiting.get(),
                error: error.get(),
                result: result.get()
            } as any;
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(state.use()), eager, awaitPromise)
    };

    addons.use("resource", state, { waiting, error, result });

    return state;
}
